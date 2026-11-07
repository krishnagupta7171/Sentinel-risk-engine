
import numpy as np
import pandas as pd
from src.features.velocity import create_velocity_features
from src.features.engineering import create_static_features
import pytest

from src.features.engineering import haversine_distance


def test_haversine_distance_same_location():
    # Distance between identical coordinates should be zero
    distance = haversine_distance(25.0, 85.0, 25.0, 85.0)

    assert distance == pytest.approx(0.0, abs=1e-6)


def test_haversine_distance_known_locations():
    # Approximate distance between two nearby coordinates
    distance = haversine_distance(25.0, 85.0, 25.1, 85.0)

    assert distance == pytest.approx(11.12, rel=0.01)



def test_create_static_features():
    df = pd.DataFrame({
        "trans_date_trans_time": [
            "2019-01-05 10:00:00",  # Saturday
            "2019-01-07 14:00:00",  # Monday
        ],
        "amt": [100.0, 200.0],
        "city_pop": [10000, 20000],
        "lat": [25.0, 26.0],
        "long": [85.0, 86.0],
        "merch_lat": [25.1, 26.1],
        "merch_long": [85.1, 86.1],
    })

    result = create_static_features(df)

    # Weekend detection
    assert result["is_weekend"].tolist() == [1, 0]

    # Log amount transformation
    assert result["log_amt"].tolist() == pytest.approx(
        np.log1p([100.0, 200.0])
    )

    # Cyclical hour encoding
    assert result["hour_sin"].iloc[0] == pytest.approx(
        np.sin(2 * np.pi * 10 / 24)
    )

    # Check generated distance feature
    assert (result["haversine_dist_km"] > 0).all()

    # Check datetime conversion
    assert pd.api.types.is_datetime64_any_dtype(result["datetime"])

    # Check original DataFrame was not modified
    assert "datetime" not in df.columns




def test_velocity_features():
    df = pd.DataFrame({
        "cc_num": [12345, 12345, 12345, 12345],
        "datetime": pd.to_datetime([
            "2019-01-01 10:00:00",
            "2019-01-01 10:20:00",
            "2019-01-01 10:40:00",
            "2019-01-01 12:00:00",
        ]),
        "amt": [500.0, 1000.0, 2000.0, 3000.0],
    })

    result = create_velocity_features(df)

    # 1-hour transaction counts
    assert result["tx_count_1h"].tolist() == [0, 1, 2, 0]

    # 1-hour transaction sums
    assert result["tx_sum_1h"].tolist() == [0, 500, 1500, 0]

    # 24-hour transaction counts
    assert result["tx_count_24h"].tolist() == [0, 1, 2, 3]

    # 24-hour transaction sums
    assert result["tx_sum_24h"].tolist() == [0, 500, 1500, 3500]

    # No missing values
    assert not result.isna().any().any()
