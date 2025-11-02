import os
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, mean_absolute_error

# Base directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Models path
crop_model_path = os.path.join(BASE_DIR, "crop_type_model.pkl")
water_model_path = os.path.join(BASE_DIR, "water_need_model.pkl")

# Data path (inside ai/data/)
data_path = os.path.join(BASE_DIR, "data/sensor_data.csv")

# Check if files exist
if not os.path.exists(crop_model_path) or not os.path.exists(water_model_path):
    raise FileNotFoundError("Models not found. Run train_models.py first.")

if not os.path.exists(data_path):
    raise FileNotFoundError("sensor_data.csv not found. Make sure it's in 'ai/data/' folder.")

# Load models
crop_model = joblib.load(crop_model_path)
water_model = joblib.load(water_model_path)

# Load data
data = pd.read_csv(data_path)

# Features and labels
X = data[["temperature", "humidity", "soil", "ph", "npk"]]
y_crop = data["crop_type"]
y_water = data["water_need"]

# Predict
crop_pred = crop_model.predict(X)
water_pred = water_model.predict(X)

# Evaluate
accuracy = accuracy_score(y_crop, crop_pred)
mae = mean_absolute_error(y_water, water_pred)

print(f"✅ Crop type accuracy: {accuracy*100:.2f}%")
print(f"✅ Water need mean absolute error: {mae:.2f}")
