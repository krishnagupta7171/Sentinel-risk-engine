
import os

APP_ENV = os.getenv("APP_ENV", "development")
API_PORT = int(os.getenv("API_PORT", 8000))

DEBUG = APP_ENV == "development"
