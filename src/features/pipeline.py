
import pandas as pd

from src.features.engineering import create_static_features
from src.features.velocity import create_velocity_features


# Exact feature order used during model training
MODEL_FEATURES = [
    "amt",
    "log_amt",
    "city_pop",
    "haversine_dist_km",
    "hour_sin",
    "hour_cos",
    "dow_sin",
    "dow_cos",
    "is_weekend",
    "tx_count_1h",
    "tx_sum_1h",
    "tx_count_24h",
    "tx_sum_24h",
]


def create_feature_pipeline(df: pd.DataFrame,history: pd.DataFrame | None = None,) -> pd.DataFrame:
    

    if df.empty:
        return pd.DataFrame(columns=MODEL_FEATURES)

    # Step 1: Generate static and temporal features
    engineered_df = create_static_features(df)

    # Step 2: Generate historical velocity features
    velocity_df = create_velocity_features(engineered_df,history=history,)

    # Step 3: Combine both feature groups
    final_features = pd.concat(
        [
            engineered_df.reset_index(drop=True),
            velocity_df.reset_index(drop=True),
        ],axis=1,)

    # Step 4: Select exact model feature names and order
    final_features = final_features[MODEL_FEATURES]

    # Step 5: Validate final feature structure
    if final_features.isna().any().any():
        raise ValueError(
            "Feature pipeline generated missing values."
        )

    return final_features
