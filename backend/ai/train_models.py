import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error


def data_path(fname):
	return os.path.join(os.path.dirname(__file__), "data", fname)


def find_dataset():
	# Prefer Crop_recommendation.csv, fallback to sensor_data.csv
	candidates = ["Crop_recommendation.csv", "sensor_data.csv"]
	for c in candidates:
		p = data_path(c)
		if os.path.exists(p):
			return p
	raise FileNotFoundError("No suitable dataset found in ai/data/. Put Crop_recommendation.csv or sensor_data.csv there.")


def build_and_save_models(dataset_path=None):
	if dataset_path is None:
		dataset_path = find_dataset()

	print("Loading dataset:", dataset_path)
	data = pd.read_csv(dataset_path)

	# Determine available feature set
	# Prefer columns: N,P,K,temperature,humidity,ph,rainfall
	if set(["N", "P", "K"]).issubset(data.columns):
		features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
		available = [c for c in features if c in data.columns]
	else:
		# sensor style: temperature,humidity,soil,ph,npk
		features = ["temperature", "humidity", "soil", "ph", "npk"]
		available = [c for c in features if c in data.columns]

	if len(available) == 0:
		raise ValueError("No known feature columns found in dataset")

	X = data[available].copy()

	# Target for crop classification
	if "label" in data.columns:
		y_crop = data["label"].astype(str)
	elif "crop_type" in data.columns:
		y_crop = data["crop_type"].astype(str)
	else:
		raise ValueError("No crop label column found (expected 'label' or 'crop_type')")

	# Target for water need: use water_need column if present, otherwise synthesize from rainfall
	if "water_need" in data.columns:
		y_water = data["water_need"].astype(float)
		water_is_synthetic = False
	elif "rainfall" in data.columns:
		# higher rainfall -> lower water need. Normalize rainfall and invert.
		r = data["rainfall"].astype(float)
		r_min, r_max = r.min(), r.max()
		if r_max - r_min == 0:
			norm = np.zeros_like(r)
		else:
			norm = (r - r_min) / (r_max - r_min)
		# water_need in range [0.1, 1.0] as a heuristic
		y_water = (1.0 - norm) * 0.9 + 0.1
		water_is_synthetic = True
	else:
		# As a last resort, use humidity/temperature to estimate need
		if "humidity" in data.columns:
			h = data["humidity"].astype(float)
			# heuristic: lower humidity -> higher water need
			h_min, h_max = h.min(), h.max()
			if h_max - h_min == 0:
				hn = np.zeros_like(h)
			else:
				hn = (h - h_min) / (h_max - h_min)
			y_water = (1.0 - hn) * 0.9 + 0.1
			water_is_synthetic = True
		else:
			raise ValueError("No column available to derive water need (need 'water_need', 'rainfall' or 'humidity')")

	# Preprocess + model pipelines
	imputer = SimpleImputer(strategy="median")
	scaler = StandardScaler()

	crop_pipeline = Pipeline([
		("imputer", imputer),
		("scaler", scaler),
		("clf", RandomForestClassifier(n_estimators=200, random_state=42)),
	])

	water_pipeline = Pipeline([
		("imputer", SimpleImputer(strategy="median")),
		("scaler", StandardScaler()),
		("reg", RandomForestRegressor(n_estimators=200, random_state=42)),
	])

	# Encode crop labels
	le = LabelEncoder()
	y_crop_enc = le.fit_transform(y_crop)

	# Train/test split
	X_train, X_test, y_crop_train, y_crop_test, y_water_train, y_water_test = train_test_split(
		X, y_crop_enc, y_water, test_size=0.2, random_state=42
	)

	# Fit models
	print("Training crop classifier on features:", available)
	crop_pipeline.fit(X_train, y_crop_train)
	crop_preds = crop_pipeline.predict(X_test)
	acc = accuracy_score(y_crop_test, crop_preds)
	print(f"Crop classifier accuracy: {acc:.3f}")

	print("Training water-need regressor")
	water_pipeline.fit(X_train, y_water_train)
	water_preds = water_pipeline.predict(X_test)
	# Some sklearn versions don't accept the 'squared' kwarg; compute RMSE manually
	mse = mean_squared_error(y_water_test, water_preds)
	rmse = mse ** 0.5
	print(f"Water regressor RMSE: {rmse:.4f}")

	# Save artifacts
	out_dir = os.path.join(os.path.dirname(__file__))
	crop_art = {
		"pipeline": crop_pipeline,
		"label_encoder": le,
		"features": available,
	}
	water_art = {"pipeline": water_pipeline, "features": available, "synthetic": bool(water_is_synthetic)}

	joblib.dump(crop_art, os.path.join(out_dir, "crop_model.pkl"))
	joblib.dump(water_art, os.path.join(out_dir, "water_model.pkl"))

	print("✅ Saved crop_model.pkl and water_model.pkl in ai/")


if __name__ == "__main__":
	import argparse

	parser = argparse.ArgumentParser(description="Train crop classifier and water-need regressor")
	parser.add_argument("--data", help="Path to CSV dataset (optional)")
	args = parser.parse_args()
	build_and_save_models(args.data)
