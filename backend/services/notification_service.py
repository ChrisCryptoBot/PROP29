
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session
from models import Notification, User
from schemas import NotificationCreate
import logging
import os
import uuid
import json

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Unified notification service for email, SMS, and push notifications.
    Features:
    - Persistence (history)
    - Preference enforcement (user settings)
    - Multi-channel support (Mock Email, Twilio SMS, Push)
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._twilio_client = None
        self._init_providers()
        
    def _init_providers(self):
        """Initialize notification providers based on environment variables."""
        # Twilio setup
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        if account_sid and auth_token:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(account_sid, auth_token)
                logger.info("Twilio SMS provider initialized")
            except ImportError:
                logger.warning("Twilio package not available")
        else:
            logger.info("Twilio credentials not configured - using mock SMS provider")

    def send_notification(self, notification_data: NotificationCreate) -> Notification:
        """
        Send a notification via the specified channel, respecting user preferences.
        Persists the notification record.
        """
        # 1. Fetch user to check preferences and contact info
        user = self.db.query(User).filter(User.user_id == notification_data.user_id).first()
        if not user:
            raise ValueError(f"User {notification_data.user_id} not found")

        # 2. Check preferences
        # Default to True if preferences are missing or specific channel is not set
        preferences = user.preferences or {}
        channel_enabled = preferences.get("notifications", {}).get(notification_data.channel, True)
        
        # Override for high priority/critical?
        if notification_data.priority in ["high", "critical"]:
            channel_enabled = True # Force enable for critical alerts

        notification = Notification(
            notification_id=str(uuid.uuid4()),
            property_id=notification_data.property_id,
            user_id=notification_data.user_id,
            channel=notification_data.channel,
            priority=notification_data.priority,
            title=notification_data.title,
            content=notification_data.content,
            data=notification_data.data,
            status="pending"
        )
        self.db.add(notification)
        self.db.commit() # Commit initial pending state

        if not channel_enabled:
            notification.status = "skipped"
            notification.error_message = "User disabled this notification channel"
            self.db.commit()
            return notification

        # 3. Dispatch to provider
        try:
            result = {}
            if notification_data.channel == "email":
                result = self._send_email(user.email, notification_data.title, notification_data.content)
            elif notification_data.channel == "sms":
                if not user.phone:
                    raise ValueError("User has no phone number")
                result = self._send_sms(user.phone, notification_data.content)
            elif notification_data.channel == "push":
                # Assuming push tokens are stored in UserActivity or similar, or passed in data
                # For now, simplistic broadcast or relying on internal service to find tokens
                result = self._send_push(user.user_id, notification_data.title, notification_data.content, notification_data.data)
            else:
                raise ValueError(f"Unsupported channel: {notification_data.channel}")

            if result.get("sent"):
                notification.status = "sent"
            else:
                notification.status = "failed"
                notification.error_message = result.get("error", "Unknown provider error")

        except Exception as e:
            logger.error(f"Notification delivery failed: {e}", exc_info=True)
            notification.status = "failed"
            notification.error_message = str(e)
        
        self.db.commit()
        return notification

    def _send_email(self, recipient: str, subject: str, content: str) -> Dict[str, Any]:
        """SendGrid Email Provider (with fallback to mock)"""
        sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        
        if sendgrid_api_key:
            try:
                import sendgrid
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
                from_email = Email(os.getenv("SENDGRID_FROM_EMAIL", "noreply@proper29.com"))
                to_email = To(recipient)
                mail_content = Content("text/html", content)
                mail = Mail(from_email, to_email, subject, mail_content)
                
                response = sg.client.mail.send.post(request_body=mail.get())
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"[SENDGRID] Email sent to {recipient} - Status: {response.status_code}")
                    return {"sent": True, "provider": "sendgrid", "status_code": response.status_code}
                else:
                    logger.error(f"[SENDGRID] Failed to send email - Status: {response.status_code}")
                    return {"sent": False, "provider": "sendgrid", "error": f"Status {response.status_code}"}
                    
            except ImportError:
                logger.warning("SendGrid package not installed - falling back to mock email")
            except Exception as e:
                logger.error(f"SendGrid error: {e}", exc_info=True)
                return {"sent": False, "provider": "sendgrid", "error": str(e)}
        
        # Fallback to mock if no API key or error
        logger.info(f"[MOCK EMAIL] To: {recipient} | Subject: {subject} | Body: {content}")
        return {"sent": True, "provider": "mock-email"}

    def _send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Twilio SMS Provider"""
        if self._twilio_client:
            try:
                from_number = os.getenv("TWILIO_PHONE_NUMBER")
                if not from_number:
                    raise ValueError("TWILIO_PHONE_NUMBER not configured")
                
                sms = self._twilio_client.messages.create(
                    body=message,
                    from_=from_number,
                    to=phone_number
                )
                return {"sent": True, "provider": "twilio", "sid": sms.sid}
            except Exception as e:
                return {"sent": False, "provider": "twilio", "error": str(e)}
        else:
            logger.info(f"[SMS] To: {phone_number} | Body: {message}")
            return {"sent": True, "provider": "mock-sms"}

    def _send_push(self, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Push Notification Provider (Delegates to PushNotificationService)"""
        from services.push_notification_service import PushNotificationService
        push_service = PushNotificationService()
        # Note: PushNotificationService handles token resolution for now (mocked)
        result = push_service.send_notification(title=title, body=body, data=data)
        return {"sent": result.get("success", False), "provider": "fcm-mock", "details": result}

    def get_user_notifications(self, user_id: str, limit: int = 50, skip: int = 0) -> List[Notification]:
        return self.db.query(Notification)\
            .filter(Notification.user_id == user_id)\
            .order_by(desc(Notification.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()

    def mark_as_read(self, notification_id: str) -> bool:
        notification = self.db.query(Notification).filter(Notification.notification_id == notification_id).first()
        if notification:
            notification.read_at = datetime.utcnow() # Note: use func.now() or datetime based on architecture
            # datetime.utcnow() is simpler for immediate update in object
            from datetime import datetime
            notification.read_at = datetime.utcnow()
            notification.status = "read"
            self.db.commit()
            return True
        return False
