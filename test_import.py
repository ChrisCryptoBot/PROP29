import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

try:
    from schemas import SensorType
    print("Successfully imported SensorType from schemas")
except ImportError as e:
    print(f"ImportError: {e}")

try:
    from models import SensorType
    print("Successfully imported SensorType from models")
except ImportError as e:
    print(f"ImportError: {e}")
