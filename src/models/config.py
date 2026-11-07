
# Selected LightGBM configuration from Optuna optimization

LIGHTGBM_PARAMS = {
    "n_estimators": 937,
    "learning_rate": 0.010636066512540286,
    "num_leaves": 147,
    "max_depth": 11,
    "min_child_samples": 29,
    "subsample": 0.6727299868828402,
    "colsample_bytree": 0.6733618039413735,
    "reg_alpha": 3.0424224295953772,
    "reg_lambda": 5.247564316322379,
    "subsample_freq": 1,
    "class_weight": "balanced",
    "objective": "binary",
    "verbosity": -1,
    "random_state": 42,
    "n_jobs": -1,
}

# Selected operating threshold from validation
DECISION_THRESHOLD = 0.96

# Primary evaluation metric
PRIMARY_METRIC = "average_precision"
