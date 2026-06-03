import sys

sys.path.append(
    r"D:\unetdigitization\Electrocardiogram-Digitization"
)

from app.pipeline import digitizer
from predictor import ECGPredictor

predictor = ECGPredictor()
signal, meta = digitizer.extract_signal(
    r"D:\unetdigitization\Electrocardiogram-Digitization\test_images\1.jpeg"
)
print(signal.shape)

probs = predictor.predict_signal(
    signal
)
print(len(probs))

top5 = sorted(
    probs.items(),
    key=lambda x: x[1],
    reverse=True
)[:5]

print(top5)
print("Layout:", meta.get("layout_name"))