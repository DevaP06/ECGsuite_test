import os
import uuid
import tempfile
import json
import asyncio
import secrets
import logging

import numpy as np
import requests

from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import Depends
from fastapi import Header
from pydantic import BaseModel

from predictor import ECGPredictor


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "metadata.json"), "r") as f:
    raw_data = json.load(f)

LABEL_INFO = {}
for item in raw_data:
    LABEL_INFO[item["Acronym Name"]] = {
        "full_name": item["Full Name"],
        "snomed_ct": str(item["Snomed_CT"])
    }

with open(os.path.join(BASE_DIR, "label_mapping.json"), "r") as f:
    ONTOLOGY_LABEL_MAP = {
        k: v
        for k, v in json.load(f).items()
        if not k.startswith("_")
    }


app = FastAPI()
predictor = ECGPredictor()

DIGITIZER_URL = os.getenv("DIGITIZER_URL", "http://127.0.0.1:8000/extract-signal")
ONTOLOGY_URL  = os.getenv("ONTOLOGY_URL",  "http://127.0.0.1:8002/diagnose")

logger = logging.getLogger("ml_api")

# ── Security & load-shedding ──────────────────────────────────────────────────
# Shared secret the Node backend sends as the X-Internal-Key header
# (mlService.js). This VM is publicly reachable so Vercel can call it; without
# this gate anyone who finds the URL could run unlimited inference and drain
# compute credits. Must match the backend's INTERNAL_API_KEY exactly.
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# Max heavy inferences (digitize + DL model) allowed to run at once. Extra
# concurrent requests are shed with 429 instead of queueing, so a burst can't
# exhaust the VM's RAM/credits. /refine is excluded — it's a light, ontology-
# only call with no model inference.
ML_MAX_CONCURRENCY = int(os.getenv("ML_MAX_CONCURRENCY", "2"))
# Seconds a request may wait for a free slot before being rejected.
# 0 = reject immediately when all slots are busy.
ML_QUEUE_TIMEOUT = float(os.getenv("ML_QUEUE_TIMEOUT", "0"))

_heavy_semaphore = asyncio.Semaphore(ML_MAX_CONCURRENCY)

if not INTERNAL_API_KEY:
    logger.warning(
        "INTERNAL_API_KEY is not set — every inference endpoint will reject "
        "requests with 503. Set it to the same value as the backend's "
        "INTERNAL_API_KEY env var."
    )


def require_internal_key(
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
):
    """Reject callers that don't present the backend's shared secret.

    Fails closed: if INTERNAL_API_KEY is unset on this service, all requests are
    refused rather than silently running unauthenticated.
    """
    if not INTERNAL_API_KEY:
        raise HTTPException(status_code=503, detail="ML service auth is not configured")
    if not x_internal_key or not secrets.compare_digest(x_internal_key, INTERNAL_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing internal key")


async def heavy_slot():
    """Bounded-concurrency gate for the digitize+model endpoints.

    Holds one of ML_MAX_CONCURRENCY slots for the request's lifetime; if none is
    free within ML_QUEUE_TIMEOUT it sheds load with 429 rather than piling
    uploads up in memory/disk.
    """
    acquired = False
    try:
        if ML_QUEUE_TIMEOUT > 0:
            try:
                await asyncio.wait_for(_heavy_semaphore.acquire(), timeout=ML_QUEUE_TIMEOUT)
            except asyncio.TimeoutError:
                raise HTTPException(status_code=429, detail="ML service is busy — please retry shortly")
            acquired = True
        else:
            if _heavy_semaphore.locked():
                raise HTTPException(status_code=429, detail="ML service is busy — please retry shortly")
            await _heavy_semaphore.acquire()
            acquired = True
        yield
    finally:
        if acquired:
            _heavy_semaphore.release()


@app.get("/")
def health():
    return {"status": "healthy"}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _save_upload(file: UploadFile) -> str:
    suffix = os.path.splitext(file.filename)[1]
    path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}{suffix}")
    with open(path, "wb") as f:
        f.write(await file.read())
    return path


def _digitize(temp_file: str, filename: str, content_type: str) -> dict:
    with open(temp_file, "rb") as f:
        response = requests.post(
            DIGITIZER_URL,
            files={"file": (filename, f, content_type)},
            timeout=300
        )
    response.raise_for_status()
    return response.json()


def _run_model(signal_data: list) -> list:
    signal = np.array(signal_data, dtype=np.float32)
    probs = predictor.predict_signal(signal)

    top5 = sorted(probs.items(), key=lambda x: x[1], reverse=True)[:5]

    top_predictions = []
    for label, prob in top5:
        info = LABEL_INFO.get(label, {})
        top_predictions.append({
            "condition": label,
            "full_name": info.get("full_name", label),
            "snomed_ct": info.get("snomed_ct"),
            "probability": float(prob)
        })

    return top_predictions


_EMPTY_PATIENT = {"symptoms": {}, "risk_factors": {}, "vitals": {}}


