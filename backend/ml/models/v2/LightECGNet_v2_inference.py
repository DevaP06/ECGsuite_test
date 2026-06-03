"""
LightECGNet v2 — Standalone Inference Script

Uses trained fold checkpoints (.pt) and per-fold thresholds (.npy) to
predict cardiac conditions from new ECG .mat files. No training required.

Directory layout expected:
    models/
        classes.json                  ← class list saved during training
        lightv2_ft_fold0.pt           ← fine-tuned weights  (preferred)
        lightv2_ft_fold0_thresh.npy   ← thresholds for ft model
        lightv2_p1_fold0.pt           ← phase-1 fallback
        lightv2_p1_fold0_thresh.npy
        lightv2_p1_fold1.pt / _thresh.npy
        lightv2_p1_fold2.pt / _thresh.npy
        ... (any combination of ft/p1 folds)
    dataset/
        ConditionNames_SNOMED-CT.csv  ← only needed when --build-classes

Usage examples
--------------
# Predict a single .mat file:
    python lightecgnet_inference.py path/to/record.mat

# Predict multiple files (glob patterns supported):
    python lightecgnet_inference.py ecg_data/*.mat

# Predict a directory of .mat files recursively:
    python lightecgnet_inference.py path/to/ecg_folder/ --recursive

# Save predictions to CSV:
    python lightecgnet_inference.py ecg_data/*.mat --output results.csv

# Use fewer TTA passes (faster, slightly lower accuracy):
    python lightecgnet_inference.py ecg_data/*.mat --tta 1

# Use a fixed 0.5 threshold instead of the saved per-class thresholds:
    python lightecgnet_inference.py ecg_data/*.mat --threshold 0.5

# Rebuild classes.json from dataset CSV (run once if classes.json is missing):
    python lightecgnet_inference.py --build-classes

Output
------
For each input file the script prints:
    record.mat → [AFIB, LVH, RBBB]  (prob: 0.91, 0.74, 0.62)

With --output CSV columns are:
    file, predicted_labels, probabilities (one column per class)
"""

import os
import sys
import csv
import json
import glob
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from scipy.io import loadmat
from scipy.signal import butter, filtfilt


# Configuration — adjust paths here if your layout differs
MODELS_DIR      = "models"
DATASET_DIR     = "dataset"
CLASSES_JSON    = os.path.join(MODELS_DIR, "classes.json")
SNOMED_CSV      = os.path.join(DATASET_DIR, "ConditionNames_SNOMED-CT.csv")

SIGNAL_LEN      = 5000          # 10 s @ 500 Hz — must match training
DEFAULT_N_TTA   = 3             # TTA passes (1 = no TTA, 5 = max quality)

# Classes excluded during training (must match ECGDataset.EXCLUDE)
EXCLUDE_CLASSES = {'ABI', 'VET', 'FQRS', 'SAAWR', 'JPT', 'VB'}


# Model architecture
class DSConv1d(nn.Module):
    def __init__(self, in_ch, out_ch, kernel, dilation=1, act='relu'):
        super().__init__()
        pad     = (kernel - 1) * dilation // 2
        self.dw = nn.Conv1d(in_ch, in_ch, kernel, padding=pad,
                            dilation=dilation, groups=in_ch, bias=False)
        self.pw = nn.Conv1d(in_ch, out_ch, 1, bias=False)
        self.bn = nn.BatchNorm1d(out_ch)
        self.act = nn.PReLU() if act == 'prelu' else nn.ReLU(inplace=True)

    def forward(self, x):
        return self.act(self.bn(self.pw(self.dw(x))))


