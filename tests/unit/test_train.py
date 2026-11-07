
import pandas as pd
from sklearn.datasets import make_classification

from src.models.train import train_lightgbm


def test_train_lightgbm():
    # Generate a small synthetic imbalanced dataset
    X, y = make_classification(
        n_samples=200,
        n_features=13,
        n_informative=8,
        n_redundant=2,
        weights=[0.9, 0.1],
        random_state=42,
    )

    X_train = pd.DataFrame(X)
    y_train = pd.Series(y)

    # Train model
    model = train_lightgbm(X_train, y_train)

    # Verify model was trained
    assert hasattr(model, "predict_proba")

    # Verify probability predictions
    probabilities = model.predict_proba(X_train)

    assert probabilities.shape == (200, 2)
    assert ((probabilities >= 0) & (probabilities <= 1)).all()
