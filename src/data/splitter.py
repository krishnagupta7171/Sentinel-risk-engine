from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

FEATURE_DATA_PATH = (
    PROJECT_ROOT / "data" / "processed" / "fraud_features.parquet"
)

SPLIT_BOUNDARIES_PATH = PROJECT_ROOT / "data" / "split_boundaries.csv"


def load_processed_data():

    if not FEATURE_DATA_PATH.exists():
        raise FileNotFoundError(f"Processed dataset not found: {FEATURE_DATA_PATH}")

    df = pd.read_parquet(FEATURE_DATA_PATH)

    if df.empty:
        raise ValueError("Processed dataset is empty.")

    df["datetime"] = pd.to_datetime(df["datetime"], errors="raise")

    return df


def load_split_boundaries():

    if not SPLIT_BOUNDARIES_PATH.exists():
        raise FileNotFoundError(f"Split boundaries not found: {SPLIT_BOUNDARIES_PATH}")

    boundaries = pd.read_csv(SPLIT_BOUNDARIES_PATH,parse_dates=["Start Time", "End Time"],)

    required_splits = {"Train", "Validation", "Test"}

    if set(boundaries["Split"]) != required_splits:
        raise ValueError("Expected Train, Validation and Test boundaries.")

    return boundaries


def create_chronological_splits(df, boundaries):
    splits = {}

    for _, row in boundaries.iterrows():

        split_name = row["Split"].lower()

        split_df = df[
            df["datetime"].between(
                row["Start Time"],
                row["End Time"],
                inclusive="both",
            )
        ].copy()

        if split_df.empty:
            raise ValueError(f"{split_name} split is empty.")

        splits[split_name] = split_df.reset_index(drop=True)

    return splits


def load_and_split_data():
    df = load_processed_data()
    boundaries = load_split_boundaries()

    return create_chronological_splits(df, boundaries)
