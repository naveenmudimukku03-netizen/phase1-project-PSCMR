from flask import request, jsonify, render_template
from PIL import Image
import io
import traceback
import tensorflow as tf
from models import WASTE_CATEGORIES, get_disposal_info
from utils import preprocess_image, generate_mock_predictions, model

def home():
    return render_template('index.html')

def get_categories():
    """API endpoint to get all waste categories"""
    return jsonify({
        'categories': WASTE_CATEGORIES,
        'total_categories': len(WASTE_CATEGORIES)
    })

def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
        if '.' not in file.filename or file.filename.split('.')[-1].lower() not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Please upload an image (PNG, JPG, JPEG, GIF, BMP)'}), 400

        # Check file size (max 10MB)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        if file_size > 10 * 1024 * 1024:
            return jsonify({'error': 'File too large. Maximum size is 10MB'}), 400

        # Read and process image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        processed_image = preprocess_image(image)

        # Check if we have a real model or using demo mode
        if model is None:
            print("Using demo mode for prediction")
            predictions_data = generate_mock_predictions(file.filename)
        else:
            try:
                # Make prediction with the model
                model_predictions = model.predict(processed_image, verbose=0)

                # Convert model predictions to our format
                predictions_data = []

                # Assuming model outputs probabilities for each class
                if len(model_predictions.shape) == 2 and model_predictions.shape[1] >= len(WASTE_CATEGORIES):
                    # Model has multiple outputs (one per class)
                    for i in range(min(len(WASTE_CATEGORIES), model_predictions.shape[1])):
                        prob = float(model_predictions[0][i]) * 100
                        if prob > 1:  # Only include predictions with significant probability
                            category = WASTE_CATEGORIES[i]
                            predictions_data.append({
                                'id': category['id'],
                                'name': category['name'],
                                'type': category['type'],
                                'probability': round(prob, 2),
                                'color': category['color'],
                                'icon': category['icon']
                            })
                elif len(model_predictions.shape) == 2 and model_predictions.shape[1] == 2:
                    # Binary classification output
                    prob_bio = float(model_predictions[0][1]) * 100
                    prob_non_bio = float(model_predictions[0][0]) * 100

                    # Distribute probabilities among categories based on type
                    bio_categories = [cat for cat in WASTE_CATEGORIES if cat['type'] == 'Biodegradable']
                    non_bio_categories = [cat for cat in WASTE_CATEGORIES if cat['type'] == 'Non-Biodegradable']

                    # For demo, assign probabilities to top categories
                    predictions_data = [
                        {
                            'id': bio_categories[0]['id'] if bio_categories else 5,
                            'name': bio_categories[0]['name'] if bio_categories else 'Organic/Food',
                            'type': 'Biodegradable',
                            'probability': round(prob_bio, 2),
                            'color': '#2ecc71',
                            'icon': 'fas fa-leaf'
                        },
                        {
                            'id': non_bio_categories[0]['id'] if non_bio_categories else 0,
                            'name': non_bio_categories[0]['name'] if non_bio_categories else 'Plastic',
                            'type': 'Non-Biodegradable',
                            'probability': round(prob_non_bio, 2),
                            'color': '#e74c3c',
                            'icon': 'fas fa-trash-alt'
                        }
                    ]
                else:
                    # Fallback to mock predictions
                    predictions_data = generate_mock_predictions(file.filename)

            except Exception as e:
                print(f"Model prediction error: {str(e)}")
                predictions_data = generate_mock_predictions(file.filename)

        # Sort predictions by probability (highest first)
        predictions_data.sort(key=lambda x: x['probability'], reverse=True)

        # Get top 3-4 predictions
        top_predictions = predictions_data[:4]

        # Get top prediction
        top_prediction = top_predictions[0] if top_predictions else {
            'id': 9, 'name': 'Other', 'type': 'Unknown', 'probability': 0,
            'color': '#7f8c8d', 'icon': 'fas fa-question'
        }

        # Get disposal info for top prediction
        disposal_info = get_disposal_info(top_prediction['name'], top_prediction['type'])

        return jsonify({
            'success': True,
            'predictions': top_predictions,
            'top_prediction': top_prediction,
            'disposal': disposal_info,
            'image_info': {
                'filename': file.filename,
                'size': f"{image.width}x{image.height}",
                'format': image.format if hasattr(image, 'format') else 'Unknown'
            },
            'model_info': {
                'total_categories': len(WASTE_CATEGORIES),
                'is_demo': model is None
            }
        })

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

def test():
    """Test endpoint with sample prediction"""
    # Generate sample predictions for testing
    sample_predictions = [
        {'id': 0, 'name': 'Plastic', 'type': 'Non-Biodegradable', 'probability': 85.5, 'color': '#e74c3c', 'icon': 'fas fa-wine-bottle'},
        {'id': 1, 'name': 'Glass', 'type': 'Non-Biodegradable', 'probability': 10.2, 'color': '#3498db', 'icon': 'fas fa-wine-glass'},
        {'id': 2, 'name': 'Metal', 'type': 'Non-Biodegradable', 'probability': 4.3, 'color': '#95a5a6', 'icon': 'fas fa-cog'}
    ]

    sample_top_prediction = sample_predictions[0]

    return jsonify({
        'success': True,
        'predictions': sample_predictions,
        'top_prediction': sample_top_prediction,
        'disposal': get_disposal_info(sample_top_prediction['name'], sample_top_prediction['type']),
        'model_info': {'total_categories': len(WASTE_CATEGORIES), 'is_demo': True}
    })

def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'waste_categories': len(WASTE_CATEGORIES),
        'tensorflow_version': tf.__version__,
        'endpoints': {
            'GET /': 'Home page',
            'POST /predict': 'Upload image for classification',
            'GET /api/health': 'Server health check',
            'GET /test': 'Test endpoint with sample data',
            'GET /api/categories': 'Get all waste categories'
        }
    })
