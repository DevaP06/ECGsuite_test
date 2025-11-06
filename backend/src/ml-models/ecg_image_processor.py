"""
ECG Image Processing

Processes ECG images to extract a 1D proxy signal and basic features.

Adds lightweight de-skew and grid calibration (px→ms/mV) to improve
interval estimation. This remains a heuristic pipeline; image quality
and grid visibility strongly affect results.
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
        self.sampling_rate = 500  # samples/second over the x-axis (columns)
        # Calibration cache per image
        self.px_per_mm: Optional[float] = None
        self.ms_per_px: Optional[float] = None
        self.mv_per_px: Optional[float] = None

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

    def estimate_skew_angle(self, img: np.ndarray) -> float:
        """Estimate the predominant grid line angle in degrees (positive = rotate CCW to deskew)."""
        try:
            edges = cv2.Canny(img, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=150)
            if lines is None or len(lines) == 0:
                return 0.0
            # Convert angles near 0 or pi/2 into degrees and center around 0
            angles = []
            for rho_theta in lines[:200]:
                rho, theta = rho_theta[0]
                deg = (theta * 180.0 / np.pi)
                # Normalize: prefer angles close to 0 or 90
                if deg > 90:
                    deg -= 180
                if -45 <= deg <= 45:
                    angles.append(deg)
            if not angles:
                return 0.0
            # Median is robust
            angle = float(np.median(angles))
            # Small angles only; ignore extreme estimates
            return angle if abs(angle) <= 10 else 0.0
        except Exception:
            return 0.0

    def deskew(self, img: np.ndarray, angle_deg: float) -> np.ndarray:
        try:
            if abs(angle_deg) < 0.5:
                return img
            h, w = img.shape
            M = cv2.getRotationMatrix2D((w / 2, h / 2), angle_deg, 1.0)
            return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        except Exception:
            return img

    def estimate_px_per_mm(self, img: np.ndarray) -> Optional[float]:
        """Estimate grid small-box size (px per 1 mm). Returns None if not detected."""
        try:
            # Detect vertical grid line spacing using projection profile
            # Invert to make grid bright if needed
            work = img.copy()
            if np.mean(work) < 127:
                work = cv2.bitwise_not(work)
            # Enhance lines
            work = cv2.GaussianBlur(work, (3, 3), 0)
            # Vertical projection
            vert_proj = np.mean(work, axis=0)
            # Use FFT to find dominant frequency (grid spacing)
            v = vert_proj - np.mean(vert_proj)
            if v.std() < 1e-3:
                return None
            V = np.fft.rfft(v)
            freqs = np.fft.rfftfreq(v.size, d=1.0)
            mags = np.abs(V)
            # Ignore DC
            mags[0] = 0
            # Find peak frequency (cycles per pixel)
            idx = int(np.argmax(mags))
            if idx <= 0:
                return None
            f = freqs[idx]
            if f <= 0:
                return None
            px_per_cycle = 1.0 / f
            # Grid has major/minor lines; minor small boxes typically dominate.
            px_per_mm = float(px_per_cycle)
            # Sanity bounds: typical ECG scans yield ~4–20 px per mm depending on DPI.
            if 3.0 <= px_per_mm <= 30.0:
                return px_per_mm
            # Try harmonic if out of range (maybe we caught 5 mm boxes)
            for k in [0.5, 2.0]:
                alt = px_per_mm * k
                if 3.0 <= alt <= 30.0:
                    return float(alt)
            return None
        except Exception:
            return None

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

    def _half_amp_crossings(self, smoothed: np.ndarray, peak_idx: int, peak_val: float,
                             left_window: int, right_window: int,
                             baseline_left: Optional[float] = None,
                             baseline_right: Optional[float] = None,
                             alpha: float = 0.5) -> Tuple[Optional[int], Optional[int]]:
        try:
            # Threshold relative to local baseline to be robust against low-amplitude beats
            if baseline_left is None:
                l0 = max(0, peak_idx - left_window)
                baseline_left = float(np.min(smoothed[l0:peak_idx+1])) if peak_idx > l0 else float(smoothed[peak_idx])
            if baseline_right is None:
                r1 = min(len(smoothed)-1, peak_idx + right_window)
                baseline_right = float(np.min(smoothed[peak_idx:r1+1])) if r1 > peak_idx else float(smoothed[peak_idx])
            thr_left = baseline_left + alpha * (peak_val - baseline_left)
            thr_right = baseline_right + alpha * (peak_val - baseline_right)
            # Left crossing (onset)
            left_start = max(0, peak_idx - left_window)
            left_segment = smoothed[left_start:peak_idx+1]
            onset = None
            # scan from peak down to left_start to find last index below threshold, then forward to crossing
            for i in range(len(left_segment)-1, 0, -1):
                if left_segment[i-1] < thr_left <= left_segment[i]:
                    onset = left_start + i
                    break

            # Right crossing (offset)
            right_end = min(len(smoothed)-1, peak_idx + right_window)
            right_segment = smoothed[peak_idx:right_end+1]
            offset = None
            for i in range(1, len(right_segment)):
                if right_segment[i-1] >= thr_right > right_segment[i]:
                    offset = peak_idx + i
                    break

            # If not found, relax threshold and retry once
            if (onset is None or offset is None) and alpha > 0.3:
                return self._half_amp_crossings(
                    smoothed, peak_idx, peak_val, left_window, right_window,
                    baseline_left, baseline_right, alpha=0.3
                )

            return onset, offset
        except Exception:
            return None, None

    def estimate_intervals(self, signal: np.ndarray, peaks: np.ndarray) -> Dict[str, float]:
        """
        Heuristic estimates for intervals (in milliseconds):
        - QRS duration: width at half amplitude around R peaks.
        - PR interval: P onset (pre-R small peak half-rise) to QRS onset. (very rough)
        - QT interval: QRS onset to T end (post-R half-fall). (very rough)
        Returns mean across beats when available.
        """
        try:
            if peaks.size == 0:
                return {"qrs_duration_ms": 0.0, "pr_interval_ms": 0.0, "qt_interval_ms": 0.0}

            smoothed = gaussian_filter1d(signal.astype(np.float32), sigma=2)
            # Windows in samples
            # Use dynamic windows informed by observed RR; fallback to defaults
            rr = np.diff(peaks).astype(np.int32)
            rr_med = int(np.median(rr)) if rr.size else int(0.5 * self.sampling_rate)
            qrs_win = max(int(0.08 * self.sampling_rate), min(int(0.18 * self.sampling_rate), rr_med // 4))
            p_pre_win = int(0.20 * self.sampling_rate)  # 200 ms before R
            t_post_win = int(0.40 * self.sampling_rate)  # 400 ms after R
            min_t_delay = int(0.08 * self.sampling_rate)  # 80 ms after R to start looking for T

            qrs_durs = []
            pr_ints = []
            qt_ints = []

            for p in peaks:
                pv = float(smoothed[p])
                # Baselines for left/right windows
                l0 = max(0, p - qrs_win)
                r1 = min(len(smoothed)-1, p + qrs_win)
                bl = float(np.min(smoothed[l0:p+1])) if p > l0 else float(smoothed[p])
                br = float(np.min(smoothed[p:r1+1])) if r1 > p else float(smoothed[p])
                onset, offset = self._half_amp_crossings(smoothed, p, pv, qrs_win, qrs_win, bl, br, alpha=0.5)
                if onset is not None and offset is not None and offset > onset:
                    qrs_ms = (offset - onset) / self.sampling_rate * 1000.0
                    qrs_durs.append(qrs_ms)

                # P peak search (very rough): look for local max in pre-window
                p_start = max(0, p - p_pre_win)
                p_end = max(0, p - int(0.06 * self.sampling_rate))  # skip last 60 ms before QRS
                if p_end > p_start:
                    pre_seg = smoothed[p_start:p_end]
                    if pre_seg.size > 2:
                        # find index of max in pre segment
                        p_rel = int(np.argmax(pre_seg))
                        p_idx = p_start + p_rel
                        p_val = float(smoothed[p_idx])
                        # half-rise towards P peak for onset
                        # Baseline in P region
                        pl0 = max(0, p_idx - int(0.10 * self.sampling_rate))
                        pbl = float(np.min(smoothed[pl0:p_idx+1])) if p_idx > pl0 else float(smoothed[p_idx])
                        p_onset, _ = self._half_amp_crossings(
                            smoothed, p_idx, p_val,
                            int(0.08 * self.sampling_rate), 1,
                            baseline_left=pbl, baseline_right=pbl, alpha=0.4
                        )
                        if p_onset is not None and onset is not None and onset > p_onset:
                            pr_ms = (onset - p_onset) / self.sampling_rate * 1000.0
                            pr_ints.append(pr_ms)

                # T end search: after R, find local max then half-fall
                t_start = min(len(smoothed)-1, p + min_t_delay)
                t_end = min(len(smoothed)-1, p + t_post_win)
                if t_end > t_start:
                    post_seg = smoothed[t_start:t_end]
                    if post_seg.size > 2:
                        t_rel = int(np.argmax(post_seg))
                        t_idx = t_start + t_rel
                        t_val = float(smoothed[t_idx])
                        # half-fall after T peak for T end
                        # Baseline in T region: min after T peak
                        tr1 = min(len(smoothed)-1, t_idx + int(0.25 * self.sampling_rate))
                        tbl = float(np.min(smoothed[t_idx:tr1+1])) if tr1 > t_idx else float(smoothed[t_idx])
                        _, t_offset = self._half_amp_crossings(
                            smoothed, t_idx, t_val,
                            int(0.12 * self.sampling_rate), int(0.20 * self.sampling_rate),
                            baseline_left=tbl, baseline_right=tbl, alpha=0.4
                        )
                        if t_offset is None:
                            # fallback: next local minima
                            t_offset = t_idx + int(0.1 * self.sampling_rate)
                        if onset is not None and t_offset is not None and t_offset > onset:
                            qt_ms = (t_offset - onset) / self.sampling_rate * 1000.0
                            qt_ints.append(qt_ms)

            def _mean(vals):
                return float(np.mean(vals)) if len(vals) else 0.0

            return {
                "qrs_duration_ms": _mean(qrs_durs),
                "pr_interval_ms": _mean(pr_ints),
                "qt_interval_ms": _mean(qt_ints),
            }
        except Exception as e:
            print(f"Error estimating intervals: {e}")
            return {"qrs_duration_ms": 0.0, "pr_interval_ms": 0.0, "qt_interval_ms": 0.0}

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

            # Interval estimates (ms)
            intervals = self.estimate_intervals(signal, peaks)
            features.update(intervals)

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

            # De-skew using Hough-based grid angle estimation
            angle = self.estimate_skew_angle(bin_img)
            bin_img = self.deskew(bin_img, -angle)  # rotate opposite to measured angle

            # Estimate grid spacing and derive calibration
            px_per_mm = self.estimate_px_per_mm(bin_img)
            self.px_per_mm = px_per_mm
            # Paper speed: 25 mm/s => 40 ms/mm. Time per pixel = 40 ms / px_per_mm
            if px_per_mm and px_per_mm > 0:
                self.ms_per_px = 40.0 / px_per_mm
                self.sampling_rate = 1000.0 / self.ms_per_px  # samples/sec over x axis
                # Amplitude: 10 mm/mV => 0.1 mV/mm => mV/px = 0.1 / px_per_mm
                self.mv_per_px = 0.1 / px_per_mm
            else:
                # Fallback to defaults
                self.ms_per_px = 1000.0 / float(self.sampling_rate)
                self.mv_per_px = None

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
                "intervals_ms": {
                    "pr": features.get("pr_interval_ms", 0.0),
                    "qrs": features.get("qrs_duration_ms", 0.0),
                    "qt": features.get("qt_interval_ms", 0.0),
                },
                "calibration": {
                    "px_per_mm": self.px_per_mm,
                    "ms_per_px": self.ms_per_px,
                    "mv_per_px": self.mv_per_px,
                    "deskew_angle_deg": float(angle),
                    "sampling_rate_hz": float(self.sampling_rate),
                },
                # expose signal for debugging/QA
                "signal_length": int(len(signal)),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Reusable instance
processor = ECGImageProcessor()
