
import numpy as np

from sklearn.metrics import (average_precision_score,roc_auc_score,precision_score,recall_score,f1_score,accuracy_score,brier_score_loss,confusion_matrix,)


def evaluate_model(model, X, y, threshold=0.96):
    if len(X) == 0:
        raise ValueError("Evaluation features cannot be empty.")

    if len(X) != len(y):
        raise ValueError("X and y must have the same number of rows.")

    if len(np.unique(y)) < 2:
        raise ValueError("Evaluation data must contain both classes.")

    if not 0 <= threshold <= 1:
        raise ValueError("Threshold must be between 0 and 1.")

    # Get fraud probabilities (class 1)
    probabilities = model.predict_proba(X)[:, 1]

    # Convert probabilities into class predictions
    predictions = (probabilities >= threshold).astype(int)

    # Calculate confusion matrix
    tn, fp, fn, tp = confusion_matrix(y, predictions, labels=[0, 1]).ravel()

    # Calculate evaluation metrics
    metrics = {
        "pr_auc": average_precision_score(y, probabilities),
        "roc_auc": roc_auc_score(y, probabilities),
        "precision": precision_score(y, predictions, zero_division=0),
        "recall": recall_score(y, predictions, zero_division=0),
        "f1_score": f1_score(y, predictions, zero_division=0),
        "accuracy": accuracy_score(y, predictions),
        "brier_score": brier_score_loss(y, probabilities),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
    }

    return metrics
