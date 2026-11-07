
from lightgbm import LGBMClassifier

from src.models.config import LIGHTGBM_PARAMS


def train_lightgbm(X_train, y_train):
    # Initialize LightGBM with Optuna-selected parameters
    model = LGBMClassifier(**LIGHTGBM_PARAMS)

    # Train the model
    model.fit(X_train, y_train)

    return model
