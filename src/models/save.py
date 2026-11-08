
from pathlib import Path
import json
from datetime import datetime, timezone
import joblib


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = PROJECT_ROOT / "artifacts" / "models"
MODEL_PATH = MODEL_DIR / "lightgbm_fraud_model.joblib"


def save_model(model, model_path=MODEL_PATH):
    
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, model_path)

    print(f"Model saved successfully: {model_path}")

    return model_path


def load_model(model_path=MODEL_PATH):

    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path}"
        )

    model = joblib.load(model_path)

    print(f"Model loaded successfully: {model_path}")

    return model


def save_model_metadata(metadata,model_path=MODEL_PATH,):

    model_path = Path(model_path)

    metadata_path = model_path.parent / "metadata.json"

    metadata_path.parent.mkdir(parents=True, exist_ok=True)

    metadata = metadata.copy()
    metadata["saved_at"] = datetime.now(timezone.utc).isoformat()

    with open(metadata_path, "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=4)

    print(f"Model metadata saved successfully: {metadata_path}")

    return metadata_path
