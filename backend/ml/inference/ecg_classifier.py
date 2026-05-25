"""
ECG Classification Model

- Trains and persists preprocessing+model pipelines for Rhythm and Beat.
- Uses only features available at inference from images to avoid distribution shift.
"""

import os
import json
import pickle
from typing import Dict, Any, Optional

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier


RANDOM_STATE = 55

RAW_FEATURES = [
    "PatientAge",
    "Gender",
    "VentricularRate",
    "AtrialRate",
    "QRSCount",
    "regularity_score",
    "mean_peak_height",
]

TARGETS = ["Rhythm", "Beat"]


def _normalize_gender_column(df: pd.DataFrame) -> pd.DataFrame:
    if "Gender" not in df.columns:
        raise ValueError("Gender column missing")
    g = df["Gender"]
    if pd.api.types.is_numeric_dtype(g):
        df["Gender"] = g.map({0: "FEMALE", 1: "MALE"}).fillna("UNKNOWN")
    else:
        df["Gender"] = g.astype(str).str.upper().str.strip()
        df.loc[~df["Gender"].isin(["MALE", "FEMALE"]), "Gender"] = "UNKNOWN"
    return df


class ECGClassifier:
    def __init__(self, model_dir: Optional[str] = None):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = model_dir or os.path.abspath(os.path.join(script_dir, "../models"))
        os.makedirs(self.model_dir, exist_ok=True)

        self.rhythm_pipeline: Optional[Pipeline] = None
        self.beat_pipeline: Optional[Pipeline] = None
        self.metadata_path = os.path.join(self.model_dir, "metadata.json")
        self.model_path = os.path.join(self.model_dir, "trained_model.pkl")

    def _build_preprocessor(self) -> ColumnTransformer:
        categorical = ["Gender"]
        numeric = [c for c in RAW_FEATURES if c not in categorical]
        return ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
                ("num", "passthrough", numeric),
            ],
            remainder="drop",
            verbose_feature_names_out=False,
        )

    def _build_pipeline(self) -> Pipeline:
        pre = self._build_preprocessor()
        clf = RandomForestClassifier(
            n_estimators=50,
            max_depth=10,
            min_samples_split=6,
            min_samples_leaf=3,
            class_weight=None,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
        return Pipeline(steps=[("pre", pre), ("clf", clf)])

    def load_models(self) -> bool:
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    bundle = pickle.load(f)

                self.rhythm_pipeline = bundle.get("rhythm_pipeline")
                self.beat_pipeline = bundle.get("beat_pipeline")
                return (self.rhythm_pipeline is not None) and (self.beat_pipeline is not None)

            # Fallback: load legacy individual pipeline pickles if present
            legacy_dir = os.path.join(self.model_dir, "legacy")
            rhythm_legacy = os.path.join(legacy_dir, "rhythm_pipeline.pkl")
            beat_legacy = os.path.join(legacy_dir, "beat_pipeline.pkl")
            if os.path.exists(rhythm_legacy) and os.path.exists(beat_legacy):
                with open(rhythm_legacy, "rb") as f:
                    self.rhythm_pipeline = pickle.load(f)
                with open(beat_legacy, "rb") as f:
                    self.beat_pipeline = pickle.load(f)
                return (self.rhythm_pipeline is not None) and (self.beat_pipeline is not None)

            return False
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

    def save_models(self, rhythm_metrics: Dict[str, Any], beat_metrics: Dict[str, Any]) -> bool:
        try:
            bundle = {
                "rhythm_pipeline": self.rhythm_pipeline,
                "beat_pipeline": self.beat_pipeline,
                "raw_features": RAW_FEATURES,
                "targets": TARGETS,
                "rhythm_metrics": rhythm_metrics,
                "beat_metrics": beat_metrics,
                "random_state": RANDOM_STATE,
            }
            with open(self.model_path, "wb") as f:
                pickle.dump(bundle, f)

            meta = {
                "raw_features": RAW_FEATURES,
                "targets": TARGETS,
                "rhythm_metrics": rhythm_metrics,
                "beat_metrics": beat_metrics,
                "random_state": RANDOM_STATE,
            }
            with open(self.metadata_path, "w") as f:
                json.dump(meta, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving models: {e}")
            return False

    def _prepare_training_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        out = _normalize_gender_column(out)

        vr = out["VentricularRate"].astype(float).clip(lower=20, upper=220)
        out["regularity_score"] = (
            1.0 - (vr.rolling(window=5, min_periods=1).std().fillna(0) / 50.0)
        ).clip(0.0, 1.0)

        ar = out["AtrialRate"].astype(float).replace(0, 1.0)
        ratio = (vr / ar).clip(lower=0.2, upper=2.0)
        out["mean_peak_height"] = (ratio - ratio.min()) / (ratio.max() - ratio.min() + 1e-8)

        return out

    def train_models(self, data_path: str) -> Dict[str, Any]:
        try:
            df = pd.read_excel(data_path)

            file_required = [
                "PatientAge",
                "Gender",
                "VentricularRate",
                "AtrialRate",
                "QRSCount",
                "Rhythm",
                "Beat",
            ]
            missing = [c for c in file_required if c not in df.columns]
            if missing:
                return {"success": False, "error": f"Missing columns in training data: {missing}"}

            df = self._prepare_training_frame(df)

            X = df[RAW_FEATURES].copy()
            y_rhythm = df["Rhythm"].copy()
            y_beat = df["Beat"].copy()

            X_train, X_test, y_r_tr, y_r_te, y_b_tr, y_b_te = train_test_split(
                X, y_rhythm, y_beat, test_size=0.2, random_state=RANDOM_STATE, stratify=y_rhythm
            )

            self.rhythm_pipeline = self._build_pipeline()
            self.rhythm_pipeline.fit(X_train, y_r_tr)

            self.beat_pipeline = self._build_pipeline()
            self.beat_pipeline.fit(X_train, y_b_tr)

            r_pred = self.rhythm_pipeline.predict(X_test)
            b_pred = self.beat_pipeline.predict(X_test)

            rhythm_metrics = {
                "accuracy": float(accuracy_score(y_r_te, r_pred)),
                "macro_f1": float(f1_score(y_r_te, r_pred, average="macro", zero_division=0)),
            }
            beat_metrics = {
                "accuracy": float(accuracy_score(y_b_te, b_pred)),
                "macro_f1": float(f1_score(y_b_te, b_pred, average="macro", zero_division=0)),
            }

            self.save_models(rhythm_metrics, beat_metrics)

            return {
                "success": True,
                "rhythm_metrics": rhythm_metrics,
                "beat_metrics": beat_metrics,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _ensure_loaded(self) -> bool:
        if (self.rhythm_pipeline is None) or (self.beat_pipeline is None):
            return self.load_models()
        return True

    def predict(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self._ensure_loaded():
                return {"success": False, "error": "Models not available or could not be loaded"}

            input_df = pd.DataFrame([patient_data], columns=RAW_FEATURES)
            input_df = _normalize_gender_column(input_df)

            rhythm_proba = self.rhythm_pipeline.predict_proba(input_df)[0]
            rhythm_classes = list(self.rhythm_pipeline.classes_)
            rhythm_scores = {str(k): float(v) for k, v in zip(rhythm_classes, rhythm_proba)}
            top4 = sorted(rhythm_scores.items(), key=lambda kv: kv[1], reverse=True)[:4]
            top_rhythms = {k: f"{v:.2%}" for k, v in top4}

            best_rhythm = self.rhythm_pipeline.predict(input_df)
            best_beat = self.beat_pipeline.predict(input_df)

            return {
                "success": True,
                "predictions": {
                    "best_rhythm": str(best_rhythm),
                    "beat": str(best_beat),
                    "top_rhythms": top_rhythms,
                },
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


classifier = ECGClassifier()