class SEBlock1d(nn.Module):
    def __init__(self, ch, reduction=8):
        super().__init__()
        mid       = max(ch // reduction, 4)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc1  = nn.Linear(ch, mid)
        self.fc2  = nn.Linear(mid, ch)

    def forward(self, x):
        s = self.pool(x).squeeze(-1)
        s = torch.sigmoid(self.fc2(F.relu(self.fc1(s))))
        return x * s.unsqueeze(-1)


class LeadAttention(nn.Module):
    def __init__(self, n_leads=12, reduction=2):
        super().__init__()
        mid       = max(n_leads // reduction, 4)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc1  = nn.Linear(n_leads, mid)
        self.fc2  = nn.Linear(mid, n_leads)

    def forward(self, x):
        s = self.pool(x).squeeze(-1)
        s = torch.sigmoid(self.fc2(F.relu(self.fc1(s))))
        return x * s.unsqueeze(-1)


class DilatedTCNBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel=9, dilation=1, se_reduction=8, drop=0.15):
        super().__init__()
        pad      = (kernel - 1) * dilation // 2
        self.dw  = nn.Conv1d(in_ch, in_ch, kernel, padding=pad,
                             dilation=dilation, groups=in_ch, bias=False)
        self.bn1 = nn.BatchNorm1d(in_ch)
        self.pw  = nn.Conv1d(in_ch, out_ch, 1, bias=False)
        self.bn2 = nn.BatchNorm1d(out_ch)
        self.se  = SEBlock1d(out_ch, reduction=se_reduction)
        self.drop = nn.Dropout(drop)
        self.relu = nn.ReLU(inplace=True)
        self.skip = nn.Sequential(
            nn.Conv1d(in_ch, out_ch, 1, bias=False),
            nn.BatchNorm1d(out_ch)
        ) if in_ch != out_ch else nn.Identity()

    def forward(self, x):
        r = self.skip(x)
        x = self.relu(self.bn1(self.dw(x)))
        x = self.relu(self.bn2(self.pw(x)))
        x = self.se(x)
        x = self.drop(x)
        return self.relu(x + r)


class LightECGNetV2(nn.Module):
    def __init__(self, num_classes, n_leads=12):
        super().__init__()
        self.lead_attn = LeadAttention(n_leads, reduction=2)

        self.stem_k3   = DSConv1d(n_leads, 16, kernel=3)
        self.stem_k7   = DSConv1d(n_leads, 16, kernel=7)
        self.stem_k15  = DSConv1d(n_leads, 32, kernel=15)
        self.stem_proj = nn.Sequential(
            nn.Conv1d(64, 64, 1, bias=False),
            nn.BatchNorm1d(64),
            nn.PReLU()
        )
        self.stem_pool = nn.AvgPool1d(2)

        self.tcn1a = DilatedTCNBlock(64,  64, kernel=13, dilation=1, drop=0.1)
        self.tcn1b = DilatedTCNBlock(64,  64, kernel=13, dilation=2, drop=0.1)
        self.pool1 = nn.AvgPool1d(2)

        self.tcn2a = DilatedTCNBlock(64,  128, kernel=13, dilation=4, drop=0.2)
        self.tcn2b = DilatedTCNBlock(128, 128, kernel=13, dilation=8, drop=0.2)
        self.pool2 = nn.AvgPool1d(2)

        self.tcn3a = DilatedTCNBlock(128, 256, kernel=9, dilation=1, drop=0.3)
        self.tcn3b = DilatedTCNBlock(256, 256, kernel=9, dilation=2, drop=0.3)

        self.head = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x   = self.lead_attn(x)
        x   = torch.cat([self.stem_k3(x), self.stem_k7(x), self.stem_k15(x)], dim=1)
        x   = self.stem_pool(self.stem_proj(x))
        x   = self.tcn1b(self.tcn1a(x))
        x   = self.pool1(x)
        x   = self.tcn2b(self.tcn2a(x))
        x   = self.pool2(x)
        x   = self.tcn3b(self.tcn3a(x))
        gmp = x.max(dim=-1).values
        gap = x.mean(dim=-1)
        return self.head(torch.cat([gmp, gap], dim=1))


# Signal preprocessing  (mirrors training)

def bandpass_filter(signal, low=0.5, high=40.0, fs=500, order=3):
    nyq = 0.5 * fs
    b, a = butter(order, [low / nyq, high / nyq], btype='band')
    return filtfilt(b, a, signal)

class _ECGSignal:
    """Thin wrapper so load_ecg_mat can return signal + metadata together."""
    def __init__(self, array, lead_mode, orig_fs, ch_info):
        self.array     = array        # np.ndarray (12, target_len)
        self.lead_mode = lead_mode    # '12-lead' | 'N-lead-replicated'
        self.orig_fs   = orig_fs      # original sampling rate
        self.ch_info   = ch_info      # comma-separated channel names
        # Also apply bandpass + normalise for LabChart path here
        if lead_mode != '12-lead' or ch_info != '':
            arr = array.copy()
            for i in range(12):
                try:
                    arr[i] = bandpass_filter(arr[i])
                except Exception:
                    pass
            arr = (arr - arr.mean(axis=1, keepdims=True)) / \
                  (arr.std(axis=1, keepdims=True) + 1e-8)
            self.array = arr.astype(np.float32)


# ECG lead names used to identify channels in non-WFDB formats
_ECG_LEAD_KEYWORDS = [
    'ecg', 'ekg', 'lead', 'i', 'ii', 'iii',
    'avr', 'avl', 'avf', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6',
]

def _resample_signal(signal, orig_fs, target_fs=500, target_len=SIGNAL_LEN):
    """Resample a (leads, samples) array from orig_fs to target_fs."""
    from scipy.signal import resample
    if orig_fs == target_fs:
        return signal
    n_target = int(signal.shape[1] * target_fs / orig_fs)
    resampled = np.zeros((signal.shape[0], n_target), dtype=np.float32)
    for i in range(signal.shape[0]):
        resampled[i] = resample(signal[i], n_target).astype(np.float32)
    return resampled


def _pad_or_crop(signal, target_len=SIGNAL_LEN):
    """Pad with zeros or crop to exactly target_len samples."""
    cur = signal.shape[1]
    if cur < target_len:
        pad = np.zeros((signal.shape[0], target_len - cur), dtype=signal.dtype)
        return np.concatenate([signal, pad], axis=1)
    return signal[:, :target_len]


def _parse_labchart_mat(mat, target_len=SIGNAL_LEN):
    """
    Parse a LabChart/PowerLab multiplexed .mat file.
    Returns (signal (12, target_len), lead_mode, fs, channel_info_str).
    lead_mode: '12-lead' | 'single-lead-replicated'
    """
    data      = mat['data'].flatten().astype(np.float32)
    titles    = [str(t).strip() for t in mat['titles'].flatten()]
    datastart = mat['datastart'].astype(int)   # (n_channels, n_blocks)
    dataend   = mat['dataend'].astype(int)
    samplerate = mat['samplerate']             # (n_channels, n_blocks)

    # Identify ECG-like channels by title keyword matching
    ecg_indices = []
    for idx, title in enumerate(titles):
        tl = title.lower()
        if any(kw == tl or tl.startswith('ecg') or tl.startswith('ekg')
               or ('lead' in tl) or (tl in ['i','ii','iii','avr','avl','avf',
                                             'v1','v2','v3','v4','v5','v6'])
               for kw in _ECG_LEAD_KEYWORDS):
            ecg_indices.append(idx)

    # Fallback: take every channel that has valid data
    valid_indices = [i for i in range(len(titles))
                     if datastart[i, 0] > 0 and dataend[i, 0] > 0]

    chosen = ecg_indices if ecg_indices else valid_indices
    channel_names = [titles[i] for i in chosen]

    # Extract each channel: use block 0 (longest continuous block)
    # datastart/dataend are 1-indexed in MATLAB → subtract 1
    channels = []
    fs_list  = []
    for idx in chosen:
        # Find the block with most data (highest end-start)
        best_block = 0
        best_len   = -1
        for blk in range(datastart.shape[1]):
            s, e = datastart[idx, blk], dataend[idx, blk]
            if s > 0 and e > 0 and (e - s) > best_len:
                best_len   = e - s
                best_block = blk
        s = datastart[idx, best_block] - 1   # convert to 0-indexed
        e = dataend[idx, best_block]          # end is inclusive in MATLAB
        ch_data = data[s:e].astype(np.float32)
        fs      = float(samplerate[idx, best_block])
        channels.append(ch_data)
        fs_list.append(fs if fs > 0 else 200.0)

    n_found = len(channels)

    if n_found == 0:
        raise ValueError("No valid channels found in LabChart file.")

    # Resample each channel to 500 Hz and pad/crop to target_len
    fs_use = fs_list[0]   # assume uniform across channels
    resampled = []
    for ch, fs in zip(channels, fs_list):
        ch2d = ch.reshape(1, -1)
        ch2d = _resample_signal(ch2d, orig_fs=fs, target_fs=500,
                                target_len=target_len)
        ch2d = _pad_or_crop(ch2d, target_len)
        resampled.append(ch2d[0])

    n_found = len(resampled)

    if n_found >= 12:
        # Already have 12+ channels — use first 12
        signal = np.stack(resampled[:12], axis=0)
        lead_mode = '12-lead'
    else:
        # Fewer than 12 leads: replicate across all 12 slots
        signal = np.zeros((12, target_len), dtype=np.float32)
        for i in range(12):
            signal[i] = resampled[i % n_found]
        lead_mode = f'{n_found}-lead-replicated'

    ch_info = ', '.join(channel_names)
    return signal, lead_mode, fs_use, ch_info


def load_ecg_mat(path, target_len=SIGNAL_LEN):
    """
    Load an ECG .mat file and return (signal, lead_mode).

    signal    : np.ndarray (12, target_len) float32 — ready for the model
    lead_mode : str
        '12-lead'               → standard WFDB file, full accuracy
        'N-lead-replicated'     → LabChart / non-standard, reduced accuracy
    """
    if not os.path.exists(path) and os.path.exists(path + '.mat'):
        path = path + '.mat'
    mat = loadmat(path)

    # ── Detect format ────────────────────────────────────────────────────────
    # WFDB format uses 'val' or a plain 'data' array shaped (leads, samples)
    # LabChart uses multiplexed 'data' + 'datastart'/'dataend'/'titles'
    is_labchart = ('datastart' in mat and 'titles' in mat and 'dataend' in mat)

    if is_labchart:
        signal, lead_mode, orig_fs, ch_info = _parse_labchart_mat(mat, target_len)
        return _ECGSignal(signal, lead_mode, orig_fs, ch_info)

    # ── Standard WFDB path ───────────────────────────────────────────────────
    signal = mat.get('val', mat.get('data'))
    if signal is None:
        raise ValueError(f"No ECG data found in '{path}'. "
                         "Expected 'val' or 'data' key.")
    signal = signal.astype(np.float32)
    if signal.shape[0] != 12:
        signal = signal.T
    if signal.shape[0] != 12:
        # Non-standard WFDB: treat as single/multi lead and replicate
        n = signal.shape[0] if signal.ndim == 2 else 1
        if signal.ndim == 1:
            signal = signal.reshape(1, -1)
        full = np.zeros((12, signal.shape[1]), dtype=np.float32)
        for i in range(12):
            full[i] = signal[i % n]
        signal = full
        lead_mode = f'{n}-lead-replicated'
    else:
        lead_mode = '12-lead'

    signal = _pad_or_crop(signal, target_len)

    for i in range(12):
        signal[i] = bandpass_filter(signal[i])
    signal = (signal - signal.mean(axis=1, keepdims=True)) / \
             (signal.std(axis=1, keepdims=True) + 1e-8)
    return _ECGSignal(signal.astype(np.float32), lead_mode, 500, '')


def tta_augment(signal):
    """Light augmentation for TTA (mirrors training's tta_augment)."""
    sig = signal.copy()
    sig = sig + np.random.normal(0, 0.005, sig.shape).astype(np.float32)
    sig = sig * float(np.random.uniform(0.95, 1.05))
    return sig


# Model loading helpers

def load_classes(classes_json=CLASSES_JSON):
    """Load the ordered class list saved during training."""
    if not os.path.exists(classes_json):
        raise FileNotFoundError(
            f"'{classes_json}' not found.\n"
            "Run with --build-classes to generate it from the SNOMED CSV, "
            "or copy it from your training environment."
        )
    with open(classes_json) as f:
        classes = json.load(f)
    return classes


def discover_checkpoints(models_dir=MODELS_DIR):
    """
    Discover available checkpoint/threshold pairs.
    Prefer fine-tuned (ft) over phase-1 (p1) for each fold.
    Returns a list of (ckpt_path, thresh_path) tuples.
    """
    pairs = []
    # Collect all .pt files in models_dir
    pt_files = sorted(glob.glob(os.path.join(models_dir, "*.pt")))
    if not pt_files:
        raise FileNotFoundError(
            f"No .pt checkpoint files found in '{models_dir}'. "
            "Make sure the trained model files are present."
        )

    # Group by fold number, preferring ft over p1
    fold_map = {}  # fold_idx -> {'ft': path, 'p1': path}
    for pt in pt_files:
        base = os.path.basename(pt)
        if 'fold' not in base:
            continue
        fold_str = base.split('fold')[1].split('.')[0]
        try:
            fold_idx = int(fold_str)
        except ValueError:
            continue
        kind = 'ft' if '_ft_' in base else 'p1'
        fold_map.setdefault(fold_idx, {})[kind] = pt

    if not fold_map:
        raise FileNotFoundError(
            f"Could not parse any 'lightv2_*_fold*.pt' files in '{models_dir}'."
        )

    for fold_idx in sorted(fold_map):
        candidates = fold_map[fold_idx]
        chosen_pt  = candidates.get('ft') or candidates.get('p1')
        thresh_pt  = chosen_pt.replace('.pt', '_thresh.npy')
        pairs.append((chosen_pt, thresh_pt if os.path.exists(thresh_pt) else None))

    return pairs


def load_ensemble(classes, device, models_dir=MODELS_DIR):
    """
    Load all available fold models + their thresholds.

    Returns:
        models    : list of LightECGNetV2 in eval mode
        thresholds: np.ndarray (num_folds, num_classes) — per-class thresholds
    """
    pairs      = discover_checkpoints(models_dir)
    num_classes = len(classes)
    models     = []
    thresh_list = []

    print(f"Loading {len(pairs)} fold model(s) from '{models_dir}':")
    for ckpt, thresh_path in pairs:
        m = LightECGNetV2(num_classes).to(device)
        state = torch.load(ckpt, map_location=device, weights_only=True)
        m.load_state_dict(state)
        m.eval()
        models.append(m)

        if thresh_path:
            thresh = np.load(thresh_path)
        else:
            thresh = np.full(num_classes, 0.5)
            print(f"  {os.path.basename(ckpt)}  [no thresh file → using 0.5]")
        thresh_list.append(thresh)
        print(f"  {os.path.basename(ckpt)}  "
              f"(thresh range [{thresh.min():.2f}, {thresh.max():.2f}])")

    thresholds = np.mean(thresh_list, axis=0)   # average across folds
    print(f"Ensemble thresholds averaged over {len(pairs)} fold(s).")
    return models, thresholds


# Inference

def predict_signal(signal_np, models, device, n_tta=DEFAULT_N_TTA,
                   use_amp=True, amp_dtype=torch.float16):
    """
    Run ensemble inference on a single preprocessed signal.

    Args:
        signal_np : np.ndarray (12, 5000) float32  OR  _ECGSignal
        models    : list of LightECGNetV2
        device    : torch.device
        n_tta     : int  (1 = no augmentation)

    Returns:
        probs : np.ndarray (num_classes,)  averaged sigmoid probabilities
    """
    # Accept both plain ndarray and _ECGSignal wrapper
    if isinstance(signal_np, _ECGSignal):
        signal_np = signal_np.array
    all_probs = []

    for m in models:
        fold_probs = []
        for pass_idx in range(n_tta):
            sig = tta_augment(signal_np) if pass_idx > 0 else signal_np.copy()
            x   = torch.from_numpy(sig).unsqueeze(0).to(device)   # (1,12,5000)
            with torch.no_grad():
                with torch.amp.autocast(
                    device.type,
                    dtype=amp_dtype,
                    enabled=(use_amp and device.type == 'cuda')
                ):
                    logits = m(x)
            probs = torch.sigmoid(logits.float()).cpu().numpy()[0]
            fold_probs.append(probs)
        all_probs.append(np.mean(fold_probs, axis=0))

    return np.mean(all_probs, axis=0)   # (num_classes,)


def predict_file(mat_path, models, classes, thresholds, device,
                 n_tta=DEFAULT_N_TTA, fixed_threshold=None):
    """
    Full prediction pipeline for a single .mat file.

    Returns:
        dict with keys: file, predicted_labels, pred_probs, all_probs,
                        lead_mode, orig_fs, ch_info
    """
    ecg     = load_ecg_mat(mat_path)
    probs   = predict_signal(ecg.array, models, device, n_tta=n_tta)

    thresh = (np.full(len(classes), fixed_threshold)
              if fixed_threshold is not None else thresholds)
    pred_mask   = probs > thresh
    pred_labels = [classes[i] for i in range(len(classes)) if pred_mask[i]]
    pred_probs  = [float(probs[i]) for i in range(len(classes)) if pred_mask[i]]

    return {
        "file":             mat_path,
        "predicted_labels": pred_labels,
        "pred_probs":       pred_probs,
        "all_probs":        probs,
        "lead_mode":        ecg.lead_mode,
        "orig_fs":          ecg.orig_fs,
        "ch_info":          ecg.ch_info,
    }


# Build / save classes.json  (one-time utility)

def build_classes_json(snomed_csv=SNOMED_CSV,
                       classes_json=CLASSES_JSON,
                       dataset_root="dataset/WFDBRecords"):
    """
    Rebuild classes.json by scanning the WFDBRecords dataset.
    This must match the ECGDataset logic used during training exactly:
      - Map SNOMED codes → acronyms via ConditionNames_SNOMED-CT.csv
      - Exclude EXCLUDE_CLASSES
      - Sort alphabetically
    Call this once if classes.json is missing.
    """
    import os, csv
    from collections import Counter

    if not os.path.exists(snomed_csv):
        raise FileNotFoundError(f"SNOMED CSV not found at '{snomed_csv}'")

    snomed_to_acronym = {}
    with open(snomed_csv, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            snomed_to_acronym[row['Snomed_CT'].strip()] = row['Acronym Name'].strip()
    print(f"SNOMED mapping: {len(snomed_to_acronym)} entries")

    def extract_labels(hea_path):
        with open(hea_path) as f:
            for line in f:
                if '#Dx' in line.replace(' ', ''):
                    return line.split(':')[1].strip().split(',')
        return []

    counter = Counter()
    for root, _, files in os.walk(dataset_root):
        for fname in files:
            if not fname.endswith('.hea'):
                continue
            base   = os.path.join(root, fname[:-4])
            codes  = extract_labels(base + '.hea')
            labels = [snomed_to_acronym[c] for c in codes if c in snomed_to_acronym]
            counter.update(labels)

    classes = sorted(c for c in counter if c not in EXCLUDE_CLASSES)
    os.makedirs(os.path.dirname(classes_json) or ".", exist_ok=True)
    with open(classes_json, 'w') as f:
        json.dump(classes, f, indent=2)
    print(f"Saved {len(classes)} classes to '{classes_json}'")
    print("Classes:", classes)
    return classes


# CLI

def collect_mat_files(inputs, recursive=False):
    """Expand a mix of files, directories and glob patterns to .mat paths.
    Also handles MATLAB files saved without a .mat extension on disk."""
    paths = []
    for item in inputs:
        if os.path.isdir(item):
            # Directories: glob for *.mat AND extensionless MATLAB files
            pattern_mat = os.path.join(item, "**", "*.mat") if recursive \
                          else os.path.join(item, "*.mat")
            paths.extend(sorted(glob.glob(pattern_mat, recursive=recursive)))
        elif '*' in item or '?' in item:
            paths.extend(sorted(glob.glob(item)))
        elif os.path.isfile(item):
            # File exists as given (with or without extension)
            paths.append(item)
        elif os.path.isfile(item + '.mat'):
            # User typed path without .mat extension — add it
            paths.append(item + '.mat')
        else:
            print(f"Warning: '{item}' not found, skipping.")
    return paths


def main():
    parser = argparse.ArgumentParser(
        description="LightECGNet v2 inference — predict cardiac conditions from ECG .mat files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "inputs", nargs="*",
        help="One or more .mat files, directories, or glob patterns"
    )
    parser.add_argument(
        "--output", "-o", default=None,
        help="Save predictions to this CSV file"
    )
    parser.add_argument(
        "--models-dir", default=MODELS_DIR,
        help=f"Directory containing .pt and .npy files (default: {MODELS_DIR})"
    )
    parser.add_argument(
        "--classes-json", default=CLASSES_JSON,
        help=f"Path to classes.json (default: {CLASSES_JSON})"
    )
    parser.add_argument(
        "--tta", type=int, default=DEFAULT_N_TTA,
        help=f"Number of TTA passes (1=no TTA, default: {DEFAULT_N_TTA})"
    )
    parser.add_argument(
        "--threshold", type=float, default=None,
        help="Override per-class thresholds with a single fixed value (e.g. 0.5)"
    )
    parser.add_argument(
        "--recursive", "-r", action="store_true",
        help="Recurse into subdirectories when a directory is given"
    )
    parser.add_argument(
        "--build-classes", action="store_true",
        help="Rebuild classes.json from the SNOMED CSV + dataset, then exit"
    )
    parser.add_argument(
        "--top-k", type=int, default=None,
        help="Show only the top-K predictions by probability (regardless of threshold)"
    )
    args = parser.parse_args()

    # ── One-time class-list builder
    if args.build_classes:
        build_classes_json()
        return

    if not args.inputs:
        parser.print_help()
        sys.exit(0)

    # ── Setup
    device   = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    amp_ok   = device.type == "cuda"
    amp_dtype = (torch.bfloat16 if (amp_ok and torch.cuda.is_bf16_supported())
                 else torch.float16)

    if amp_ok:
        gpu_name = torch.cuda.get_device_name(0)
        print(f"Device: {device} ({gpu_name})")
    else:
        print(f"Device: {device}")

    classes         = load_classes(args.classes_json)
    models, thresholds = load_ensemble(classes, device, args.models_dir)
    print(f"Classes: {len(classes)}  |  TTA passes: {args.tta}")
    if args.threshold is not None:
        print(f"Using fixed threshold: {args.threshold}")
    print()

    # ── Collect files
    mat_files = collect_mat_files(args.inputs, recursive=args.recursive)
    if not mat_files:
        print("No .mat files found. Check your input paths.")
        sys.exit(1)
    print(f"Found {len(mat_files)} .mat file(s) to process.\n")

    # ── Run inference
    results  = []
    n_errors = 0

    for i, mat_path in enumerate(mat_files, 1):
        try:
            result = predict_file(
                mat_path, models, classes, thresholds, device,
                n_tta=args.tta,
                fixed_threshold=args.threshold,
            )

            if args.top_k:
                # Override: show top-k by raw probability
                top_idx    = np.argsort(result["all_probs"])[::-1][:args.top_k]
                pred_labels = [classes[j] for j in top_idx]
                pred_probs  = [float(result["all_probs"][j]) for j in top_idx]
                result["predicted_labels"] = pred_labels
                result["pred_probs"]       = pred_probs

            labels_str = (", ".join(
                f"{lbl}({p:.2f})" for lbl, p in
                zip(result["predicted_labels"], result["pred_probs"])
            ) if result["predicted_labels"] else "— (no condition above threshold)")

            is_12lead  = result.get("lead_mode", "12-lead") == "12-lead"
            lead_mode  = result.get("lead_mode", "12-lead")
            orig_fs    = result.get("orig_fs", 500)
            ch_info    = result.get("ch_info", "")

            print(f"[{i:>4}/{len(mat_files)}] {os.path.basename(mat_path)}")
            if not is_12lead:
                print(f"         ⚠  NON-STANDARD INPUT: {lead_mode}, "
                      f"{orig_fs:.0f} Hz"
                      + (f", channels: [{ch_info}]" if ch_info else ""))
                print(f"         ⚠  Results may be inaccurate — "
                      f"provide a standard 12-lead ECG for reliable predictions.")
            print(f"         → {labels_str}")
            if not is_12lead:
                print(f"         ℹ  For accurate results, re-record with a "
                      f"12-lead ECG device and re-run.")
            results.append(result)

        except Exception as e:
            print(f"[{i:>4}/{len(mat_files)}] {os.path.basename(mat_path)}  ERROR: {e}")
            n_errors += 1

    print(f"\nDone. {len(results)} succeeded, {n_errors} failed.")

    # ── Save to CSV
    if args.output:
        with open(args.output, 'w', newline='') as f:
            writer = csv.writer(f)
            # Header: file, predicted_labels, then one column per class
            writer.writerow(["file", "lead_mode", "orig_fs",
                               "predicted_labels"] + classes)
            for r in results:
                row = [
                    r["file"],
                    r.get("lead_mode", "12-lead"),
                    r.get("orig_fs", 500),
                    ";".join(r["predicted_labels"]),
                ] + [f"{p:.6f}" for p in r["all_probs"]]
                writer.writerow(row)
        print(f"Predictions saved to '{args.output}'")


# Programmatic API  (import and call directly from another script)

class LightECGNetInference:
    """
    High-level inference object for use in other Python scripts.

    Example
    -------
    >>> from lightecgnet_inference import LightECGNetInference
    >>> inf = LightECGNetInference()
    >>> labels, probs = inf.predict("patient_001.mat")
    >>> print(labels)   # ['AFIB', 'LVH']
    >>> print(dict(zip(labels, probs)))
    """

    def __init__(
        self,
        models_dir=MODELS_DIR,
        classes_json=CLASSES_JSON,
        n_tta=DEFAULT_N_TTA,
        fixed_threshold=None,
        device=None,
    ):
        self.n_tta           = n_tta
        self.fixed_threshold = fixed_threshold
        self.device          = device or torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.amp_dtype = (
            torch.bfloat16
            if (self.device.type == "cuda" and torch.cuda.is_bf16_supported())
            else torch.float16
        )
        self.classes            = load_classes(classes_json)
        self.models, self.thresholds = load_ensemble(
            self.classes, self.device, models_dir
        )

    def predict(self, mat_path):
        """
        Predict conditions for a single .mat ECG file.

        Returns:
            predicted_labels : list[str]   classes above threshold
            pred_probs       : list[float] corresponding probabilities
        """
        result = predict_file(
            mat_path, self.models, self.classes, self.thresholds,
            self.device, n_tta=self.n_tta,
            fixed_threshold=self.fixed_threshold,
        )
        return result["predicted_labels"], result["pred_probs"]
    

    def predict_signal_array(self, signal):
        """
            signal: numpy array (12,5000)

            Returns:
                dict {class_name: probability}
        """

        probs = predict_signal(
            signal,
            self.models,
            self.device,
            n_tta=self.n_tta,
            use_amp=(self.device.type == "cuda"),
            amp_dtype=self.amp_dtype,
        )

        return dict(
            zip(
                self.classes,
                probs.tolist()
            )
        )

    def predict_proba(self, mat_path):
        """
        Return raw class probabilities without thresholding.

        Returns:
            dict {class_name: probability}
        """
        signal = load_ecg_mat(mat_path)
        probs  = predict_signal(
            signal, self.models, self.device,
            n_tta=self.n_tta,
            use_amp=(self.device.type == "cuda"),
            amp_dtype=self.amp_dtype,
        )
        return dict(zip(self.classes, probs.tolist()))

    def predict_batch(self, mat_paths):
        """
        Predict a list of .mat files.

        Returns:
            list of (labels, probs) tuples
        """
        return [self.predict(p) for p in mat_paths]


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    main()