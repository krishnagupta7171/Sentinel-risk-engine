
import pandas as pd

from src.features.pipeline import create_feature_pipeline, MODEL_FEATURES


def test_feature_pipeline_output():
    # Arrange: create sample transactions
    df = pd.DataFrame({
        "trans_date_trans_time": [
            "2019-01-01 10:00:00",
            "2019-01-01 10:20:00",
            "2019-01-01 12:00:00",
        ],
        "cc_num": [12345, 12345, 12345],
        "amt": [100.0, 50.0, 200.0],
        "city_pop": [10000, 10000, 10000],
        "lat": [25.0, 25.0, 25.0],
        "long": [85.0, 85.0, 85.0],
        "merch_lat": [25.1, 25.1, 25.1],
        "merch_long": [85.1, 85.1, 85.1],
    })

    # Act: generate features
    result = create_feature_pipeline(df)

    # Assert: check output shape and feature names
    assert result.shape == (3, 13)
    assert result.columns.tolist() == MODEL_FEATURES

    # Assert: no missing values
    assert not result.isna().any().any()

    # Assert: check 1-hour velocity
    assert result["tx_count_1h"].tolist() == [0, 1, 0]
    assert result["tx_sum_1h"].tolist() == [0, 100, 0]

    # Assert: check 24-hour velocity
    assert result["tx_count_24h"].tolist() == [0, 1, 2]
    assert result["tx_sum_24h"].tolist() == [0, 100, 150]



def test_feature_pipeline_with_history():
    # Historical transactions
    history = pd.DataFrame({
        "cc_num": [12345, 12345],
        "datetime": pd.to_datetime([
            "2019-01-01 10:00:00",
            "2019-01-01 10:20:00",
        ]),
        "amt": [100.0, 50.0],
    })

    # New transaction
    df = pd.DataFrame({
        "trans_date_trans_time": ["2019-01-01 10:40:00"],
        "cc_num": [12345],
        "amt": [200.0],
        "city_pop": [10000],
        "lat": [25.0],
        "long": [85.0],
        "merch_lat": [25.1],
        "merch_long": [85.1],
    })

    result = create_feature_pipeline(df, history=history)

    # Both historical transactions should be counted
    assert result["tx_count_1h"].iloc[0] == 2
    assert result["tx_sum_1h"].iloc[0] == 150.0

    assert result["tx_count_24h"].iloc[0] == 2
    assert result["tx_sum_24h"].iloc[0] == 150.0




def test_feature_pipeline_with_empty_data():
    df = pd.DataFrame()

    result = create_feature_pipeline(df)

    assert result.empty
    assert result.columns.tolist() == MODEL_FEATURES
