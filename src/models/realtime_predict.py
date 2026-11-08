
import pandas as pd

from src.models.predict import predict_transactions


def predict_single_transaction(transaction,history=None,):
    if not isinstance(transaction, dict):
        raise TypeError("Transaction must be a dictionary.")

    if not transaction:
        raise ValueError("Transaction data cannot be empty.")

    # Convert transaction into a DataFrame
    df = pd.DataFrame([transaction])

    # Generate prediction
    results = predict_transactions(df,history=history,)

    # Return prediction as a dictionary
    return results.iloc[0].to_dict()
