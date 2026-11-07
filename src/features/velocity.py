
import pandas as pd


def create_velocity_features(df: pd.DataFrame,history: pd.DataFrame | None = None,) -> pd.DataFrame:
    
    required_columns = ["cc_num", "datetime", "amt"]

    if df.empty:
        return pd.DataFrame(columns=[
            "tx_count_1h",
            "tx_sum_1h",
            "tx_count_24h",
            "tx_sum_24h",
        ])

    for name, data in [("df", df), ("history", history)]:
        if data is not None:
            missing = [
                col for col in required_columns
                if col not in data.columns
            ]

            if missing:
                raise ValueError(
                    f"Missing columns in {name}: {missing}"
                )

    # Prepare current transactions
    current = df[required_columns].copy()
    current["_original_order"] = range(len(current))
    current["_is_current"] = True

    current["datetime"] = pd.to_datetime(current["datetime"],errors="raise")

    # Prepare historical transactions
    if history is not None:
        historical = history[required_columns].copy()

        historical["datetime"] = pd.to_datetime(historical["datetime"],errors="raise")

        historical["_original_order"] = -1
        historical["_is_current"] = False

        combined = pd.concat([historical, current],ignore_index=True)
    else:
        combined = current.copy()

    # Sort chronologically
    combined["_sequence"] = range(len(combined))

    combined = combined.sort_values(["cc_num", "datetime", "_sequence"], kind="mergesort")

    results = []

    for _, group in combined.groupby("cc_num", sort=False):

        group = group.copy()

        amounts = group.set_index("datetime")["amt"]

        # Previous 1 hour
        group["tx_count_1h"] = (amounts.rolling("1h", closed="left").count().fillna(0).to_numpy())

        group["tx_sum_1h"] = (amounts.rolling("1h", closed="left").sum().fillna(0).to_numpy())

        # Previous 24 hours
        group["tx_count_24h"] = (amounts.rolling("24h", closed="left").count().fillna(0).to_numpy())

        group["tx_sum_24h"] = (amounts.rolling("24h", closed="left").sum().fillna(0).to_numpy())

        results.append(group)

    result = pd.concat(results)

    # Keep only current transactions
    result = result[result["_is_current"]].copy()

    # Restore original order
    result = result.sort_values("_original_order")

    velocity_columns = [
        "tx_count_1h",
        "tx_sum_1h",
        "tx_count_24h",
        "tx_sum_24h",
    ]

    return result[velocity_columns].reset_index(drop=True)
