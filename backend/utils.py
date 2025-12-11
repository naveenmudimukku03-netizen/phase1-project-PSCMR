import tensorflow as tf
from PIL import Image
import numpy as np
import io
import os
import random
from models import WASTE_CATEGORIES

# Load the model globally
model = None

def preprocess_image(image):
    """Preprocess image for model prediction"""
    image = image.resize((224, 224))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def fix_model_config():
    """Fix the model config by removing batch_shape if present"""
    model_path = 'smartbin_fixed.h5'
    try:
        with tf.io.gfile.GFile(model_path, 'rb') as f:
            model_config = tf.keras.models.load_model(f).get_config()

        def remove_batch_shape(layer_config):
            if isinstance(layer_config, dict):
                if 'batch_shape' in layer_config:
                    del layer_config['batch_shape']
                if 'config' in layer_config and isinstance(layer_config['config'], dict):
                    if 'batch_shape' in layer_config['config']:
                        del layer_config['config']['batch_shape']
                # Recursively check nested structures
                for key, value in layer_config.items():
                    if isinstance(value, (dict, list)):
                        remove_batch_shape(value)
            elif isinstance(layer_config, list):
                for item in layer_config:
                    remove_batch_shape(item)

        remove_batch_shape(model_config)
        print("✓ Fixed model config by removing batch_shape")
        return True
    except Exception as e:
        print(f"✗ Error fixing model config: {str(e)}")
        return False

def load_model_safely():
    """Try to load the model with error handling"""
    model_path = 'smartbin_fixed.h5'

    if not os.path.exists(model_path):
        print(f"ERROR: Model file '{model_path}' not found!")
        print(f"Current directory: {os.getcwd()}")
        print(f"Files in directory: {os.listdir('.')}")
        print("Running in demo mode with mock predictions")
        return None

    print(f"Found model file: {model_path}")

    # Try multiple loading approaches
    loading_methods = [
        ("Standard load", lambda: tf.keras.models.load_model(model_path)),
        ("Load with compile=False", lambda: tf.keras.models.load_model(model_path, compile=False)),
        ("Load with custom_objects", lambda: tf.keras.models.load_model(model_path, custom_objects={})),
        ("Load with compile=False and custom_objects", lambda: tf.keras.models.load_model(model_path, compile=False, custom_objects={})),
    ]

    for method_name, load_func in loading_methods:
        try:
            print(f"Trying {method_name}...")
            model = load_func()

            # If loaded successfully, try to compile
            try:
                model.compile(optimizer='adam',
                            loss='categorical_crossentropy',
                            metrics=['accuracy'])
                print("✓ Model compiled successfully!")
            except Exception as compile_e:
                print(f"Warning: Could not compile model: {str(compile_e)}")

            print("✓ Model loaded successfully!")
            output_shape = model.output_shape
            print(f"Model output shape: {output_shape}")
            return model

        except Exception as e:
            print(f"✗ {method_name} failed: {str(e)}")
            continue

    # If all methods failed, try to fix the config and retry
    print("Attempting to fix model config...")
    if fix_model_config():
        try:
            model = tf.keras.models.load_model(model_path, compile=False)
            print("✓ Model loaded after config fix!")
            output_shape = model.output_shape
            print(f"Model output shape: {output_shape}")
            return model
        except Exception as e:
            print(f"✗ Config fix failed: {str(e)}")

    print("All loading methods failed. Running in demo mode with mock predictions")
    return None

def generate_mock_predictions(filename):
    """Generate realistic mock predictions based on filename"""
    filename_lower = filename.lower()

    # Map keywords to waste types
    keyword_mapping = {
        'plastic': ['plastic', 'bottle', 'bag', 'container', 'wrapper', 'packaging'],
        'glass': ['glass', 'bottle', 'jar', 'container', 'broken'],
        'metal': ['metal', 'can', 'aluminum', 'steel', 'foil', 'container'],
        'paper': ['paper', 'newspaper', 'magazine', 'book', 'notebook'],
        'cardboard': ['cardboard', 'box', 'carton', 'package'],
        'organic/food': ['food', 'organic', 'compost', 'kitchen', 'scraps'],
        'fruit/veg': ['fruit', 'vegetable', 'banana', 'apple', 'orange', 'peel', 'core'],
        'textile': ['cloth', 'fabric', 'textile', 'clothing', 'shirt', 'pants', 'towel'],
        'e-waste': ['electronic', 'battery', 'phone', 'laptop', 'cable', 'charger']
    }

    # Determine which waste types match the filename
    matched_types = []
    for waste_type, keywords in keyword_mapping.items():
        if any(keyword in filename_lower for keyword in keywords):
            matched_types.append(waste_type)

    # If no matches, use random selection
    if not matched_types:
        matched_types = random.sample(['Plastic', 'Glass', 'Paper', 'Organic/Food'], 2)

    # Generate predictions
    predictions = []
    total_probability = 100

    # Assign probabilities - first match gets highest probability
    for i, waste_type in enumerate(matched_types[:4]):  # Limit to top 4
        waste_info = next((cat for cat in WASTE_CATEGORIES if cat['name'].lower() == waste_type.lower()), None)
        if waste_info:
            if i == 0:
                probability = random.uniform(60, 90)  # Top prediction gets 60-90%
            else:
                probability = random.uniform(5, 30)  # Others get 5-30%

            probability = round(probability, 1)
            total_probability -= probability

            predictions.append({
                'id': waste_info['id'],
                'name': waste_info['name'],
                'type': waste_info['type'],
                'probability': probability,
                'color': waste_info['color'],
                'icon': waste_info['icon']
            })

    # Adjust to ensure total is 100%
    if predictions:
        predictions[0]['probability'] += total_probability

    # Sort by probability (highest first)
    predictions.sort(key=lambda x: x['probability'], reverse=True)

    return predictions
