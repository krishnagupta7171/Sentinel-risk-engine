
import pandas as pd
from functools import lru_cache

from src.models.save import load_model
from src.models.config import DECISION_THRESHOLD
from src.features.pipeline import create_feature_pipeline


@lru_cache(maxsize=1)
def get_model():
    return load_model()


def predict_transactions(df,history=None,threshold=DECISION_THRESHOLD,):
    if df.empty:
        raise ValueError("Input transaction data cannot be empty.")

    if not 0 <= threshold <= 1:
        raise ValueError("Threshold must be between 0 and 1.")

    # Reuse the cached model
    model = get_model()

    # Generate model features
    features = create_feature_pipeline(df,history=history,)

    # Generate fraud probabilities
    probabilities = model.predict_proba(features)[:, 1]

    # Classify transactions
    predictions = (probabilities >= threshold).astype(int)

    results = df.copy()

    results["fraud_probability"] = probabilities
    results["is_fraud_prediction"] = predictions
    results["risk_label"] = [
        "Fraud" if prediction == 1 else "Legitimate"
        for prediction in predictions
    ]

    return results
