"""
ECG Image Processing

Processes ECG images to extract a 1D proxy signal and basic features.
Note: For robust clinical use, add grid removal, de-skew, lead segmentation,
and pixel->time/voltage calibration. This is a lightweight baseline.
"""

import cv2
import numpy as np
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d
from typing import Tuple, Dict, Optional


class ECGImageProcessor:
    def __init__(self):
        # This is an "effective" sampling rate used for peak spacing heuristics.
        # For images, it should be derived from grid spacing; here we keep a safe default.
        self.sampling_rate = 500

    def load_image(self, image_path: str) -> Optional[np.ndarray]:
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Failed to load image or image not found")
            return img
        except Exception as e:
            print(f"Error loading image: {e}")
            return None

    def preprocess_image(self, img: np.ndarray) -> np.ndarray:
        try:
            # Light denoise; threshold using Otsu
            blurred = cv2.GaussianBlur(img, (5, 5), 0)
            _, binary = cv2.threshold(
                blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            # Make the trace white on black background if needed
            if np.mean(binary) > 127:
                binary = cv2.bitwise_not(binary)
            return binary
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return img

    def extract_signal_from_image(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract a 1D signal proxy from a single-lead strip-like image by
        tracing bright pixels column-wise.
        Assumes: white trace on black background (call preprocess_image first).
        """
        try:
            height, width = img.shape
            signal = np.zeros(width, dtype=np.float32)

            for col in range(width):
                ys = np.where(img[:, col] == 255)[0]
                if ys.size > 0:
                    signal[col] = np.mean(ys)
                else:
                    # If no trace found in this column, carry forward last value
                    signal[col] = signal[col - 1] if col > 0 else height / 2.0

            # Invert so taller values = higher amplitude
            signal = height - signal

            # Normalize to [0, 1]
            smin, smax = float(signal.min()), float(signal.max())
            if smax - smin <= 0:
                return None
            signal = (signal - smin) / (smax - smin)

            return signal
        except Exception as e:
            print(f"Error extracting signal: {e}")
            return None

    def detect_peaks(self, signal: np.ndarray, height_threshold: float = 0.5) -> Tuple[np.ndarray, Dict]:
        try:
            smoothed = gaussian_filter1d(signal, sigma=2)
            # Min distance ~0.4s at sampling_rate -> ~150bpm upper bound
            min_dist = max(1, int(self.sampling_rate * 0.4))
            peaks, props = find_peaks(smoothed, height=height_threshold, distance=min_dist)
            # Ensure peak_heights present
            if "peak_heights" not in props:
                props["peak_heights"] = smoothed[peaks]
            return peaks, props
        except Exception as e:
            print(f"Error detecting peaks: {e}")
            return np.array([], dtype=int), {}

    def calculate_heart_rate(self, peaks: np.ndarray) -> float:
        try:
            if peaks.size < 2:
                return 0.0
            rr = np.diff(peaks).astype(np.float32)
            mean_rr = float(np.mean(rr))
            if mean_rr <= 0:
                return 0.0
            return (self.sampling_rate / mean_rr) * 60.0
        except Exception as e:
            print(f"Error calculating heart rate: {e}")
            return 0.0

    def analyze_rhythm(self, peaks: np.ndarray) -> Dict:
        try:
            if peaks.size < 3:
                return {"rhythm": "insufficient_data", "regularity_score": 0.0}
            rr = np.diff(peaks).astype(np.float32)
            mean_rr = float(np.mean(rr)) if rr.size > 0 else 0.0
            std_rr = float(np.std(rr)) if rr.size > 0 else 0.0
            cv = (std_rr / mean_rr) if mean_rr > 0 else 1.0
            rhythm = "regular" if cv < 0.1 else "irregular"
            return {
                "rhythm": rhythm,
                "regularity_score": float(max(0.0, 1.0 - min(cv, 1.0))),
                "rr_intervals_samples": rr.tolist(),
                "mean_rr_samples": mean_rr,
                "std_rr_samples": std_rr,
            }
        except Exception as e:
            print(f"Error analyzing rhythm: {e}")
            return {"rhythm": "error", "regularity_score": 0.0}

    def extract_features(self, signal: np.ndarray) -> Dict:
        try:
            features: Dict = {}
            peaks, props = self.detect_peaks(signal)
            features["num_peaks"] = int(peaks.size)
            if peaks.size > 0:
                ph = props.get("peak_heights", np.array([], dtype=np.float32))
                features["peak_heights"] = [float(x) for x in ph.tolist()]
                features["mean_peak_height"] = float(np.mean(ph)) if ph.size > 0 else 0.0
            else:
                features["peak_heights"] = []
                features["mean_peak_height"] = 0.0

            hr = self.calculate_heart_rate(peaks)
            features["heart_rate"] = float(hr)

            rhythm_info = self.analyze_rhythm(peaks)
            features.update(rhythm_info)

            return features
        except Exception as e:
            print(f"Error extracting features: {e}")
            return {"error": str(e)}

    def process_ecg_image(self, image_path: str) -> Dict:
        try:
            img = self.load_image(image_path)
            if img is None:
                return {"success": False, "error": "Failed to load image"}

            # Preprocess: threshold so trace becomes white on black; also handle inverted scans
            bin_img = self.preprocess_image(img)

            # Optional: add de-skew/grid removal here

            signal = self.extract_signal_from_image(bin_img)
            if signal is None:
                return {"success": False, "error": "Failed to extract signal from image"}

            features = self.extract_features(signal)
            return {
                "success": True,
                "features": features,
                "analysis": {
                    "heart_rate": features.get("heart_rate", 0.0),
                    "rhythm_type": features.get("rhythm", "unknown"),
                    "regularity_score": features.get("regularity_score", 0.0),
                    "num_beats_detected": features.get("num_peaks", 0),
                },
                # expose signal for debugging/QA
                "signal_length": int(len(signal)),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Reusable instance
processor = ECGImageProcessor()
