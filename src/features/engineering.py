import numpy as np
import pandas as pd

def haversine_distance(lat1, lon1, lat2, lon2):

    earth_radius = 6371

    lat1, lon1, lat2, lon2 = map(np.radians,[lat1, lon1, lat2, lon2])

    a = (np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2)

    return 2 * earth_radius * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def create_static_features(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()

    required_columns = [
        "trans_date_trans_time",
        "amt",
        "city_pop",
        "lat",
        "long",
        "merch_lat",
        "merch_long",
    ]

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    # Convert transaction timestamp
    df["datetime"] = pd.to_datetime(df["trans_date_trans_time"],errors="raise")

    # Geographic distance between customer and merchant
    df["haversine_dist_km"] = haversine_distance(
        df["lat"],
        df["long"],
        df["merch_lat"],
        df["merch_long"],
    )

    # Extract temporal information
    hour = df["datetime"].dt.hour
    dow = df["datetime"].dt.dayofweek

    # Cyclical time encoding
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)

    df["dow_sin"] = np.sin(2 * np.pi * dow / 7)
    df["dow_cos"] = np.cos(2 * np.pi * dow / 7)

    # Weekend indicator
    df["is_weekend"] = dow.isin([5, 6]).astype(int)

    # Monetary transformation
    df["log_amt"] = np.log1p(df["amt"])

    return df
