"""
Hardware Control Service
Provides write-back commands to physical devices via bridge.
Uses circuit breaker to avoid cascading failures when bridge is unavailable.
"""
from typing import Optional, Dict, Any
import logging
import os

import requests
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from database import SessionLocal
from models import SmartLocker, Property, UserRole
from utils.circuit_breaker import get_hardware_bridge_circuit_breaker

logger = logging.getLogger(__name__)


class HardwareControlService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()

    def close(self) -> None:
        if self.db:
            self.db.close()

    @staticmethod
    def _get_default_property_id(db: Session, user_id: Optional[str]) -> Optional[str]:
        if user_id:
            role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).first()
            if role:
                return role.property_id

        prop = db.query(Property).filter(Property.is_active == True).first()
        if prop:
            return prop.property_id
        return None

    def _send_release_command(self, locker: SmartLocker, payload: Dict[str, Any]) -> Dict[str, Any]:
        bridge_url = os.getenv("HARDWARE_BRIDGE_URL")
        if not bridge_url:
            logger.info("Hardware bridge not configured. Returning not_configured.")
            return {
                "released": False,
                "bridge_status": "not_configured",
                "message": "No hardware bridge configured.",
            }

        endpoint = f"{bridge_url.rstrip('/')}/lockers/{locker.locker_id}/release"

        def _do_request() -> Dict[str, Any]:
            response = requests.post(endpoint, json=payload, timeout=10)
            response.raise_for_status()
            data = response.json() if response.content else {}
            return {
                "released": data.get("released", True),
                "bridge_status": "ok",
                "message": data.get("message", "Solenoid release command sent."),
            }

        try:
            breaker = get_hardware_bridge_circuit_breaker()
            return breaker.call(_do_request)
        except RuntimeError as e:
            if "OPEN" in str(e):
                logger.warning("Hardware bridge circuit open; rejecting release command")
                return {
                    "released": False,
                    "bridge_status": "circuit_open",
                    "message": "Hardware bridge temporarily unavailable; try again later.",
                }
            raise
        except Exception as exc:
            logger.error("Failed to send locker release command", exc_info=exc)
            return {
                "released": False,
                "bridge_status": "error",
                "message": "Failed to reach hardware bridge.",
            }

    def release_smart_locker(self, locker_identifier: str, user_id: Optional[str], reason: Optional[str] = None) -> Dict[str, Any]:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        locker = self.db.query(SmartLocker).filter(
            SmartLocker.property_id == property_id,
            or_(
                SmartLocker.locker_id == locker_identifier,
                SmartLocker.locker_number == locker_identifier,
            )
        ).first()

        if not locker:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Locker not found")

        payload = {
            "locker_id": locker.locker_id,
            "locker_number": locker.locker_number,
            "property_id": locker.property_id,
            "requested_by": user_id,
            "reason": reason,
        }

        result = self._send_release_command(locker, payload)
        return {
            "locker_id": locker.locker_id,
            "locker_number": locker.locker_number,
            "released": result.get("released", False),
            "bridge_status": result.get("bridge_status"),
            "message": result.get("message"),
        }
