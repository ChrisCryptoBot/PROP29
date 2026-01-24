"""
Push Notification Service (Mock Provider)
Provides a bridge for FCM/APNS integration.
"""
from typing import List, Optional, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)


class MockPushProvider:
    def send(self, payload: Dict[str, Any], tokens: List[str]) -> Dict[str, Any]:
        logger.info("Mock push provider invoked", extra={"tokens": tokens, "payload": payload})
        return {
            "success": True,
            "provider": "mock",
            "delivered": len(tokens),
        }


class PushNotificationService:
    def __init__(self) -> None:
        self.provider = MockPushProvider()

    def _get_test_tokens(self) -> List[str]:
        raw = os.getenv("PUSH_NOTIFICATION_TEST_TOKENS", "")
        return [token.strip() for token in raw.split(",") if token.strip()]

    def send_notification(self, title: str, body: str, data: Optional[Dict[str, Any]] = None, tokens: Optional[List[str]] = None) -> Dict[str, Any]:
        resolved_tokens = tokens or self._get_test_tokens()
        if not resolved_tokens:
            logger.warning("No push notification tokens configured")
            return {
                "success": False,
                "provider": "mock",
                "delivered": 0,
                "message": "No device tokens configured",
            }

        payload = {
            "title": title,
            "body": body,
            "data": data or {},
        }
        return self.provider.send(payload, resolved_tokens)

    def send_environmental_alert(self, alert_id: str, severity: str, message: str, camera_id: Optional[str] = None) -> Dict[str, Any]:
        title = "Critical Environmental Alert" if severity == "critical" else "Environmental Alert"
        data = {
            "alert_id": alert_id,
            "severity": severity,
            "camera_id": camera_id,
        }
        return self.send_notification(title=title, body=message, data=data)
