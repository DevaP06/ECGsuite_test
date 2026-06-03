import numpy as np
from LightECGNet_v2_inference import LightECGNetInference

model = LightECGNetInference()

dummy = np.random.randn(12,5000).astype(np.float32)

out = model.predict_signal_array(dummy)

print(len(out))
print(list(out.items())[:5])