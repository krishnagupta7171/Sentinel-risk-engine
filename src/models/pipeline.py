
from src.data.splitter import load_and_split_data
from src.features.pipeline import MODEL_FEATURES

from src.models.config import (LIGHTGBM_PARAMS,DECISION_THRESHOLD,PRIMARY_METRIC,)
from src.models.train import train_lightgbm
from src.models.evaluate import evaluate_model
from src.common.tracking import initialize_tracking, log_model_run
from src.models.save import save_model,save_model_metadata  

def run_training_pipeline():

    splits = load_and_split_data()

    train_df = splits["train"]
    validation_df = splits["validation"]

    X_train = train_df[MODEL_FEATURES]
    y_train = train_df["is_fraud"]

    X_validation = validation_df[MODEL_FEATURES]
    y_validation = validation_df["is_fraud"]

    print("Training LightGBM model...")

    model = train_lightgbm(X_train, y_train)

    print("Model training completed.")

    print("Evaluating on validation data...")

    metrics = evaluate_model(model,X_validation,y_validation,threshold=DECISION_THRESHOLD,)

    params = LIGHTGBM_PARAMS.copy()
    params["decision_threshold"] = DECISION_THRESHOLD
    params["primary_metric"] = PRIMARY_METRIC

    initialize_tracking()

    log_model_run(model=model,params=params,metrics=metrics,model_name="lightgbm_validation",)

    save_model(model)



    save_model_metadata({
        "model_name": "LightGBM Fraud Detection",
        "model_version": "1.0.0",
        "model_type": "LGBMClassifier",
        "features": MODEL_FEATURES,
        "parameters": params,
        "decision_threshold": DECISION_THRESHOLD,
        "primary_metric": PRIMARY_METRIC,
    
    })

    print("\nValidation Results")

    for metric_name, value in metrics.items():
        print(f"{metric_name}: {value}")

    print("\nTraining pipeline completed successfully.")

    return model, metrics
