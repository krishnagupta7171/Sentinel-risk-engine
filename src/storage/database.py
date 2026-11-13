
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

        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(transactions)"
            ).fetchall()
        ]

        if "trans_num" not in columns:
            connection.execute("""
                ALTER TABLE transactions
                ADD COLUMN trans_num TEXT
            """)

        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(transactions)"
            ).fetchall()
        ]

        prediction_columns = {
            "fraud_probability": "REAL",
            "is_fraud_prediction": "INTEGER",
            "risk_label": "TEXT",
        }

        for column_name, column_type in prediction_columns.items():
            if column_name not in columns:
                connection.execute(
                    f"ALTER TABLE transactions ADD COLUMN {column_name} {column_type}"
                )

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_card_datetime
            ON transactions (cc_num, datetime)
        """)

        connection.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_trans_num
            ON transactions (trans_num)
            WHERE trans_num IS NOT NULL
        """)

        connection.commit()

    finally:
        connection.close()

    print("Database initialized successfully.")


def save_transaction(transaction, prediction=None):
    required_fields = [
        "trans_num",
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

    trans_num = str(transaction["trans_num"]).strip()

    if not trans_num:
        raise ValueError("Transaction ID cannot be empty.")

    if prediction is not None:
        prediction_fields = [
            "fraud_probability",
            "is_fraud_prediction",
            "risk_label",
        ]


        missing_prediction_fields = [
            field for field in prediction_fields
            if field not in prediction
        ]

        if missing_prediction_fields:
            raise ValueError(
                f"Missing prediction fields: {missing_prediction_fields}"
            )


    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO transactions (trans_num,  cc_num, datetime, amt, fraud_probability, is_fraud_prediction, risk_label)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                trans_num,
                str(transaction["cc_num"]),
                pd.to_datetime(transaction["trans_date_trans_time"],errors="raise",).strftime("%Y-%m-%d %H:%M:%S"),
                float(transaction["amt"]),
                float(prediction["fraud_probability"]) if prediction is not None else None,
                int(prediction["is_fraud_prediction"]) if prediction is not None else None,
                str(prediction["risk_label"]) if prediction is not None else None,
            ),
        )

        connection.commit()

    except sqlite3.IntegrityError as error:
        raise ValueError(
            f"Duplicate transaction ID: {trans_num}"
        ) from error

    finally:
        connection.close()


def transaction_exists(trans_num):
    connection = get_connection()

    try:
        result = connection.execute(
            """
            SELECT 1
            FROM transactions
            WHERE trans_num = ?
            LIMIT 1
            """,
            (str(trans_num).strip(),),
        ).fetchone()

        return result is not None

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



def get_all_transactions(limit=100, offset=0):
    connection = get_connection()

    try:
        transactions = connection.execute(
            """
            SELECT id, trans_num, cc_num, datetime, amt, fraud_probability, is_fraud_prediction, risk_label
            FROM transactions
            ORDER BY id DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()

        return [dict(row) for row in transactions]

    finally:
        connection.close()



def get_transaction_stats():
    connection = get_connection()

    try:
        stats = connection.execute(
            """
            SELECT
                COUNT(*) AS total_transactions,
                COALESCE(SUM(amt), 0) AS total_amount,
                COALESCE(AVG(amt), 0) AS average_amount
            FROM transactions
            """
        ).fetchone()

        return dict(stats)

    finally:
        connection.close()


def get_fraud_analytics():
    connection = get_connection()

    try:
        analytics = connection.execute(
            """
            SELECT
                COUNT(*) AS total_predictions,

                SUM(
                    CASE
                        WHEN is_fraud_prediction = 1 THEN 1
                        ELSE 0
                    END
                ) AS fraud_transactions,

                SUM(
                    CASE
                        WHEN is_fraud_prediction = 0 THEN 1
                        ELSE 0
                    END
                ) AS legitimate_transactions,

                COALESCE(
                    SUM(
                        CASE
                            WHEN is_fraud_prediction = 1 THEN amt
                            ELSE 0
                        END
                    ),
                    0
                ) AS fraud_amount,

                COALESCE(
                    AVG(fraud_probability),
                    0
                ) AS average_fraud_probability

            FROM transactions
            WHERE is_fraud_prediction IS NOT NULL
            """
        ).fetchone()

        result = dict(analytics)

        total = result["total_predictions"]

        result["fraud_rate"] = (
            round(result["fraud_transactions"] / total * 100, 2)
            if total > 0 else 0
        )

        result["legitimate_rate"] = (
            round(result["legitimate_transactions"] / total * 100, 2)
            if total > 0 else 0
        )

        return result

    finally:
        connection.close()
