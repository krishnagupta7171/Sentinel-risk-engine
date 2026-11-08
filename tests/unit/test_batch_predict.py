
import pandas as pd
import pytest

from src.models import batch_predict


def test_predict_batch(monkeypatch, tmp_path):

    # Create sample transaction data
    input_df = pd.DataFrame({
        "amt": [100, 200, 300],
        "merchant": ["A", "B", "C"],
    })

    input_path = tmp_path / "transactions.csv"
    output_path = tmp_path / "predictions.csv"

    input_df.to_csv(input_path, index=False)

    # Mock prediction function
    def mock_predict_transactions(df, history=None):
        results = df.copy()
        results["fraud_probability"] = [0.10, 0.98, 0.30]
        results["is_fraud_prediction"] = [0, 1, 0]
        results["risk_label"] = ["Legitimate", "Fraud", "Legitimate"]
        return results

    monkeypatch.setattr(batch_predict,"predict_transactions",mock_predict_transactions,)

    # Execute batch inference
    results = batch_predict.predict_batch(input_path,output_path,)

    # Verify predictions
    assert len(results) == 3
    assert results["risk_label"].tolist() == ["Legitimate", "Fraud", "Legitimate"]

    # Verify output CSV
    assert output_path.exists()

    saved_results = pd.read_csv(output_path)

    assert len(saved_results) == 3
    assert "fraud_probability" in saved_results.columns


def test_predict_batch_missing_file(tmp_path):

    input_path = tmp_path / "missing.csv"
    output_path = tmp_path / "predictions.csv"

    with pytest.raises(FileNotFoundError):
        batch_predict.predict_batch(input_path, output_path)


def test_predict_batch_invalid_extension(tmp_path):

    input_path = tmp_path / "transactions.txt"
    output_path = tmp_path / "predictions.csv"

    input_path.write_text("sample data")

    with pytest.raises(ValueError):
        batch_predict.predict_batch(input_path, output_path)
