"""
Offline training script to produce versioned models from Diagnostics.xlsx.
"""

import os
import json
from datetime import datetime
from ecg_classifier import ECGClassifier

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/Diagnostics.xlsx"))


def main():
    clf = ECGClassifier()
    res = clf.train_models(DATA_PATH)
    print(json.dumps(res, indent=2))

    meta_file = os.path.join(clf.model_dir, "metadata.json")
    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            meta = json.load(f)
        meta["trained_at"] = datetime.utcnow().isoformat() + "Z"
        with open(meta_file, "w") as f:
            json.dump(meta, f, indent=2)


if __name__ == "__main__":
    main()