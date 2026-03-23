import os
from typing import Optional

import pandas as pd

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


def load_csv() -> None:
    global _df
    path = os.getenv("DATA_PATH", "data/master_final_scored.csv")
    raw = pd.read_csv(path)

    rename_map = {
        "@id": "id",
        "VOLTAGE": "voltage",
        "VOLT_CLASS": "volt_class",
        "OWNER": "owner",
        "STATUS": "status",
    }
    raw = raw.rename(columns=rename_map)

    for col in raw.columns:
        if col in NUMERIC_COLS or pd.api.types.is_numeric_dtype(raw[col]):
            raw[col] = pd.to_numeric(raw[col], errors="coerce").fillna(0)
        else:
            s = raw[col].fillna("—").astype(str)
            raw[col] = s.replace({"nan": "—", "NaT": "—", "None": "—"})

    _df = raw
    print(f"Loaded {len(_df)} tower rows from {path}")


def get_df() -> pd.DataFrame:
    if _df is None:
        raise RuntimeError("Dataframe not loaded; call load_csv() first")
    return _df
