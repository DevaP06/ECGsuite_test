from flask import Flask, request, jsonify
from ecg_image_processor import processor
from ecg_classifier import classifier
import os
import werkzeug

app = Flask(__name__)

# Limit uploads to 20MB and use an ephemeral, writable temp dir (Render-friendly)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/temp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print("🚀 Loading ML models and warming up server...")
classifier.load_models()
print("✅ Models loaded successfully.")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'success': True, 'status': 'ok'})


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
    """
    Analyze ECG image and return extracted features for downstream classification.
    Request: multipart/form-data with ecgImage (File)
    """
    try:
        if 'ecgImage' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        image_file = request.files['ecgImage']
        filename = werkzeug.utils.secure_filename(image_file.filename or "ecg.png")
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)

        processing_results = processor.process_ecg_image(image_path)

        # Clean up temp file
        try:
            os.remove(image_path)
        except Exception:
            pass

        if not processing_results.get('success'):
            raise Exception(processing_results.get('error', 'Image processing failed'))

        # Optionally include a ready-to-fill patientData_template
        analysis = processing_results.get('analysis', {})
        features = processing_results.get('features', {})
        patient_template = {
            "PatientAge": None,  # fill on client
            "Gender": None,      # fill on client ("MALE"/"FEMALE")
            "VentricularRate": float(analysis.get("heart_rate", 0.0)),
            "AtrialRate": float(analysis.get("heart_rate", 0.0)),
            "QRSCount": int(analysis.get("num_beats_detected", 0)),
            "regularity_score": float(analysis.get("regularity_score", 0.0)),
            "mean_peak_height": float(features.get("mean_peak_height", 0.0)),
        }

        # Return augmented response
        processing_results["patientData_template"] = patient_template
        return jsonify(processing_results)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/classify', methods=['POST'])
def classify_data():
    """
    Classify using tabular patientData (already prepared).
    Request: application/json { "patientData": { ...fields... } }
    """
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

        # Ensure scalars are strings (avoid ndarray types)
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
    """
    Single-call flow (Variant B2):
    - Accept ecgImage + patientAge + gender
    - Analyze image -> build patientData -> classify
    Request: multipart/form-data with:
      - ecgImage: File
      - patientAge: int
      - gender: "MALE" | "FEMALE" | 1 | 0
    """
    try:
        # Validate file
        if 'ecgImage' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        image_file = request.files['ecgImage']

        # Validate demographics
        patient_age = request.form.get('patientAge', type=int)
        gender_in = (request.form.get('gender') or '').strip().upper()
        if patient_age is None or gender_in not in ['MALE', 'FEMALE', '0', '1']:
            return jsonify({'success': False, 'error': 'Invalid patientAge or gender'}), 400
        gender_norm = 'MALE' if gender_in in ['MALE', '1'] else 'FEMALE'

        # Save temp
        filename = werkzeug.utils.secure_filename(image_file.filename or "ecg.png")
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)

        # Analyze
        processing_results = processor.process_ecg_image(image_path)

        # Cleanup
        try:
            os.remove(image_path)
        except Exception:
            pass

        if not processing_results.get('success'):
            raise Exception(processing_results.get('error', 'Image processing failed'))

        analysis = processing_results.get('analysis', {})
        features = processing_results.get('features', {})

        # Build patientData aligned with training schema
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

        # Classify
        pred = classifier.predict(patient_data)
        if not pred.get('success'):
            raise Exception(pred.get('error', 'Classification failed'))

        preds = pred.get("predictions", {})
        response = {
            "success": True,
            "image_analysis": {
                "heart_rate": analysis.get("heart_rate", 0.0),
                "rhythm_type": analysis.get("rhythm_type", "unknown"),
                "regularity_score": analysis.get("regularity_score", 0.0),
                "num_beats_detected": analysis.get("num_beats_detected", 0),
            },
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


    # @app.route('/health') → return jsonify({'success': True, 'status': 'ok'})
# @app.route('/health') def health():
#     return jsonify({'success': True, 'status': 'ok'})

if __name__ == '__main__':
    # Dev server for local use. For production, use Gunicorn/Waitress behind a reverse proxy.
    app.run(host='0.0.0.0', port=5001)
