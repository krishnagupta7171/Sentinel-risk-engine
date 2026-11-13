import os
import json
import urllib.parse
import urllib.request
import urllib.error
import time
from collections import defaultdict
from dotenv import load_dotenv
from functools import lru_cache
from fastapi import HTTPException, FastAPI, Query
from pydantic import BaseModel
from contextlib import asynccontextmanager
from src.models.realtime_predict import predict_single_transaction
from src.common.config import DEBUG 
from src.storage.database import (initialize_database,get_transaction_history,save_transaction,transaction_exists,get_all_transactions,get_transaction_stats,get_fraud_analytics,)
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

GEONAMES_USERNAME = os.getenv("GEONAMES_USERNAME")  
GEONAMES_BASE_URL = "https://secure.geonames.org"


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield



app = FastAPI(title="Sentinel Risk Engine",description="Machine Learning Based Fraud Detection API",version="1.0.0",debug=DEBUG,lifespan=lifespan,)

app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],
    allow_credentials=False,allow_methods=["GET", "POST"],allow_headers=["Content-Type"])


API_START_TIME = time.monotonic()

api_metrics = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "prediction_requests": 0,
    "total_response_time_ms": 0.0,
    "endpoints": defaultdict(
        lambda: {
            "requests": 0,
            "errors": 0,
            "total_response_time_ms": 0.0,
        }
    ),
}


@app.middleware("http")
async def monitor_api_requests(request, call_next):

    start_time = time.perf_counter()

    method = request.method
    path = request.url.path

    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        return response

    finally:
        response_time = (time.perf_counter() - start_time) * 1000

        api_metrics["total_requests"] += 1
        api_metrics["total_response_time_ms"] += response_time

        if status_code < 400:
            api_metrics["successful_requests"] += 1
        else:
            api_metrics["failed_requests"] += 1

        if method == "POST" and path == "/predict":
            api_metrics["prediction_requests"] += 1

        
        endpoint = api_metrics["endpoints"][f"{method} {path}"]

        endpoint["requests"] += 1
        endpoint["total_response_time_ms"] += response_time

        if status_code >= 400:
            endpoint["errors"] += 1


def geonames_request(endpoint: str, params: dict):


    url = (
        f"{GEONAMES_BASE_URL}/{endpoint}?"
        f"{urllib.parse.urlencode(params)}"
    )

    request = urllib.request.Request(url,
        headers={"User-Agent": "SentinelRiskEngine/1.0"},)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

        
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")    

        raise HTTPException(
            status_code=502,
            detail=f"GeoNames HTTP error {error.code}: {error_body[:300]}",
        ) from error

    except urllib.error.URLError as error:
        raise HTTPException(
            status_code=502,
            detail=f"GeoNames connection error: {error.reason}",
            ) from error

    except TimeoutError as error:
        raise HTTPException(status_code=502,
            detail="GeoNames request timed out.",
            ) from error

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"GeoNames request failed: {type(error).__name__}: {error}",
            ) from error

    if "status" in data:
        raise HTTPException(
            status_code=502,
            detail="GeoNames API error: "
            + data["status"].get("message", "Unknown error"),
        )

    return data


@lru_cache(maxsize=1)
def get_country_database():

    if not GEONAMES_USERNAME:
        raise HTTPException(status_code=500,
            detail="GeoNames username is not configured.",)

    data = geonames_request("countryInfoJSON",
        {"username": GEONAMES_USERNAME},)

    return {
        item["countryName"].casefold(): item["countryCode"]
        for item in data.get("geonames", [])
    }


