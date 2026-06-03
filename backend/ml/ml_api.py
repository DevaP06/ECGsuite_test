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

from predictor import ECGPredictor


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

with open(
    os.path.join(BASE_DIR, "metadata.json"),
    "r"
) as f:

    raw_data = json.load(f)

LABEL_INFO = {}

for item in raw_data:

    LABEL_INFO[
        item["Acronym Name"]
    ] = {
        "full_name": item["Full Name"],
        "snomed_ct": str(
            item["Snomed_CT"]
        )
    }


app = FastAPI()

predictor = ECGPredictor()

DIGITIZER_URL = (
    "http://127.0.0.1:8000/extract-signal"
)


@app.get("/")
def health():

    return {
        "status": "healthy"
    }


@app.post("/predict")
async def predict_ecg(
    file: UploadFile = File(...)
):

    suffix = os.path.splitext(
        file.filename
    )[1]

    temp_file = os.path.join(
        tempfile.gettempdir(),
        f"{uuid.uuid4()}{suffix}"
    )

    try:

        with open(temp_file, "wb") as f:
            f.write(
                await file.read()
            )

        with open(temp_file, "rb") as f:

            response = requests.post(
                DIGITIZER_URL,
                files={
                    "file": (
                        file.filename,
                        f,
                        file.content_type
                    )
                },
                timeout=300
            )

        response.raise_for_status()

        data = response.json()

        signal = np.array(
            data["signal"],
            dtype=np.float32
        )

        probs = predictor.predict_signal(
            signal
        )

        top5 = sorted(
            probs.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        top_predictions = []

        for label, prob in top5:

            info = LABEL_INFO.get(
                label,
                {}
            )

            top_predictions.append(
                {
                    "condition": label,
                    "full_name": info.get(
                        "full_name",
                        label
                    ),
                    "snomed_ct": info.get(
                        "snomed_ct"
                    ),
                    "probability": float(prob)
                }
            )

        return {
            "layout": data["layout"],
            "signal_shape": data["signal_shape"],
            "top_predictions": top_predictions
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if os.path.exists(
            temp_file
        ):
            os.remove(
                temp_file
            )