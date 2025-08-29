import sys
import json
from ecg_image_processor import ECGImageProcessor
from ecg_classifier import ECGClassifier

def main():
    try:
        # Get arguments passed from Node.js
        # sys.argv[0] is the script name itself
        image_path = sys.argv[1]
        patient_age = int(sys.argv[2])
        gender = int(sys.argv[3]) # Expecting 0 for female, 1 for male

        # === STAGE 1: Process the image to get features ===
        processor = ECGImageProcessor()
        processing_results = processor.process_ecg_image(image_path)
        
        if not processing_results['success']:
            raise Exception(f"Image processing failed: {processing_results['error']}")
            
        extracted_features = processing_results['features']

        # === STAGE 2: Prepare data and make a prediction ===
        classifier = ECGClassifier()
        
        # Match the feature list the classifier was trained on
        input_for_classifier = {
            'PatientAge': patient_age,
            'Gender': gender,
            'VentricularRate': extracted_features.get('heart_rate', 80),
            'AtrialRate': extracted_features.get('heart_rate', 80),
            'QRSDuration': 90,  # Placeholder - you might extract this in the future
            'QTInterval': 380,  # Placeholder
            'QTCorrected': 410, # Placeholder
            'RAxis': 60,        # Placeholder
            'TAxis': 45,        # Placeholder
            'QRSCount': extracted_features.get('num_peaks', 10)
        }
        
        final_prediction = classifier.predict(input_for_classifier)

        if not final_prediction['success']:
             raise Exception(f"Classification failed: {final_prediction['error']}")

        # === Final Output ===
        # Combine results and print as a single JSON string to stdout
        # This is how Node.js will receive the data
        output = {
            'success': True,
            'image_analysis': processing_results['analysis'],
            'prediction': final_prediction['predictions']
        }
        print(json.dumps(output))

    except Exception as e:
        # If anything goes wrong, print an error JSON to stderr
        error_output = { 'success': False, 'error': str(e) }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()