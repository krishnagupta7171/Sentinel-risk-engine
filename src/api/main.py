from fastapi import HTTPException, FastAPI
from pydantic import BaseModel
from contextlib import asynccontextmanager
from src.models.realtime_predict import predict_single_transaction

from src.storage.database import (initialize_database,get_transaction_history,save_transaction,transaction_exists,)

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Sentinel Risk Engine",description="Machine Learning Based Fraud Detection API",version="1.0.0",lifespan=lifespan,)

class TransactionRequest(BaseModel):
    trans_num: str 
    trans_date_trans_time: str
    cc_num: int
    merchant: str
    category: str
    amt: float
    city: str
    state: str
    zip: int
    lat: float
    long: float
    city_pop: int
    unix_time: int
    merch_lat: float
    merch_long: float

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Sentinel Risk Engine",
        "version": "1.0.0",
    }


@app.post("/predict")
def predict_transaction(request: TransactionRequest):

    try:
        transaction = request.model_dump()

        if transaction_exists(transaction["trans_num"]):
            raise HTTPException(status_code=400,detail="Duplicate transaction ID.",)

        history = get_transaction_history(cc_num=transaction["cc_num"],current_time=transaction["trans_date_trans_time"],hours=24,)
        

        result = predict_single_transaction(transaction,history=history,)

        save_transaction(transaction)

        return {
            "fraud_probability": result["fraud_probability"],
            "is_fraud_prediction": result["is_fraud_prediction"],
            "risk_label": result["risk_label"],
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=400,detail=str(error),)

    except Exception as error:
        raise HTTPException(status_code=500,detail="Internal prediction error.",) from error