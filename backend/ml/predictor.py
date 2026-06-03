import os
import sys

sys.path.append(
    r"D:\ECGsuite\backend\ml\models\v2"
)

from LightECGNet_v2_inference import LightECGNetInference


class ECGPredictor:

    def __init__(self):

        BASE_DIR = os.path.dirname(
            os.path.abspath(__file__)
        )

        V2_DIR = os.path.join(
            BASE_DIR,
            "models",
            "v2"
        )

        self.model = LightECGNetInference(
            models_dir=os.path.join(
                V2_DIR,
                "models"
            ),
            classes_json=os.path.join(
                V2_DIR,
                "models",
                "classes.json"
            )
        )

    def predict_signal(self, signal):

        return self.model.predict_signal_array(
            signal
        )