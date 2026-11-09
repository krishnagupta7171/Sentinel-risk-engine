
import pandas as pd
from fastapi.testclient import TestClient

from src.api import main


def test_predict_api_with_transaction_history(monkeypatch):
    calls = []

    # Mock database initialization
    monkeypatch.setattr(main,"initialize_database",lambda: None,)

    # Mock historical transaction retrieval
    history = pd.DataFrame([
        {
            "cc_num": "123456",
            "datetime": "2026-11-09 14:00:00",
            "amt": 500.0,
        }
    ])

    def mock_get_history(cc_num, current_time, hours):
        calls.append("retrieve_history")
        return history

    monkeypatch.setattr(main,"get_transaction_history",mock_get_history,)

    # Mock model prediction
    def mock_predict(transaction, history=None):
        calls.append("predict")

        assert history is not None
        assert len(history) == 1

        return {
            "fraud_probability": 0.05,
            "is_fraud_prediction": 0,
            "risk_label": "Legitimate",
        }

    monkeypatch.setattr(main,"predict_single_transaction",mock_predict,)

    # Mock transaction storage
    def mock_save(transaction):
        calls.append("save_transaction")

    monkeypatch.setattr(main,"save_transaction",mock_save,)

    transaction = {
        "trans_date_trans_time": "2026-11-09 14:30:00",
        "cc_num": 123456,
        "merchant": "test_merchant",
        "category": "shopping_pos",
        "amt": 250.50,
        "city": "Bhagalpur",
        "state": "BR",
        "zip": 812001,
        "lat": 25.2425,
        "long": 86.9842,
        "city_pop": 410000,
        "unix_time": 1794214800,
        "merch_lat": 25.2500,
        "merch_long": 86.9900,
    }

    with TestClient(main.app) as client:
        response = client.post("/predict", json=transaction)

    assert response.status_code == 200

    assert response.json() == {
        "fraud_probability": 0.05,
        "is_fraud_prediction": 0,
        "risk_label": "Legitimate",
    }

    # Verify execution order
    assert calls == [
        "retrieve_history",
        "predict",
        "save_transaction",
    ]


def test_health_api():
    with TestClient(main.app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"




def test_predict_api_does_not_save_on_prediction_failure(monkeypatch):
    calls = []

    monkeypatch.setattr(main,"initialize_database",lambda: None,)

    # Mock historical data retrieval
    def mock_get_history(cc_num, current_time, hours):
        calls.append("retrieve_history")
        return pd.DataFrame(
            columns=["cc_num", "datetime", "amt"]
        )

    monkeypatch.setattr(main,"get_transaction_history",mock_get_history,)

    # Simulate prediction failure
    def mock_predict(transaction, history=None):
        calls.append("predict")
        raise ValueError("Invalid transaction data.")

    monkeypatch.setattr(main,"predict_single_transaction",mock_predict,)

    # Track whether transaction is saved
    def mock_save(transaction):
        calls.append("save_transaction")

    monkeypatch.setattr(main,"save_transaction",mock_save,)

    transaction = {
        "trans_date_trans_time": "2026-11-09 14:30:00",
        "cc_num": 123456,
        "merchant": "test_merchant",
        "category": "shopping_pos",
        "amt": 250.50,
        "city": "Bhagalpur",
        "state": "BR",
        "zip": 812001,
        "lat": 25.2425,
        "long": 86.9842,
        "city_pop": 410000,
        "unix_time": 1794214800,
        "merch_lat": 25.2500,
        "merch_long": 86.9900,
    }

    with TestClient(main.app) as client:
        response = client.post("/predict", json=transaction)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid transaction data."

    # Verify failed prediction was not saved
    assert calls == [
        "retrieve_history",
        "predict",
    ]




def test_predict_api_handles_internal_error(monkeypatch):
    monkeypatch.setattr(main, "initialize_database", lambda: None)

    monkeypatch.setattr(
        main,
        "get_transaction_history",
        lambda *args, **kwargs: pd.DataFrame(
            columns=["cc_num", "datetime", "amt"]
        ),
    )

    monkeypatch.setattr(
        main,
        "predict_single_transaction",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            RuntimeError("Unexpected model error")
        ),
    )

    saved_transactions = []

    monkeypatch.setattr(main,"save_transaction",lambda transaction: saved_transactions.append(transaction),)

    transaction = {
        "trans_date_trans_time": "2026-11-09 14:30:00",
        "cc_num": 123456,
        "merchant": "test_merchant",
        "category": "shopping_pos",
        "amt": 250.50,
        "city": "Bhagalpur",
        "state": "BR",
        "zip": 812001,
        "lat": 25.2425,
        "long": 86.9842,
        "city_pop": 410000,
        "unix_time": 1794214800,
        "merch_lat": 25.2500,
        "merch_long": 86.9900,
    }

    with TestClient(main.app) as client:
        response = client.post("/predict", json=transaction)

    assert response.status_code == 500
    assert response.json()["detail"] == "Internal prediction error."
    assert saved_transactions == []

