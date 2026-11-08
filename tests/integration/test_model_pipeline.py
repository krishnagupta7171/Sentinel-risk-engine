
import pandas as pd

from src.features.pipeline import MODEL_FEATURES
from src.models import pipeline


def create_sample_split(rows):
    data = {
        feature: [0.5] * rows
        for feature in MODEL_FEATURES
    }

    data["is_fraud"] = [0, 1] * (rows // 2)

    return pd.DataFrame(data)


def test_model_training_pipeline(monkeypatch):

    # Arrange: Create small synthetic splits
    splits = {
        "train": create_sample_split(20),
        "validation": create_sample_split(10),
        "test": create_sample_split(10),
    }

    monkeypatch.setattr(pipeline,"load_and_split_data",lambda: splits,)

    dummy_model = object()
    captured = {}

    # Mock model training
    def mock_train(X, y):
        captured["train_rows"] = len(X)
        captured["train_features"] = list(X.columns)
        return dummy_model

    monkeypatch.setattr(pipeline,"train_lightgbm",mock_train,)

    # Mock model evaluation
    expected_metrics = {"pr_auc": 0.85}

    def mock_evaluate(model, X, y, threshold):
        captured["validation_rows"] = len(X)
        captured["threshold"] = threshold
        assert model is dummy_model
        return expected_metrics

    monkeypatch.setattr(pipeline,"evaluate_model",mock_evaluate,)

    # Mock MLflow tracking
    monkeypatch.setattr(pipeline,"initialize_tracking",lambda: object(),)

    def mock_log_model_run(**kwargs):
        captured["logged_model"] = kwargs["model"]
        captured["logged_metrics"] = kwargs["metrics"]
        captured["logged_name"] = kwargs["model_name"]

    monkeypatch.setattr(pipeline,"log_model_run",mock_log_model_run,)

    # Act: Run the pipeline
    model, metrics = pipeline.run_training_pipeline()

    # Assert: Verify the complete workflow
    assert model is dummy_model
    assert metrics == expected_metrics

    assert captured["train_rows"] == 20
    assert captured["validation_rows"] == 10

    assert captured["train_features"] == MODEL_FEATURES
    assert captured["threshold"] == pipeline.DECISION_THRESHOLD

    assert captured["logged_model"] is dummy_model
    assert captured["logged_metrics"] == expected_metrics
    assert captured["logged_name"] == "lightgbm_validation"
