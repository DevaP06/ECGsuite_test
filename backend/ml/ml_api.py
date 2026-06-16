import os
import uuid
import tempfile
import json

import numpy as np
import requests

from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException
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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/digitizer")
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


@app.post("/topprediction")
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


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Full pipeline — digitizer + DL model + ontology enrichment."""
    temp_file = await _save_upload(file)
    try:
        data = _digitize(temp_file, file.filename, file.content_type)
        top_predictions = _run_model(data["signal"])
        ontology = _run_ontology(top_predictions)
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


@app.post("/refine")
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
