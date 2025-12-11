import h5py
import json
import numpy as np

def inspect_model():
    """Inspect the model file to understand its structure"""
    try:
        with h5py.File('smartbin.h5', 'r') as f:
            print("Model file structure:")
            def print_structure(name, obj):
                if isinstance(obj, h5py.Dataset):
                    print(f"  Dataset: {name}, shape: {obj.shape}, dtype: {obj.dtype}")
                elif isinstance(obj, h5py.Group):
                    print(f"  Group: {name}")

            f.visititems(print_structure)

            print(f"\nAvailable datasets/groups: {list(f.keys())}")

            if 'model_config' in f:
                print("✓ model_config found!")
                config_str = f['model_config'][()].decode('utf-8')
                print(f"Model config length: {len(config_str)}")
                # Print first 1000 chars to see structure
                print(f"Model config preview: {config_str[:1000]}...")
                # Try to parse and find batch_shape
                try:
                    import json
                    config = json.loads(config_str)
                    print("\nSearching for batch_shape in config...")

                    def find_batch_shape(obj, path=""):
                        if isinstance(obj, dict):
                            for key, value in obj.items():
                                current_path = f"{path}.{key}" if path else key
                                if key == 'batch_shape':
                                    print(f"Found batch_shape at {current_path}: {value}")
                                elif isinstance(value, (dict, list)):
                                    find_batch_shape(value, current_path)
                        elif isinstance(obj, list):
                            for i, item in enumerate(obj):
                                current_path = f"{path}[{i}]"
                                find_batch_shape(item, current_path)

                    find_batch_shape(config)
                except Exception as e:
                    print(f"Error parsing config: {e}")
            else:
                print("✗ model_config not found in file!")

    except Exception as e:
        print(f"Error inspecting model: {e}")

def create_model_config():
    """Create a minimal model config that avoids batch_shape issues"""
    # Create a very simple config that just defines the input and output structure
    # This will allow the model to load, then we can manually set the architecture
    config = {
        "class_name": "Functional",
        "config": {
            "name": "model",
            "layers": [
                {
                    "class_name": "InputLayer",
                    "config": {
                        "dtype": "float32",
                        "sparse": False,
                        "ragged": False,
                        "name": "input_layer"
                    },
                    "name": "input_layer",
                    "inbound_nodes": []
                },
                {
                    "class_name": "Dense",
                    "config": {
                        "name": "dense_1",
                        "trainable": True,
                        "dtype": "float32",
                        "units": 6,
                        "activation": "softmax",
                        "use_bias": True,
                        "kernel_initializer": {"class_name": "GlorotUniform", "config": {"seed": None}},
                        "bias_initializer": {"class_name": "Zeros", "config": {}},
                        "kernel_regularizer": None,
                        "bias_regularizer": None,
                        "activity_regularizer": None,
                        "kernel_constraint": None,
                        "bias_constraint": None
                    },
                    "name": "dense_1",
                    "inbound_nodes": [[["input_layer", 0, 0, {}]]]
                }
            ],
            "input_layers": [["input_layer", 0, 0]],
            "output_layers": [["dense_1", 0, 0]]
        },
        "keras_version": "2.13.0",
        "backend": "tensorflow"
    }

    return config

def fix_model_batch_shape():
    """Try to fix the batch_shape issue by creating/modifying the model config"""
    try:
        with h5py.File('smartbin.h5', 'r+') as f:
            if 'model_config' in f:
                print("model_config exists, attempting to fix batch_shape...")
                config_str = f['model_config'][()].decode('utf-8')
                config = json.loads(config_str)

                # Function to recursively remove batch_shape
                def remove_batch_shape(obj):
                    if isinstance(obj, dict):
                        # Remove batch_shape from current level
                        if 'batch_shape' in obj:
                            print(f"Removing batch_shape: {obj['batch_shape']}")
                            del obj['batch_shape']

                        # Check config section
                        if 'config' in obj and isinstance(obj['config'], dict):
                            if 'batch_shape' in obj['config']:
                                print(f"Removing batch_shape from config: {obj['config']['batch_shape']}")
                                del obj['config']['batch_shape']

                        # Recursively process all values
                        for key, value in obj.items():
                            if isinstance(value, (dict, list)):
                                remove_batch_shape(value)
                    elif isinstance(obj, list):
                        for item in obj:
                            remove_batch_shape(item)

                print("Starting batch_shape removal...")
                remove_batch_shape(config)

                # Save the fixed config
                fixed_config_str = json.dumps(config)
                del f['model_config']
                f.create_dataset('model_config', data=fixed_config_str.encode('utf-8'))
                print("✓ Model config updated successfully!")
                return True
            else:
                print("model_config not found, creating new config...")
                config = create_model_config()
                config_str = json.dumps(config)
                f.create_dataset('model_config', data=config_str.encode('utf-8'))
                print("✓ Model config created successfully!")
                return True
    except Exception as e:
        print(f"✗ Error fixing model: {e}")
        return False

if __name__ == "__main__":
    print("Inspecting model file...")
    inspect_model()
    print("\nFixing model config...")
    fix_model_batch_shape()
