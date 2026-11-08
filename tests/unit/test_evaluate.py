import numpy as np
import pandas as pd
import pytest

from src.models.evaluate import evaluate_model


class DummyModel:
    def predict_proba(self, X):
        probabilities = np.array([0.1, 0.8, 0.7, 0.9])

        return np.column_stack([1 - probabilities,probabilities,])


def test_evaluate_model_metrics():
    X = pd.DataFrame({"feature": [1, 2, 3, 4]})
    y = pd.Series([0, 0, 1, 1])

    model = DummyModel()

    metrics = evaluate_model(model,X,y,threshold=0.75,)

    assert metrics["precision"] == pytest.approx(0.5)
    assert metrics["recall"] == pytest.approx(0.5)
    assert metrics["f1_score"] == pytest.approx(0.5)
    assert metrics["accuracy"] == pytest.approx(0.5)

    assert metrics["true_positives"] == 1
    assert metrics["false_positives"] == 1
    assert metrics["true_negatives"] == 1
    assert metrics["false_negatives"] == 1

    assert metrics["pr_auc"] == pytest.approx(0.8333333)
    assert metrics["roc_auc"] == pytest.approx(0.75)
    assert metrics["brier_score"] == pytest.approx(0.1875)


def test_evaluate_model_with_numpy_arrays():
    X = np.array([[1], [2], [3], [4]])
    y = np.array([0, 0, 1, 1])

    metrics = evaluate_model(DummyModel(),X,y,threshold=0.75,)

    assert metrics["true_positives"] == 1
    assert metrics["false_negatives"] == 1


def test_evaluate_model_empty_data():
    X = pd.DataFrame()
    y = pd.Series(dtype=int)

    with pytest.raises(ValueError):
        evaluate_model(DummyModel(), X, y)


def test_evaluate_model_mismatched_rows():
    X = pd.DataFrame({"feature": [1, 2, 3, 4]})
    y = pd.Series([0, 1])

    with pytest.raises(ValueError):
        evaluate_model(DummyModel(), X, y)


def test_evaluate_model_single_class():
    X = pd.DataFrame({"feature": [1, 2, 3]})
    y = pd.Series([0, 0, 0])

    with pytest.raises(ValueError):
        evaluate_model(DummyModel(), X, y)


def test_evaluate_model_invalid_threshold():
    X = pd.DataFrame({"feature": [1, 2, 3, 4]})
    y = pd.Series([0, 0, 1, 1])

    with pytest.raises(ValueError):
        evaluate_model(DummyModel(), X, y, threshold=1.5)
