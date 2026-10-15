import numpy as np
import pandas as pd

EARTH_RADIUS_KM = 6371.0

def haversine_distance(lat1: np.ndarray | pd.Series, lon1: np.ndarray | pd.Series,lat2: np.ndarray | pd.Series,lon2: np.ndarray | pd.Series) -> np.ndarray:

    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    a = np.sin(delta_phi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0)**2
    return EARTH_RADIUS_KM * 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

def add_temporal_cyclical_features(df: pd.DataFrame, time_col: str = "datetime") -> pd.DataFrame:
    
    df = df.copy()
    hour = df[time_col].dt.hour
    dow = df[time_col].dt.dayofweek
    
    df["hour_sin"] = np.sin(2.0 * np.pi * hour / 24.0)
    df["hour_cos"] = np.cos(2.0 * np.pi * hour / 24.0)
    df["dow_sin"] = np.sin(2.0 * np.pi * dow / 7.0)
    df["dow_cos"] = np.cos(2.0 * np.pi * dow / 7.0)
    df["is_weekend"] = dow.isin([5, 6]).astype(int)
    return df

def compute_card_velocity_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.sort_values(by=["cc_num", "datetime"], ascending=True, inplace=True)
    
    def _card_rolling(group: pd.DataFrame) -> pd.DataFrame:
        g = group.set_index("datetime")
        group["tx_count_1h"] = g["amt"].rolling("1h", closed="left").count().values
        group["tx_sum_1h"] = g["amt"].rolling("1h", closed="left").sum().values
        group["tx_count_24h"] = g["amt"].rolling("24h", closed="left").count().values
        group["tx_sum_24h"] = g["amt"].rolling("24h", closed="left").sum().values
        return group

    df = df.groupby("cc_num", group_keys=False).apply(_card_rolling, include_groups=False)
    velocity_cols = ["tx_count_1h", "tx_sum_1h", "tx_count_24h", "tx_sum_24h"]
    df[velocity_cols] = df[velocity_cols].fillna(0.0)
    
    df.sort_values(by="unix_time", ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def transform_features(df: pd.DataFrame, include_velocity: bool = True) -> pd.DataFrame:
    df = df.copy()
    if "datetime" not in df.columns:
        df["datetime"] = pd.to_datetime(df["trans_date_trans_time"])
        
    df["haversine_dist_km"] = haversine_distance(
        df["lat"].values, df["long"].values,
        df["merch_lat"].values, df["merch_long"].values
    )
    df["log_amt"] = np.log1p(df["amt"])
    df = add_temporal_cyclical_features(df, time_col="datetime")
    
    if include_velocity:
        df = compute_card_velocity_features(df)
        
    return df