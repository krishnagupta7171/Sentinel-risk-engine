
import pandas as pd
import pytest

from src.data.splitter import create_chronological_splits


@pytest.fixture
def sample_data():
    return pd.DataFrame({
        "datetime": pd.to_datetime([
            "2019-01-01 10:00:00",
            "2019-01-02 10:00:00",
            "2019-01-03 10:00:00",
            "2019-01-04 10:00:00",
            "2019-01-05 10:00:00",
            "2019-01-06 10:00:00",
        ]),
        "is_fraud": [0, 1, 0, 1, 0, 1],
    })


@pytest.fixture
def sample_boundaries():
    return pd.DataFrame({
        "Split": ["Train", "Validation", "Test"],
        "Start Time": pd.to_datetime([
            "2019-01-01",
            "2019-01-03",
            "2019-01-05",
        ]),
        "End Time": pd.to_datetime([
            "2019-01-02 23:59:59",
            "2019-01-04 23:59:59",
            "2019-01-06 23:59:59",
        ]),
    })


def test_chronological_split_counts(sample_data, sample_boundaries):
    splits = create_chronological_splits(sample_data,sample_boundaries,)

    assert len(splits["train"]) == 2
    assert len(splits["validation"]) == 2
    assert len(splits["test"]) == 2


def test_chronological_split_no_data_loss(sample_data, sample_boundaries):
    splits = create_chronological_splits(sample_data,sample_boundaries,)

    total_rows = sum(len(df) for df in splits.values())

    assert total_rows == len(sample_data)


def test_chronological_split_no_overlap(sample_data, sample_boundaries):
    splits = create_chronological_splits(sample_data,sample_boundaries,)

    all_timestamps = pd.concat([df["datetime"] for df in splits.values()])

    assert all_timestamps.is_unique


def test_chronological_split_order(sample_data, sample_boundaries):
    splits = create_chronological_splits(sample_data,sample_boundaries,)

    assert (splits["train"]["datetime"].max() < splits["validation"]["datetime"].min())

    assert (splits["validation"]["datetime"].max() < splits["test"]["datetime"].min())


def test_empty_split_raises_error(sample_data):
    invalid_boundaries = pd.DataFrame({
        "Split": ["Train", "Validation", "Test"],
        "Start Time": pd.to_datetime([
            "2019-01-01",
            "2019-02-01",
            "2019-03-01",
        ]),
        "End Time": pd.to_datetime([
            "2019-01-31",
            "2019-02-28",
            "2019-03-31",
        ]),
    })

    with pytest.raises(ValueError, match="split is empty"):
        create_chronological_splits(sample_data,invalid_boundaries,)
