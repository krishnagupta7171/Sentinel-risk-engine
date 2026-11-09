
import sqlite3
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATABASE_DIR = PROJECT_ROOT / "data" / "database"
DATABASE_PATH = DATABASE_DIR / "transactions.db"


def get_connection():
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cc_num TEXT NOT NULL,
                datetime TEXT NOT NULL,
                amt REAL NOT NULL
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_card_datetime
            ON transactions (cc_num, datetime)
        """)

        connection.commit()

    finally:
        connection.close()

    print("Database initialized successfully.")


def save_transaction(transaction):
    required_fields = [
        "cc_num",
        "trans_date_trans_time",
        "amt",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in transaction
    ]

    if missing_fields:
        raise ValueError(f"Missing transaction fields: {missing_fields}")

    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO transactions (cc_num, datetime, amt)
            VALUES (?, ?, ?)
            """,
            (
                str(transaction["cc_num"]),
                pd.to_datetime(transaction["trans_date_trans_time"],errors="raise",).strftime("%Y-%m-%d %H:%M:%S"),
                float(transaction["amt"]),
            ),
        )

        connection.commit()

    finally:
        connection.close()


def get_transaction_history(cc_num, current_time, hours=24):
    if hours <= 0:
        raise ValueError("Hours must be greater than zero.")

    current_time = pd.to_datetime(current_time,errors="raise",).strftime("%Y-%m-%d %H:%M:%S")

    connection = get_connection()

    try:
        query = """
            SELECT cc_num, datetime, amt
            FROM transactions
            WHERE cc_num = ?
              AND datetime >= datetime(?, ?)
              AND datetime < ?
            ORDER BY datetime ASC
        """

        history = pd.read_sql_query(
            query,
            connection,
            params=(
                str(cc_num),
                current_time,
                f"-{hours} hours",
                current_time,
            ),
        )

        return history

    finally:
        connection.close()
