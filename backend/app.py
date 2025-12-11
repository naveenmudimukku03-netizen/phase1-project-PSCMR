from flask import Flask, render_template
from flask_cors import CORS
import tensorflow as tf
from models import WASTE_CATEGORIES
from utils import load_model_safely
from routes import home, get_categories, predict, test, health_check

app = Flask(__name__, static_folder='../frontend', static_url_path='/static', template_folder='../frontend')
CORS(app)

print("=" * 60)
print("SmartBin ")
print("=" * 60)

print(f"Defined {len(WASTE_CATEGORIES)} waste categories")

# Check TensorFlow version
print(f"TensorFlow Version: {tf.__version__}")

# Load the model
model = load_model_safely()

# Set model in utils for routes to use
import utils
utils.model = model

# Register routes
app.add_url_rule('/', 'home', home, methods=['GET'])
app.add_url_rule('/api/categories', 'get_categories', get_categories, methods=['GET'])
app.add_url_rule('/predict', 'predict', predict, methods=['POST'])
app.add_url_rule('/test', 'test', test, methods=['GET'])
app.add_url_rule('/api/health', 'health_check', health_check, methods=['GET'])

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Starting SmartBin Waste Classification Server...")
    print(f"Model loaded: {'Yes' if model else 'No (Demo Mode)'}")
    print(f"Waste categories: {len(WASTE_CATEGORIES)}")
    print("Server URL: http://localhost:5000")
    print("API Test: http://localhost:5000/test")
    print("Categories API: http://localhost:5000/api/categories")
    print("Health Check: http://localhost:5000/api/health")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=5000)
