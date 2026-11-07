
from pathlib import Path

import pandas as pd


# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Default raw dataset location
RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "fraudTrain.csv"


# Columns required by our feature engineering pipeline
REQUIRED_COLUMNS = [
    "trans_date_trans_time",
    "cc_num",
    "merchant",
    "category",
    "amt",
    "city",
    "state",
    "zip",
    "lat",
    "long",
    "city_pop",
    "unix_time",
    "merch_lat",
    "merch_long",
]


def validate_transaction_data(df: pd.DataFrame) -> None:

    if df.empty:
        raise ValueError("Transaction dataset is empty.")

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )


def load_transactions(file_path: str | Path = RAW_DATA_PATH,nrows: int | None = None,) -> pd.DataFrame:
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"Transaction dataset not found: {file_path}"
        )

    df = pd.read_csv(file_path,nrows=nrows,)

    validate_transaction_data(df)

    return df
