import sys
import json
from ecg_image_processor import ECGImageProcessor
from ecg_classifier import ECGClassifier


def main():
    try:
        image_path = sys.argv[1]
        patient_age = int(sys.argv[2])
        gender = int(sys.argv[3])

        processor = ECGImageProcessor()
        processing_results = processor.process_ecg_image(image_path)

        if not processing_results['success']:
            raise Exception(f"Image processing failed: {processing_results['error']}")

        extracted_features = processing_results['features']

        classifier = ECGClassifier()

        input_for_classifier = {
            'PatientAge': patient_age,
            'Gender': gender,
            'VentricularRate': extracted_features.get('heart_rate', 80),
            'AtrialRate': extracted_features.get('heart_rate', 80),
            'QRSDuration': 90,
            'QTInterval': 380,
            'QTCorrected': 410,
            'RAxis': 60,
            'TAxis': 45,
            'QRSCount': extracted_features.get('num_peaks', 10)
        }

        final_prediction = classifier.predict(input_for_classifier)

        if not final_prediction['success']:
            raise Exception(f"Classification failed: {final_prediction['error']}")

        output = {
            'success': True,
            'image_analysis': processing_results['analysis'],
            'prediction': final_prediction['predictions']
        }
        print(json.dumps(output))

    except Exception as e:
        error_output = { 'success': False, 'error': str(e) }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()