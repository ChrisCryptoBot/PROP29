"""
Add `source` column to access_control_audit_logs for hardware attribution.

Usage:
  python backend/scripts/add_access_control_audit_source.py
"""
import os
import sys
from pathlib import Path

current_dir = Path(__file__).parent.absolute()
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import inspect, text
from database import engine


def main() -> None:
    with engine.connect() as conn:
        inspector = inspect(conn)
        table = "access_control_audit_logs"
        try:
            columns = [c["name"] for c in inspector.get_columns(table)]
        except Exception:
            print(f"Table {table} not found; run init_db first.")
            return
        if "source" in columns:
            print(f"Column source already exists on {table}.")
            return
        conn.execute(text("ALTER TABLE access_control_audit_logs ADD COLUMN source VARCHAR(50)"))
        conn.commit()
    print("Added source column to access_control_audit_logs.")


if __name__ == "__main__":
    main()
