import sys
import json
import pandas as pd
import numpy as np
import joblib
import os


def model_path(fname):
    return os.path.join(os.path.dirname(__file__), fname)


def load_input():
    # Prefer argv[1] if provided (file path or JSON string), else read stdin
    if len(sys.argv) > 1:
        input_arg = sys.argv[1]
        if os.path.exists(input_arg):
            with open(input_arg) as f:
                return json.load(f)
        else:
            return json.loads(input_arg)

    # read from stdin
    raw = sys.stdin.read()
    if not raw:
        raise ValueError("No input provided to predict.py (stdin empty)")
    return json.loads(raw)


def main():
    try:
        data = load_input()

    # Load model artifacts (paths relative to this script)
        crop_art = joblib.load(model_path("crop_model.pkl"))
        water_art = joblib.load(model_path("water_model.pkl"))

        # Extract pipelines and label encoder
        crop_pipeline = crop_art.get("pipeline") if isinstance(crop_art, dict) else crop_art
        crop_le = crop_art.get("label_encoder") if isinstance(crop_art, dict) else None

        water_pipeline = water_art.get("pipeline") if isinstance(water_art, dict) else water_art

        # Build input DataFrame matching the features used at training time
        features = crop_art.get("features") if isinstance(crop_art, dict) else None
        if features:
            # case-insensitive input map
            lc = {k.lower(): v for k, v in data.items()}
            row = []
            for f in features:
                # prefer exact key, then case-insensitive
                if f in data:
                    val = data[f]
                elif f.lower() in lc:
                    val = lc[f.lower()]
                else:
                    # special mapping: if model expects N,P,K but client provided combined 'npk'
                    if f in ["N", "P", "K"] and "npk" in lc:
                        try:
                            val = float(lc["npk"])
                        except Exception:
                            val = np.nan
                    else:
                        # leave missing - the pipeline's imputer will fill
                        val = np.nan
                # coerce numeric where possible
                try:
                    val = float(val)
                except Exception:
                    pass
                row.append(val)

            df = pd.DataFrame([row], columns=features)
        else:
            df = pd.DataFrame([data])

        # Predictions
        pred_encoded = crop_pipeline.predict(df)[0]
        if crop_le is not None:
            try:
                predicted_crop = crop_le.inverse_transform([int(pred_encoded)])[0]
            except Exception:
                # if label encoder expects strings
                predicted_crop = crop_le.inverse_transform([pred_encoded])[0]
        else:
            predicted_crop = pred_encoded

        predicted_water = water_pipeline.predict(df)[0]

        print(json.dumps({
            "predicted_crop": predicted_crop,
            "predicted_water_need": round(float(predicted_water), 2),
            "status": "success"
        }))
        sys.exit(0)

    except Exception as e:
        # Write error JSON and exit non-zero so caller can detect failure
        sys.stderr.write(str(e) + "\n")
        print(json.dumps({"error": str(e), "status": "failed"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
