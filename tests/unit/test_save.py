
import numpy as np
import pytest

from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression

from src.models.save import save_model, load_model


@pytest.fixture
def trained_model():
    X, y = make_classification(n_samples=100,n_features=5,random_state=42,)

    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)

    return model, X


def test_save_model(trained_model, tmp_path):
    model, _ = trained_model

    model_path = tmp_path / "test_model.joblib"

    saved_path = save_model(model, model_path)

    assert saved_path.exists()


def test_load_model(trained_model, tmp_path):
    model, X = trained_model

    model_path = tmp_path / "test_model.joblib"

    save_model(model, model_path)

    loaded_model = load_model(model_path)

    assert hasattr(loaded_model, "predict_proba")

    original_predictions = model.predict_proba(X)
    loaded_predictions = loaded_model.predict_proba(X)

    np.testing.assert_allclose(original_predictions,loaded_predictions,)


def test_load_nonexistent_model(tmp_path):
    model_path = tmp_path / "missing_model.joblib"

    with pytest.raises(FileNotFoundError):
        load_model(model_path)
