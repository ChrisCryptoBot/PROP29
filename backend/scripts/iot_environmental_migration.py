"""
Standalone migration for IoT Environmental Monitoring.

Adds new columns to iot_environmental_data and creates
iot_environmental_alerts + iot_environmental_settings tables.

Usage:
  python backend/scripts/iot_environmental_migration.py
"""
import os
import sys
from pathlib import Path

# Add the backend directory to sys.path
current_dir = Path(__file__).parent.absolute()
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import inspect, text
from database import engine
from models import Base, IoTEnvironmentalData, IoTEnvironmentalAlert, IoTEnvironmentalSettings


def add_column(connection, table_name: str, column_name: str, column_type: str) -> None:
    inspector = inspect(connection)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    if column_name in columns:
        return
    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


def add_enum_value(connection, enum_name: str, value: str) -> None:
    sql = f"""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}') THEN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = '{enum_name}' AND e.enumlabel = '{value}'
            ) THEN
                EXECUTE 'ALTER TYPE {enum_name} ADD VALUE ''{value}''';
            END IF;
        END IF;
    END $$;
    """
    connection.execute(text(sql))


def main() -> None:
    dialect = engine.dialect.name
    with engine.begin() as connection:
        # Create new tables if missing
        Base.metadata.create_all(bind=connection, tables=[
            IoTEnvironmentalData.__table__,
            IoTEnvironmentalAlert.__table__,
            IoTEnvironmentalSettings.__table__,
        ])

        # Add new columns to iot_environmental_data
        if dialect == "postgresql":
            add_column(connection, "iot_environmental_data", "value", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_data", "unit", "VARCHAR(50)")
            add_column(connection, "iot_environmental_data", "threshold_min", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_data", "threshold_max", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_data", "camera_id", "VARCHAR(36)")
            add_column(connection, "iot_environmental_alerts", "camera_id", "VARCHAR(36)")
            add_column(connection, "iot_environmental_data", "light_level", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_data", "noise_level", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_alerts", "light_level", "DOUBLE PRECISION")
            add_column(connection, "iot_environmental_alerts", "noise_level", "DOUBLE PRECISION")

            # Ensure enum supports light/noise
            for enum_name in ["sensortype", "sensor_type"]:
                add_enum_value(connection, enum_name, "light")
                add_enum_value(connection, enum_name, "noise")
        elif dialect == "sqlite":
            add_column(connection, "iot_environmental_data", "value", "REAL")
            add_column(connection, "iot_environmental_data", "unit", "TEXT")
            add_column(connection, "iot_environmental_data", "threshold_min", "REAL")
            add_column(connection, "iot_environmental_data", "threshold_max", "REAL")
            add_column(connection, "iot_environmental_data", "camera_id", "TEXT")
            add_column(connection, "iot_environmental_alerts", "camera_id", "TEXT")
            add_column(connection, "iot_environmental_data", "light_level", "REAL")
            add_column(connection, "iot_environmental_data", "noise_level", "REAL")
            add_column(connection, "iot_environmental_alerts", "light_level", "REAL")
            add_column(connection, "iot_environmental_alerts", "noise_level", "REAL")
        else:
            add_column(connection, "iot_environmental_data", "value", "FLOAT")
            add_column(connection, "iot_environmental_data", "unit", "VARCHAR(50)")
            add_column(connection, "iot_environmental_data", "threshold_min", "FLOAT")
            add_column(connection, "iot_environmental_data", "threshold_max", "FLOAT")
            add_column(connection, "iot_environmental_data", "camera_id", "VARCHAR(36)")
            add_column(connection, "iot_environmental_alerts", "camera_id", "VARCHAR(36)")
            add_column(connection, "iot_environmental_data", "light_level", "FLOAT")
            add_column(connection, "iot_environmental_data", "noise_level", "FLOAT")
            add_column(connection, "iot_environmental_alerts", "light_level", "FLOAT")
            add_column(connection, "iot_environmental_alerts", "noise_level", "FLOAT")


if __name__ == "__main__":
    main()
