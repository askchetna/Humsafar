"""Lightweight SQLite column migration for dev environments."""

from sqlalchemy import inspect, text
from app.database.session import engine


RIDE_COLUMNS = {
    "ride_type": "VARCHAR DEFAULT 'standard'",
    "package_description": "VARCHAR",
    "created_at": "DATETIME",
    "updated_at": "DATETIME"
}


def run_sqlite_migrations():
    if not str(engine.url).startswith("sqlite"):
        return

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if "rides" not in existing_tables:
        return

    existing_cols = {c["name"] for c in inspector.get_columns("rides")}

    with engine.begin() as conn:
        for col, col_type in RIDE_COLUMNS.items():
            if col not in existing_cols:
                conn.execute(text(f"ALTER TABLE rides ADD COLUMN {col} {col_type}"))
