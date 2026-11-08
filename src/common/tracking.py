
import os

import dagshub
import mlflow


REPO_OWNER = "krishnagupta96321"
REPO_NAME = "Sentinel-risk-engine"

EXPERIMENT_NAME = "03_Model_Training_and_Evaluation"


def initialize_tracking():

    dagshub.init(
        repo_owner=REPO_OWNER,
        repo_name=REPO_NAME,
        mlflow=True,
    )

    mlflow.set_experiment(EXPERIMENT_NAME)

    return mlflow



def log_model_run(model,params,metrics,model_name="lightgbm",):

    with mlflow.start_run(run_name=model_name):

        # Log model hyperparameters
        mlflow.log_params(params)

        # Log evaluation metrics
        mlflow.log_metrics(metrics)

        # Log trained model
        mlflow.sklearn.log_model(sk_model=model,name=model_name,
        skops_trusted_types=[
        "collections.OrderedDict",
        "lightgbm.basic.Booster",
        "lightgbm.sklearn.LGBMClassifier",
    ],)

        print("Model run logged successfully.")
