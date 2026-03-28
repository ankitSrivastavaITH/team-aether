"""
Ingest City of Richmond contracts CSV into DuckDB.

Downloads the CSV from the open data portal, renames/casts columns,
computes risk levels based on contract expiry, and loads into DuckDB.
"""

import os
import sys
from datetime import date
from typing import Optional

import httpx
import polars as pl
import duckdb

CSV_URL = "https://data.richmondgov.com/api/views/xqn7-jvv2/rows.csv?accessType=DOWNLOAD"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "city_contracts.csv")
DB_PATH = os.path.join(DATA_DIR, "contracts.duckdb")

DATE_FORMAT = "%m/%d/%Y %I:%M:%S %p"


def download_csv() -> None:
    """Download the contracts CSV from the Richmond open data portal."""
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Downloading contracts CSV from:\n  {CSV_URL}")
    with httpx.Client(follow_redirects=True, timeout=60.0) as client:
        response = client.get(CSV_URL)
        response.raise_for_status()
    with open(CSV_PATH, "wb") as f:
        f.write(response.content)
    size_kb = os.path.getsize(CSV_PATH) / 1024
    print(f"Saved to {CSV_PATH} ({size_kb:.1f} KB)")


def compute_risk_level(days: Optional[int]) -> str:
    """Map days-to-expiry to a risk level string."""
    if days is None:
        return "unknown"
    if days < 0:
        return "expired"
    if days <= 30:
        return "critical"
    if days <= 60:
        return "warning"
    if days <= 90:
        return "attention"
    return "ok"


def load_and_transform() -> pl.DataFrame:
    """Read the CSV, rename/cast columns, and compute derived fields."""
    print("Reading CSV with Polars...")
    raw = pl.read_csv(CSV_PATH, infer_schema_length=10000, null_values=["", "N/A", "null"])

    print(f"Raw columns: {raw.columns}")

    # Select and rename columns
    df = raw.select([
        pl.col("Agency/Department").alias("department"),
        pl.col("Contract Number").alias("contract_number"),
        pl.col("Contract Value").cast(pl.Float64, strict=False).alias("value"),
        pl.col("Supplier").alias("supplier"),
        pl.col("Procurement Type").alias("procurement_type"),
        pl.col("Description").alias("description"),
        pl.col("Type of Solicitation").alias("solicitation_type"),
        pl.col("Effective From").alias("start_date_raw"),
        pl.col("Effective To").alias("end_date_raw"),
    ])

    # Parse dates
    df = df.with_columns([
        pl.col("start_date_raw").str.strptime(pl.Date, format=DATE_FORMAT, strict=False).alias("start_date"),
        pl.col("end_date_raw").str.strptime(pl.Date, format=DATE_FORMAT, strict=False).alias("end_date"),
    ]).drop(["start_date_raw", "end_date_raw"])

    today = date.today()

    # Compute days_to_expiry and risk_level
    df = df.with_columns([
        (pl.col("end_date") - pl.lit(today)).dt.total_days().alias("days_to_expiry"),
    ])

    # Apply risk_level using a map function
    df = df.with_columns([
        pl.col("days_to_expiry").map_elements(compute_risk_level, return_dtype=pl.Utf8).alias("risk_level"),
    ])

    return df


def load_into_duckdb(df: pl.DataFrame) -> None:
    """Write the transformed DataFrame into DuckDB, replacing any existing table."""
    print(f"Loading {len(df)} records into DuckDB at {DB_PATH}...")

    # Write to a staging parquet (no pyarrow required — polars uses its own engine)
    staging_path = os.path.join(DATA_DIR, "contracts_staging.parquet")
    df.write_parquet(staging_path)

    conn = duckdb.connect(DB_PATH)
    try:
        conn.execute("DROP TABLE IF EXISTS city_contracts")
        conn.execute(f"""
            CREATE TABLE city_contracts AS
            SELECT
                department,
                contract_number,
                value,
                supplier,
                procurement_type,
                description,
                solicitation_type,
                start_date,
                end_date,
                days_to_expiry,
                risk_level
            FROM read_parquet('{staging_path}')
        """)
        count = conn.execute("SELECT COUNT(*) FROM city_contracts").fetchone()[0]
        print(f"Table city_contracts created with {count} records.")

        # Create decisions table for persisting AI verdicts
        conn.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY,
                contract_number VARCHAR,
                supplier VARCHAR,
                department VARCHAR,
                contract_value DOUBLE,
                verdict VARCHAR,
                confidence VARCHAR,
                summary VARCHAR,
                pros VARCHAR,
                cons VARCHAR,
                memo VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Create auto-incrementing sequence
        conn.execute("CREATE SEQUENCE IF NOT EXISTS decisions_seq START 1")
        print("Table decisions ready.")
    finally:
        conn.close()

    # Clean up staging file
    os.remove(staging_path)


def print_summary(df: pl.DataFrame) -> None:
    """Print an ingestion summary."""
    total = len(df)
    today = date.today()

    exp_30 = df.filter(
        (pl.col("days_to_expiry") >= 0) & (pl.col("days_to_expiry") <= 30)
    ).height
    exp_60 = df.filter(
        (pl.col("days_to_expiry") >= 0) & (pl.col("days_to_expiry") <= 60)
    ).height
    exp_90 = df.filter(
        (pl.col("days_to_expiry") >= 0) & (pl.col("days_to_expiry") <= 90)
    ).height

    print("\n=== Ingestion Summary ===")
    print(f"Date:                 {today}")
    print(f"Total records:        {total}")
    print(f"Expiring in 30 days:  {exp_30}")
    print(f"Expiring in 60 days:  {exp_60}")
    print(f"Expiring in 90 days:  {exp_90}")
    print("========================\n")


def main() -> None:
    download_csv()
    df = load_and_transform()
    load_into_duckdb(df)
    print_summary(df)
    print("Ingestion complete.")


if __name__ == "__main__":
    main()