@lru_cache(maxsize=512)
def lookup_city_population(city: str, state: str, country: str):
    
    if not GEONAMES_USERNAME:
        raise HTTPException(status_code=500,
            detail="GeoNames username is not configured.",)

    countries = get_country_database()

    country_code = countries.get(country.casefold())

    if not country_code:
        raise HTTPException(status_code=404,
            detail=f"Country '{country}' was not found.",)

    data = geonames_request(
        "searchJSON",
        {
            "name_equals": city,
            "country": country_code,
            "featureClass": "P",
            "maxRows": 100,
            "orderby": "relevance",
            "username": GEONAMES_USERNAME,
        },
    )

    results = data.get("geonames", [])

    # Verify the returned city, state and country.
    matching_city = next(
        (
            item 
            for item in results
            if item.get("name", "").casefold() == city.strip().casefold()
            and item.get("adminName1", "").casefold() == state.strip().casefold()
            and item.get("countryCode", "").upper() == country_code.upper()
        ),
        None,
    )

    if not matching_city:
        raise HTTPException(status_code=404,
            detail="Matching city and state were not found.",)

    population = matching_city.get("population")

    if population is None or population <= 0:
        raise HTTPException(status_code=404,
            detail="Population information is unavailable for this city.",)

    return {
        "city": matching_city["name"],
        "state": matching_city.get("adminName1"),
        "country": matching_city.get("countryName"),
        "city_pop": population,
        "geoname_id": matching_city.get("geonameId"),
    }




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


@app.get("/location/population")
def get_city_population(city: str = Query(..., min_length=1),state: str = Query(..., min_length=1),country: str = Query(..., min_length=1),):
    try:
        return lookup_city_population(
            city.strip(),
            state.strip(),
            country.strip(),
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(status_code=500,
            detail="Population lookup failed.",
        ) from error




@app.post("/predict")
def predict_transaction(request: TransactionRequest):

    try:
        transaction = request.model_dump()

        if transaction_exists(transaction["trans_num"]):
            raise HTTPException(status_code=400,detail="Duplicate transaction ID.",)

        history = get_transaction_history(cc_num=transaction["cc_num"],current_time=transaction["trans_date_trans_time"],hours=24,)
        

        result = predict_single_transaction(transaction,history=history,)

        save_transaction(transaction, prediction = result)

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





@app.get("/transactions")
def list_transactions(limit: int = Query(100, ge=1, le=500),offset: int = Query(0, ge=0),):
    try:
        transactions = get_all_transactions(limit=limit,offset=offset,)

        return {
            "returned": len(transactions),
            "limit": limit,
            "offset": offset,
            "transactions": transactions,
        }

    except Exception as error:
        raise HTTPException(status_code=500,
            detail="Unable to retrieve transactions.",
        ) from error



@app.get("/analytics/overview")
def get_overview_analytics():
    try:
        stats = get_transaction_stats()

        return {
            "total_transactions": stats["total_transactions"],
            "total_amount": round(stats["total_amount"], 2),
            "average_amount": round(stats["average_amount"], 2),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve dashboard analytics.",
        ) from error



@app.get("/analytics/fraud")
def get_fraud_analytics_endpoint():
    try:
        return get_fraud_analytics()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve fraud analytics.",
        ) from error



@app.get("/monitoring/metrics")
def get_monitoring_metrics():

    total_requests = api_metrics["total_requests"]

    average_response_time = (
        api_metrics["total_response_time_ms"] / total_requests
        if total_requests > 0
        else 0
    )

    endpoint_metrics = {}

    for endpoint_name, metrics in api_metrics["endpoints"].items():

        requests = metrics["requests"]

        endpoint_metrics[endpoint_name] = {
            "requests": requests,
            "errors": metrics["errors"],
            "average_response_time_ms": round(
                metrics["total_response_time_ms"] / requests,
                2,
            ) if requests > 0 else 0,
        }

    return {
        "uptime_seconds": round(
            time.monotonic() - API_START_TIME, 2
        ),
        "total_requests": total_requests,
        "successful_requests": api_metrics["successful_requests"],
        "failed_requests": api_metrics["failed_requests"],
        "prediction_requests": api_metrics["prediction_requests"],
        "average_response_time_ms": round(
            average_response_time, 2
        ),
        "endpoints": endpoint_metrics,
    }