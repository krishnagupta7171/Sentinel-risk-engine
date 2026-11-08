from pathlib import Path
import pandas as pd

from src.models.predict import predict_transactions


def predict_batch(input_path,output_path,history=None,):
    input_path = Path(input_path)
    output_path = Path(output_path)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input file not found: {input_path}"
        )

    if input_path.suffix.lower() != ".csv":
        raise ValueError("Input file must be a CSV.")

    # Load transaction data
    df = pd.read_csv(input_path)

    if df.empty:
        raise ValueError("Input CSV cannot be empty.")

    # Generate predictions
    results = predict_transactions(df,history=history,)

    # Create output directory
    output_path.parent.mkdir(parents=True,exist_ok=True,)

    # Save predictions
    results.to_csv(output_path, index=False)

    print(f"Batch predictions saved: {output_path}")

    return results
