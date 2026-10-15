import argparse
import sys
import tempfile
from pathlib import Path
import numpy as np
import pandas as pd
import lightgbm as lgb
import mlflow
from sklearn.metrics import (average_precision_score, roc_auc_score,brier_score_loss,precision_recall_curve)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.features.engineering import transform_features


def parse_args():
    parser = argparse.ArgumentParser(description="Train Sentinel Fraud Risk Engine")
    parser.add_argument(
        "--data-path",
        type=str,
        default="data/raw/fraudTrain.csv",
        help="Path to raw CSV dataset relative to project root"
    )
    parser.add_argument("--learning-rate", type=float, default=0.05, help="LightGBM learning rate")
    parser.add_argument("--n-estimators", type=int, default=300, help="Number of boosting iterations")
    parser.add_argument("--num-leaves", type=int, default=31, help="Max leaves per tree")
    parser.add_argument(
        "--experiment-name",
        type=str,
        default="02_Production_Pipeline",
        help="MLflow experiment name"
    )
    return parser.parse_args()


def configure_tracking(experiment_name: str):
    remote_uri = "https://dagshub.com/krishnagupta96321/Sentinel-risk-engine.mlflow"
    try:
        mlflow.set_tracking_uri(remote_uri)
        mlflow.set_experiment(experiment_name)
        print(f"[MLflow] Connected to remote DagsHub tracking: {remote_uri}")
    except Exception as exc:
        local_uri = "sqlite:///mlruns.db"
        print(f"[MLflow Warning] Remote connection failed ({exc}). Using local: {local_uri}")
        mlflow.set_tracking_uri(local_uri)
        mlflow.set_experiment(experiment_name)


def main():
    args = parse_args()

    # 1. Initialize tracking
    configure_tracking(args.experiment_name)

    # 2. Ingest raw data & enforce chronological ordering
    data_path = PROJECT_ROOT / args.data_path
    print(f"\n[1/4] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    drop_cols = [c for c in ["Unnamed: 0", ""] if c in df.columns]
    if drop_cols:
        df.drop(columns=drop_cols, inplace=True)

    df["datetime"] = pd.to_datetime(df["trans_date_trans_time"])
    df.sort_values(by="unix_time", ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # 3. Leak-free chronological 70% Train, 15% Validation, 15% Test split
    total_len = len(df)
    train_end = int(total_len * 0.70)
    val_end = int(total_len * 0.85)

    print(
        f"[2/4] Split sizes: {train_end:,} train, "
        f"{val_end - train_end:,} validation, "
        f"{total_len - val_end:,} test rows."
    )
    print("Transforming partitions via modularized engineering pipeline...")
    train_df = transform_features(df.iloc[:train_end])
    val_df = transform_features(df.iloc[train_end:val_end])
    test_df = transform_features(df.iloc[val_end:])

    feature_cols = [
        "amt", "log_amt", "city_pop", "haversine_dist_km",
        "hour_sin", "hour_cos", "dow_sin", "dow_cos", "is_weekend",
        "tx_count_1h", "tx_sum_1h", "tx_count_24h", "tx_sum_24h"
    ]
    target_col = "is_fraud"

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    # 4. LightGBM setup
    lgb_params = {
        "objective": "binary",
        "metric": "average_precision",
        "boosting_type": "gbdt",
        "n_estimators": args.n_estimators,
        "learning_rate": args.learning_rate,
        "num_leaves": args.num_leaves,
        "scale_pos_weight": 1.0,
        "random_state": 42,
        "n_jobs": -1
    }

    with mlflow.start_run(run_name="lightgbm_production_pipeline"):
        mlflow.log_params(lgb_params)
        mlflow.log_param("num_features", len(feature_cols))
        mlflow.log_param("features", feature_cols)

        print("\n[3/4] Training LightGBM model with early stopping on validation partition...")
        model = lgb.LGBMClassifier(**lgb_params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(stopping_rounds=30, verbose=False)]
        )

        # 5. Out-of-Time Test Evaluation
        print("\n[4/4] Evaluating out-of-time test partition...")
        test_probs = model.predict_proba(X_test)[:, 1]
        test_pr_auc = float(average_precision_score(y_test, test_probs))
        test_roc_auc = float(roc_auc_score(y_test, test_probs))
        test_brier = float(brier_score_loss(y_test, test_probs))

        mlflow.log_metric("test_pr_auc", test_pr_auc)
        mlflow.log_metric("test_roc_auc", test_roc_auc)
        mlflow.log_metric("test_brier_score", test_brier)

        # 6. Operational Threshold Calibration
        precision, recall, thresholds = precision_recall_curve(y_test, test_probs)
        thresh_records = []
        for target_p in [0.70, 0.80, 0.85, 0.90]:
            valid_idx = np.where(precision[:-1] >= target_p)[0]
            if len(valid_idx) > 0:
                idx = valid_idx[0]
                thresh = float(thresholds[idx])
                rec = float(recall[idx])
                thresh_records.append({
                    "target_precision": f"{int(target_p * 100)}%",
                    "threshold": round(thresh, 4),
                    "recall": f"{rec * 100:.2f}%"
                })
                mlflow.log_metric(f"threshold_at_p{int(target_p * 100)}", round(thresh, 4))
                mlflow.log_metric(f"recall_at_p{int(target_p * 100)}", round(rec, 4))

        cutoff_df = pd.DataFrame(thresh_records)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp:
            cutoff_df.to_csv(tmp.name, index=False)
            mlflow.log_artifact(tmp.name, artifact_path="calibration")

        # 7. Model artifact logging
        mlflow.lightgbm.log_model(model, name="model")

    
        print("--TRAINING PIPELINE COMPLETE--")
        print(f"Test PR-AUC:      {test_pr_auc:.4f}")
        print(f"Test ROC-AUC:     {test_roc_auc:.4f}")
        print(f"Test Brier Score: {test_brier:.4f}")
        print("Calibrated Operational Thresholds:")
        print(cutoff_df.to_string(index=False))


if __name__ == "__main__":
    main()