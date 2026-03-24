import os
from typing import Optional

import pandas as pd
from sqlalchemy import create_engine, text

_df: Optional[pd.DataFrame] = None

NUMERIC_COLS = {
    "latitude",
    "longitude",
    "voltage",
    "exposure_score",
    "max_wind_speed",
    "max_snow_depth",
    "min_temp",
    "avg_temp",
    "max_storm_damage_usd",
    "total_storm_damage",
    "storm_event_count",
    "storm_deaths",
    "storm_injuries",
    "doe_event_count",
    "doe_max_customers",
    "doe_max_mw_loss",
}


def _normalize_dataframe(raw: pd.DataFrame) -> pd.DataFrame:
    """Match legacy CSV normalization: numeric coercion + display strings."""
    df = raw.copy()
    for col in df.columns:
        if col in NUMERIC_COLS or pd.api.types.is_numeric_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        else:
            s = df[col].fillna("—").astype(str)
            df[col] = s.replace({"nan": "—", "NaT": "—", "None": "—", "": "—"})
    return df


def _load_from_csv(path: str) -> pd.DataFrame:
    raw = pd.read_csv(path)
    rename_map = {
        "@id": "id",
        "VOLTAGE": "voltage",
        "VOLT_CLASS": "volt_class",
        "OWNER": "owner",
        "STATUS": "status",
    }
    raw = raw.rename(columns=rename_map)
    return _normalize_dataframe(raw)


def _load_from_supabase(url: str) -> pd.DataFrame:
    """Load towers table created from Colab upload (column tower_id -> id for API)."""
    engine = create_engine(url, pool_pre_ping=True)
    try:
        raw = pd.read_sql(text("SELECT * FROM towers"), con=engine)
    finally:
        engine.dispose()

    if raw.empty:
        raise RuntimeError("towers table is empty")

    if "tower_id" in raw.columns:
        raw = raw.rename(columns={"tower_id": "id"})
    elif "id" not in raw.columns:
        raise RuntimeError("towers table must have tower_id or id column")

    return _normalize_dataframe(raw)


def load_data() -> None:
    """
    Prefer Supabase/Postgres when DATABASE_URL is set (deploy).
    Otherwise load local CSV via DATA_PATH (development).
    """
    global _df
    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url:
        _df = _load_from_supabase(db_url)
        print(f"Loaded {len(_df)} tower rows from Supabase (towers)")
        return

    path = os.getenv("DATA_PATH", "data/master_final_scored.csv")
    _df = _load_from_csv(path)
    print(f"Loaded {len(_df)} tower rows from CSV: {path}")


def get_df() -> pd.DataFrame:
    if _df is None:
        raise RuntimeError("Dataframe not loaded; call load_data() first")
    return _df
