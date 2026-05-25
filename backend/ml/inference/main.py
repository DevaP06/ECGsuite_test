from flask import Flask, request, jsonify
from ecg_image_processor import processor
from ecg_classifier import classifier
import os
import werkzeug

app = Flask(__name__)

UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print("🚀 Loading ML models and warming up server...")
try:
    loaded_ok = classifier.load_models()
    if loaded_ok:
        print("✅ Models loaded successfully.")
    else:
        print("⚠️  Models failed to load; API will still start (will return error on predict).")
except Exception as e:
    print(f"❌ Exception while loading models: {e}")


def _validate_patient_payload(payload: dict):
    required = [
        "PatientAge",
        "Gender",
        "VentricularRate",
        "AtrialRate",
        "QRSCount",
        "regularity_score",
        "mean_peak_height",
    ]
    missing = [k for k in required if k not in payload]
    if missing:
        return False, f"Missing fields: {missing}"
    return True, None


@app.route('/analyze-ecg-image', methods=['POST'])
def analyze_ecg_image():
    try:
        if 'ecgImage' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        image_file = request.files['ecgImage']
        filename = werkzeug.utils.secure_filename(image_file.filename or "ecg.png")
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)

        processing_results = processor.process_ecg_image(image_path)

        try:
            os.remove(image_path)
        except Exception:
            pass

        if not processing_results.get('success'):
            raise Exception(processing_results.get('error', 'Image processing failed'))

        analysis = processing_results.get('analysis', {})
        features = processing_results.get('features', {})
        intervals = processing_results.get('intervals_ms', {})
        calibration = processing_results.get('calibration', {})

        try:
            print(
                f"[DEBUG] /analyze-ecg-image file={filename} "
                f"HR={analysis.get('heart_rate')} bpm, "
                f"QRS={intervals.get('qrs')} ms, PR={intervals.get('pr')} ms, QT={intervals.get('qt')} ms, "
                f"peaks={features.get('num_peaks')}"
            )
        except Exception:
            pass

        intervals = processing_results.get('intervals_ms', {})
        patient_template = {
            "PatientAge": None,
            "Gender": None,
            "VentricularRate": float(analysis.get("heart_rate", 0.0)),
            "AtrialRate": float(analysis.get("heart_rate", 0.0)),
            "QRSCount": int(analysis.get("num_beats_detected", 0)),
            "regularity_score": float(analysis.get("regularity_score", 0.0)),
            "mean_peak_height": float(features.get("mean_peak_height", 0.0)),
        }

        processing_results["ecg_analysis"] = {
            "image_interpreted": filename,
            "heartRate": analysis.get("heart_rate"),
            "prInterval": intervals.get("pr"),
            "qrsDuration": intervals.get("qrs"),
            "qtInterval": intervals.get("qt"),
        }

        processing_results["patientData_template"] = patient_template
        processing_results["calibration"] = calibration
        return jsonify(processing_results)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/classify', methods=['POST'])
def classify_data():
    try:
        data = request.get_json(force=True, silent=False) or {}
        if 'patientData' not in data:
            return jsonify({'success': False, 'error': 'patientData is required'}), 400

        patient_data = data['patientData']
        ok, err = _validate_patient_payload(patient_data)
        if not ok:
            return jsonify({'success': False, 'error': err}), 400

        prediction_results = classifier.predict(patient_data)
        if not prediction_results.get('success'):
            raise Exception(prediction_results.get('error', 'Classification failed'))

        preds = prediction_results.get("predictions", {})
        response = {
            "success": True,
            "predictions": {
                "best_rhythm": str(preds.get("best_rhythm", "")),
                "beat": str(preds.get("beat", "")),
                "top_rhythms": preds.get("top_rhythms", {}),
            },
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/classify-ecg-image', methods=['POST'])
def classify_ecg_image():
    try:
        if 'ecgImage' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        image_file = request.files['ecgImage']

        patient_age = request.form.get('patientAge', type=int)
        gender_in = (request.form.get('gender') or '').strip().upper()
        if patient_age is None or gender_in not in ['MALE', 'FEMALE', '0', '1']:
            return jsonify({'success': False, 'error': 'Invalid patientAge or gender'}), 400
        gender_norm = 'MALE' if gender_in in ['MALE', '1'] else 'FEMALE'

        filename = werkzeug.utils.secure_filename(image_file.filename or "ecg.png")
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)

        processing_results = processor.process_ecg_image(image_path)

        try:
            os.remove(image_path)
        except Exception:
            pass

        if not processing_results.get('success'):
            raise Exception(processing_results.get('error', 'Image processing failed'))

        analysis = processing_results.get('analysis', {})
        features = processing_results.get('features', {})
        intervals = processing_results.get('intervals_ms', {})
        calibration = processing_results.get('calibration', {})
        intervals = processing_results.get('intervals_ms', {})

        hr = float(analysis.get('heart_rate', 0.0))
        patient_data = {
            "PatientAge": int(patient_age),
            "Gender": gender_norm,
            "VentricularRate": hr,
            "AtrialRate": hr,
            "QRSCount": int(analysis.get('num_beats_detected', 0)),
            "regularity_score": float(analysis.get('regularity_score', 0.0)),
            "mean_peak_height": float(features.get('mean_peak_height', 0.0)),
        }

        pred = classifier.predict(patient_data)
        if not pred.get('success'):
            raise Exception(pred.get('error', 'Classification failed'))

        preds = pred.get("predictions", {})

        try:
            print(
                f"[DEBUG] /classify-ecg-image file={filename} age={patient_age} gender={gender_norm} "
                f"HR={analysis.get('heart_rate')} bpm, QRS={intervals.get('qrs')} ms, PR={intervals.get('pr')} ms, QT={intervals.get('qt')} ms, "
                f"peaks={features.get('num_peaks')}, best_rhythm={preds.get('best_rhythm')}"
            )
        except Exception:
            pass

        ecg_analysis = {
            "image_interpreted": filename,
            "heartRate": analysis.get("heart_rate"),
            "prInterval": intervals.get("pr"),
            "qrsDuration": intervals.get("qrs"),
            "qtInterval": intervals.get("qt"),
        }

        response = {
            "success": True,
            "image_analysis": {
                "heart_rate": analysis.get("heart_rate", 0.0),
                "rhythm_type": analysis.get("rhythm_type", "unknown"),
                "regularity_score": analysis.get("regularity_score", 0.0),
                "num_beats_detected": analysis.get("num_beats_detected", 0),
            },
            "intervals_ms": intervals,
            "ecg_analysis": ecg_analysis,
            "calibration": calibration,
            "patientData": patient_data,
            "prediction": {
                "best_rhythm": str(preds.get("best_rhythm", "")),
                "beat": str(preds.get("beat", "")),
                "top_rhythms": preds.get("top_rhythms", {}),
            },
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/health')
def health():
    return jsonify({'success': True, 'status': 'ok'})