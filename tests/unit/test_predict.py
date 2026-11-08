import numpy as np
import pandas as pd
import pytest

from src.models import predict


class DummyModel:

    def predict_proba(self, X):
        return np.array([
            [0.10, 0.90],
            [0.02, 0.98],
        ])


def test_predict_transactions(monkeypatch):

    df = pd.DataFrame({"amt": [100, 200]})

    features = pd.DataFrame({"feature_1": [1, 2]})

    monkeypatch.setattr(predict,"load_model",lambda: DummyModel())

    monkeypatch.setattr(predict,"create_feature_pipeline",lambda df, history=None: features)

    results = predict.predict_transactions(df)

    assert results["is_fraud_prediction"].tolist() == [0, 1]

    assert results["risk_label"].tolist() == [
        "Legitimate",
        "Fraud"
    ]

    assert results["fraud_probability"].tolist() == [0.90, 0.98]


def test_predict_empty_data():

    df = pd.DataFrame()

    with pytest.raises(ValueError):
        predict.predict_transactions(df)


def test_predict_invalid_threshold():

    df = pd.DataFrame({"amt": [100]})

    with pytest.raises(ValueError):
        predict.predict_transactions(df, threshold=1.5)