def _to_ontology_model_output(label_probs: dict) -> dict:
    """Remap this model's acronym labels to the ontology's label_id vocabulary."""
    model_output = {}
    for condition, prob in label_probs.items():
        ontology_label = ONTOLOGY_LABEL_MAP.get(condition)
        if ontology_label is not None:
            model_output[ontology_label] = float(prob)
    return model_output


def _call_ontology(model_output: dict, patient: dict = None, patient_evidence: dict = None) -> dict:
    response = requests.post(
        ONTOLOGY_URL,
        json={
            "model_output": model_output,
            "patient": patient or _EMPTY_PATIENT,
            "patient_evidence": patient_evidence,
            "patient_id": None,
            "threshold": 0.10
        },
        timeout=60
    )
    response.raise_for_status()
    return response.json()


def _run_ontology(top_predictions: list, patient: dict = None, patient_evidence: dict = None) -> dict:
    label_probs = {p["condition"]: p["probability"] for p in top_predictions}
    model_output = _to_ontology_model_output(label_probs)
    return _call_ontology(model_output, patient, patient_evidence)


def _patient_from_demographics(age=None, gender=None) -> dict:
    """Build the ontology `patient` dict from the upload form's age/gender.

    Age < 40 sets the `young_age` risk factor that the ontology rule engine
    reads directly (rules V14/V22/V24), and is also placed in `vitals` so the
    ontology's Naive-Bayes layer can derive young_age on its own. This lets the
    upload path drive age-based context rules without the user having to fill
    the separate clinical-context questionnaire.

    Gender is accepted (the upload form sends it) but the ontology does not
    consume it yet, so it is intentionally not mapped here.
    """
    patient = {"symptoms": {}, "risk_factors": {}, "vitals": {}}
    try:
        age_val = float(age) if age is not None else 0.0
    except (TypeError, ValueError):
        return patient
    # age 0 is the "not provided" sentinel from the controller (Number(... || 0)).
    if age_val > 0:
        patient["vitals"]["age"] = age_val
        if age_val < 40:
            patient["risk_factors"]["young_age"] = True
    return patient


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/digitizer", dependencies=[Depends(require_internal_key), Depends(heavy_slot)])
async def digitizer_only(file: UploadFile = File(...)):
    """Signal processing only — returns raw signal from the digitizer service."""
    temp_file = await _save_upload(file)
    try:
        data = _digitize(temp_file, file.filename, file.content_type)
        return {
            "layout": data["layout"],
            "signal_shape": data["signal_shape"],
            "signal": data["signal"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


@app.post("/topprediction", dependencies=[Depends(require_internal_key), Depends(heavy_slot)])
async def top_prediction(file: UploadFile = File(...)):
    """Digitizer + DL model — returns top predictions. No ontology."""
    temp_file = await _save_upload(file)
    try:
        data = _digitize(temp_file, file.filename, file.content_type)
        top_predictions = _run_model(data["signal"])
        return {
            "layout": data["layout"],
            "signal_shape": data["signal_shape"],
            "top_predictions": top_predictions,
            "ontology": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


@app.post("/predict", dependencies=[Depends(require_internal_key), Depends(heavy_slot)])
async def predict(
    file: UploadFile = File(...),
    age: str | None = Form(None),
    gender: str | None = Form(None),
):
    """Full pipeline — digitizer + DL model + ontology enrichment.

    age/gender come from the upload form (forwarded by mlService.predictECG).
    age is passed into the ontology as the `young_age` risk factor so context
    rules can fire on the upload path, not only via the clinical-context
    questionnaire.
    """
    temp_file = await _save_upload(file)
    try:
        data = _digitize(temp_file, file.filename, file.content_type)
        top_predictions = _run_model(data["signal"])
        patient = _patient_from_demographics(age, gender)
        ontology = _run_ontology(top_predictions, patient=patient)
        return {
            "layout": data["layout"],
            "signal_shape": data["signal_shape"],
            "top_predictions": top_predictions,
            "ontology": ontology
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


class RefineRequest(BaseModel):
    # {model_acronym_label: probability} — the stored labelProbabilities from a
    # prior /predict run (keys are this model's acronyms, e.g. "AFIB", "SB").
    label_probabilities: dict
    # Structured patient history ({symptoms|risk_factors|vitals: {key: bool}}).
    patient: dict | None = None
    # Pre-computed Naive-Bayes evidence flags ({feature: bool}) from the
    # clinical-context wizard (chest_pain, cad, hr_gt_100, ...).
    patient_evidence: dict | None = None


@app.post("/refine", dependencies=[Depends(require_internal_key)])
def refine(req: RefineRequest):
    """Re-run ONLY the ontology stage against stored model probabilities plus
    patient clinical context. No image/digitizer/model inference — used to
    refine a diagnosis once the clinical-context questionnaire is submitted."""
    try:
        model_output = _to_ontology_model_output(req.label_probabilities)
        ontology = _call_ontology(model_output, req.patient, req.patient_evidence)
        return {"ontology": ontology}
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Ontology service error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
