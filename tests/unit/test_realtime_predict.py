
import pandas as pd
import pytest

from src.models import realtime_predict


def test_predict_single_transaction(monkeypatch):

    transaction = {
        "amt": 250.50,
        "merchant": "test_merchant",
    }

    # Mock the prediction function
    def mock_predict_transactions(df, history=None):
        results = df.copy()
        results["fraud_probability"] = 0.98
        results["is_fraud_prediction"] = 1
        results["risk_label"] = "Fraud"
        return results

    monkeypatch.setattr(realtime_predict,"predict_transactions",mock_predict_transactions,)

    result = realtime_predict.predict_single_transaction(transaction)

    assert result["fraud_probability"] == 0.98
    assert result["is_fraud_prediction"] == 1
    assert result["risk_label"] == "Fraud"


def test_predict_empty_transaction():

    with pytest.raises(ValueError):
        realtime_predict.predict_single_transaction({})


def test_predict_invalid_transaction_type():

    with pytest.raises(TypeError):
        realtime_predict.predict_single_transaction("invalid")
