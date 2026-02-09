"""
Help & Support API — articles, tickets, contact.
Production-ready with full conversation history, error mapping, offline troubleshooting, and mobile API support.
Optional: real LLM (OpenAI or compatible) when OPENAI_API_KEY is set; otherwise rule-based + dissect bot.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from api.auth_dependencies import get_current_user_optional, get_current_user
from models import User
import logging
import os
import re
import uuid
import time
import random
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/help", tags=["Help & Support"])
logger = logging.getLogger(__name__)

# Rate limit for live chat: 30 requests per minute per user or IP
_CHAT_RATE_LIMIT: Dict[str, List[float]] = {}
_CHAT_RATE_LIMIT_MAX = 30
_CHAT_RATE_LIMIT_WINDOW = 60.0  # seconds


def _check_chat_rate_limit(key: str) -> bool:
    """Return True if request is allowed, False if rate limited."""
    now = time.time()
    if key not in _CHAT_RATE_LIMIT:
        _CHAT_RATE_LIMIT[key] = []
    times = _CHAT_RATE_LIMIT[key]
    times.append(now)
    # Drop timestamps outside the window
    cutoff = now - _CHAT_RATE_LIMIT_WINDOW
    _CHAT_RATE_LIMIT[key] = [t for t in times if t > cutoff]
    
    # Periodic cleanup: remove empty keys (every 100 requests, ~1% chance)
    if random.random() < 0.01:
        empty_keys = [k for k, v in _CHAT_RATE_LIMIT.items() if not v]
        for k in empty_keys:
            del _CHAT_RATE_LIMIT[k]
    
    return len(_CHAT_RATE_LIMIT[key]) <= _CHAT_RATE_LIMIT_MAX

# Optional LLM: set OPENAI_API_KEY (or HELP_CHAT_LLM_API_KEY) to use a real AI model for chat
_HELP_CHAT_LLM_API_KEY = os.environ.get("HELP_CHAT_LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")
_HELP_CHAT_LLM_MODEL = os.environ.get("HELP_CHAT_LLM_MODEL", "gpt-4o-mini")  # cheap, fast
_HELP_CHAT_LLM_BASE_URL = os.environ.get("HELP_CHAT_LLM_BASE_URL")  # optional: e.g. Azure or local OpenAI-compatible

# --- In-memory store (replace with DB when needed) ---
_articles: List[dict] = []
_tickets: List[dict] = []
_contacts: List[dict] = []

# --- Conversation Session Management (P0) ---
_conversation_sessions: Dict[str, List[Dict]] = {}
_session_timeout = timedelta(hours=1)
_max_sessions = 1000  # Hard cap on number of active sessions
_conversation_logs: List[Dict] = []  # For analytics (in-memory only; requires DB integration for production persistence)
# NOTE: Conversation logs are capped at 1000 entries and lost on server restart.
# For production: integrate with database (PostgreSQL/MongoDB) or file-based persistence.
# Consider periodic export to analytics service (e.g. every hour) for historical tracking.


def _get_or_create_session(session_id: str) -> List[Dict]:
    """Get conversation history for session, cleaning old entries."""
    if session_id not in _conversation_sessions:
        _conversation_sessions[session_id] = []
    return _conversation_sessions[session_id]


def _add_to_session(session_id: str, role: str, content: str):
    """Add message to session history."""
    session = _get_or_create_session(session_id)
    session.append({
        "role": role,
        "content": content[:1500],  # Limit per message
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    # Keep last 10 exchanges (20 messages: 10 user + 10 assistant)
    if len(session) > 20:
        session[:] = session[-20:]


def _get_session_summary(session_id: str, max_turns: int = 5) -> List[Dict]:
    """Get last N turns for LLM context."""
    session = _get_or_create_session(session_id)
    # Return last max_turns exchanges (each exchange = user + assistant)
    if len(session) <= max_turns * 2:
        return session
    return session[-(max_turns * 2):]


def _cleanup_old_sessions():
    """Remove sessions older than timeout (run periodically)."""
    now = datetime.now(timezone.utc)
    to_remove = []
    for session_id, messages in _conversation_sessions.items():
        if messages and now - datetime.fromisoformat(messages[-1]["timestamp"]) > _session_timeout:
            to_remove.append(session_id)
    for sid in to_remove:
        del _conversation_sessions[sid]
        _session_greeting_sent.pop(sid, None)
    
    # Enforce max session cap: remove oldest sessions if over limit
    if len(_conversation_sessions) > _max_sessions:
        # Sort by last message timestamp, remove oldest
        sessions_with_times = [
            (sid, datetime.fromisoformat(msgs[-1]["timestamp"]) if msgs else datetime.min.replace(tzinfo=timezone.utc))
            for sid, msgs in _conversation_sessions.items()
        ]
        sessions_with_times.sort(key=lambda x: x[1])
        excess = len(_conversation_sessions) - _max_sessions
        for sid, _ in sessions_with_times[:excess]:
            del _conversation_sessions[sid]
            _session_greeting_sent.pop(sid, None)


def _log_conversation(
    user_message: str,
    bot_reply: str,
    was_handled: bool,
    escalated: bool,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Log conversation for analytics."""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_message": user_message[:500],
        "bot_reply": bot_reply[:500] if bot_reply else None,
        "was_handled": was_handled,
        "escalated": escalated,
        "user_id": user_id,
        "session_id": session_id
    }
    _conversation_logs.append(log_entry)
    # Keep last 1000 logs
    if len(_conversation_logs) > 1000:
        _conversation_logs[:] = _conversation_logs[-1000:]


def _ensure_seed_data():
    global _articles, _tickets, _contacts
    if _articles:
        return
    _articles = [
        {
            "id": "1",
            "title": "Getting Started with Proper 2.9",
            "content": "Welcome to Proper 2.9 Security Management System. This guide will help you get started with the platform: navigate the dashboard, understand roles, and access key modules.",
            "category": "getting_started",
            "tags": ["onboarding", "basics", "navigation"],
            "lastUpdated": "2024-01-10",
            "views": 1250,
            "helpful": 89,
            "role": ["all"],
        },
        {
            "id": "2",
            "title": "How to Report an Incident",
            "content": "Learn how to properly report security incidents using the incident management system. Go to Incident Log, click New Incident, fill in location, severity, and description.",
            "category": "incident_management",
            "tags": ["incidents", "reporting", "security"],
            "lastUpdated": "2024-01-12",
            "views": 890,
            "helpful": 67,
            "role": ["patrol_agent", "manager", "director"],
        },
        {
            "id": "3",
            "title": "Managing Team Members",
            "content": "Administrators can add, remove, and manage team member permissions from Account Settings or System Administration.",
            "category": "user_management",
            "tags": ["users", "permissions", "administration"],
            "lastUpdated": "2024-01-08",
            "views": 650,
            "helpful": 45,
            "role": ["manager", "director"],
        },
        {
            "id": "4",
            "title": "Mobile App Setup Guide",
            "content": "Set up the Proper 2.9 mobile app for patrol agents and field staff. Download from the Resources tab, sign in with your console credentials.",
            "category": "mobile_app",
            "tags": ["mobile", "setup", "patrol"],
            "lastUpdated": "2024-01-14",
            "views": 420,
            "helpful": 32,
            "role": ["patrol_agent", "valet", "front_desk"],
        },
        {
            "id": "5",
            "title": "Troubleshooting Camera Issues",
            "content": "Common camera system issues and how to resolve them: verify network and power, check Security Operations Center for device status.",
            "category": "troubleshooting",
            "tags": ["cameras", "technical", "hardware"],
            "lastUpdated": "2024-01-11",
            "views": 780,
            "helpful": 56,
            "role": ["manager", "director"],
        },
    ]
    _tickets = [
        {
            "id": "TICKET-001",
            "title": "Camera System Offline",
            "description": "Main entrance camera has been offline for 2 hours",
            "status": "in_progress",
            "priority": "high",
            "category": "technical",
            "createdAt": "2024-01-15T08:30:00Z",
            "updatedAt": "2024-01-15T10:15:00Z",
            "assignedTo": "Technical Support Team",
        },
        {
            "id": "TICKET-002",
            "title": "Feature Request: Bulk User Import",
            "description": "Need ability to import multiple users from CSV file",
            "status": "open",
            "priority": "medium",
            "category": "feature_request",
            "createdAt": "2024-01-14T14:20:00Z",
            "updatedAt": "2024-01-14T14:20:00Z",
        },
        {
            "id": "TICKET-003",
            "title": "Mobile App Login Issue",
            "description": "Patrol agents unable to log in to mobile app",
            "status": "resolved",
            "priority": "urgent",
            "category": "bug_report",
            "createdAt": "2024-01-13T16:45:00Z",
            "updatedAt": "2024-01-14T09:30:00Z",
            "assignedTo": "Mobile Development Team",
        },
    ]
    _contacts = [
        {
            "name": "Sarah Chen",
            "role": "Technical Support Manager",
            "email": "sarah.chen@proper29.com",
            "phone": "+15551234567",
            "availability": "24/7 Emergency Support",
            "specialties": ["System Integration", "Hardware Issues", "Emergency Response"],
        },
        {
            "name": "Mike Rodriguez",
            "role": "Customer Success Manager",
            "email": "mike.rodriguez@proper29.com",
            "phone": "+15552345678",
            "availability": "Mon-Fri 9 AM - 6 PM EST",
            "specialties": ["Account Management", "Training", "Feature Requests"],
        },
        {
            "name": "Lisa Thompson",
            "role": "Mobile App Specialist",
            "email": "lisa.thompson@proper29.com",
            "phone": "+15553456789",
            "availability": "Mon-Fri 8 AM - 5 PM EST",
            "specialties": ["Mobile App Issues", "Patrol Management", "Field Operations"],
        },
    ]


# --- Error Message → Fix Mapping (P0) ---
ERROR_MESSAGE_MAP = {
    "network error": {
        "pattern": r"network error|connection.*failed|failed to fetch|fetch.*error",
        "cause": "Lost connection to backend server",
        "fix_steps": [
            "Check your internet connection",
            "Look for 'Offline' banner at top of screen",
            "If offline, wait for connection to restore (operations will queue)",
            "If online but still failing, refresh the page (F5 or Ctrl+R)",
            "Check if backend server is running (http://localhost:8000/health)"
        ],
        "escalate_if": "Still failing after refresh and connection restored"
    },
    "permission denied": {
        "pattern": r"permission.*denied|access.*denied|unauthorized|403|forbidden",
        "cause": "Your role doesn't have permission for this action",
        "fix_steps": [
            "This action requires administrator privileges",
            "If you're an admin, check System Administration → Users → Your account → Role",
            "If role is correct, try logging out and back in",
            "Some features require specific role permissions (check module Settings)"
        ],
        "escalate_if": "Role is correct but still denied"
    },
    "validation error": {
        "pattern": r"\bvalidation.*error\b|\binvalid.*field\b|\brequired.*field\b|\bmust be\b|\bat least\b|\bmaximum\b",
        "cause": "Form field doesn't meet requirements",
        "fix_steps": [
            "Check the red error text below each field",
            "Required fields are marked with *",
            "Common issues:",
            "  - Text too short (e.g. 'First name must be at least 2 characters')",
            "  - Invalid format (e.g. email must be valid@email.com)",
            "  - Number out of range (e.g. severity must be 1-5)",
            "Fix each field and try submitting again",
            "Say 'create a ticket' if you need help with a specific validation error"
        ],
        "escalate_if": "Field looks correct but validation still fails"
    },
    "please fix the errors": {
        "pattern": r"please fix.*error|fix.*error.*form|errors.*form",
        "cause": "One or more form fields have validation errors",
        "fix_steps": [
            "Scroll through the form and look for red error messages",
            "Each error will tell you what's wrong (e.g. 'Required field', 'Invalid format')",
            "Fix all errors before submitting",
            "If no errors are visible, try refreshing the page"
        ],
        "escalate_if": "No errors visible but form won't submit"
    },
    "pending operations": {
        "pattern": r"pending.*operation|queued.*operation|offline.*queue",
        "cause": "You're offline or connection was lost; operations are queued",
        "fix_steps": [
            "Check top of screen for 'Offline' banner",
            "Operations will sync automatically when connection restores",
            "You can continue working; changes are saved locally",
            "To check queue status: Look for yellow badge showing pending count",
            "If operations fail: Look for red badge, click 'Retry Failed Operations'"
        ],
        "escalate_if": "Operations stuck in queue after connection restored"
    },
    "failed operations": {
        "pattern": r"failed.*operation|operation.*failed|sync.*failed",
        "cause": "Queued operation couldn't sync to server",
        "fix_steps": [
            "Look for red badge showing failed operation count",
            "Click 'Retry Failed Operations' button",
            "If still failing, check the error message in the queue",
            "Common causes: Server error (500), validation error (422), or network timeout",
            "If retry doesn't work, recreate the operation manually"
        ],
        "escalate_if": "Operations consistently failing to sync"
    },
    "websocket.*disconnected": {
        "pattern": r"websocket.*disconnect|ws.*disconnect|realtime.*off",
        "cause": "Real-time updates connection lost",
        "fix_steps": [
            "Real-time features (live incidents, camera updates) require WebSocket",
            "Refresh the page (F5) to reconnect",
            "If dashboard isn't updating, refresh to get latest data",
            "Check browser console (F12) for WebSocket errors"
        ],
        "escalate_if": "WebSocket won't reconnect after refresh"
    },
    "camera.*offline": {
        "pattern": r"camera.*offline|stream.*offline|feed.*offline",
        "cause": "Camera lost connection or hardware issue",
        "fix_steps": [
            "Go to Security Operations Center (SOC)",
            "Find the camera in the grid",
            "Click refresh icon (circular arrow) on that camera",
            "Wait 10 seconds for stream to reconnect",
            "Check Device Health tab for camera status",
            "If still offline: Check camera power, network cable, NVR connection"
        ],
        "escalate_if": "Camera hardware appears fine but stream won't connect"
    },
    "cannot.*submit": {
        "pattern": r"cannot.*submit|submit.*disabled|button.*disabled",
        "cause": "Form validation preventing submission",
        "fix_steps": [
            "Check for red error messages below fields",
            "All required fields (marked with *) must be filled",
            "Check field formats (email, date, number ranges)",
            "If button is grayed out, hover to see tooltip explaining why"
        ],
        "escalate_if": "All fields valid but submit still disabled"
    }
}


def _match_error_message(user_message: str) -> Optional[Dict]:
    """Match user's message against error message patterns."""
    msg_lower = user_message.lower()
    for error_key, error_info in ERROR_MESSAGE_MAP.items():
        # Use word boundaries for better matching (patterns already include \b where needed)
        if re.search(error_info["pattern"], msg_lower, re.IGNORECASE):
            return error_info
    return None


# --- Navigation Disambiguation (P1) ---
NAVIGATION_DISAMBIGUATION = {
    "banned individuals": {
        "locations": [
            "Banned Individuals module (dedicated module)",
            "Visitor Security → Banned Individuals tab (visitor context)"
        ],
        "when_to_use": [
            "Use Banned Individuals module for: managing watchlist, viewing all detections, bulk operations",
            "Use Visitor Security → Banned Individuals tab for: checking if visitor is banned during check-in"
        ]
    },
    "emergency": {
        "locations": [
            "Incident Log → Emergency Alert button",
            "Access Control → Lockdown tab"
        ],
        "when_to_use": [
            "Use Emergency Alert for: logging emergency incidents, notifying teams",
            "Use Lockdown for: physically locking all doors, facility-wide security"
        ]
    },
    "user management": {
        "locations": [
            "System Administration → Users tab (full user management)",
            "Account Settings → Team tab (team-specific settings)"
        ],
        "when_to_use": [
            "Use System Administration for: creating users, assigning roles, permissions",
            "Use Account Settings for: team-specific configurations, integrations"
        ]
    },
    "profile": {
        "locations": [
            "Profile Settings module (full profile management)",
            "Sidebar dropdown → Profile (quick access)"
        ],
        "when_to_use": [
            "Both go to same place; sidebar is quick access, module has full features"
        ]
    }
}


def _handle_navigation_question(user_message: str) -> Optional[str]:
    """Handle 'where is X' questions with disambiguation."""
    m = user_message.lower()
    
    # Broader triggers: check if user is asking about navigation
    navigation_keywords = ["where", "how do i find", "location", "how do i", "where do i", "where can i", "navigate", "go to"]
    is_navigation_question = any(kw in m for kw in navigation_keywords)
    
    for feature, info in NAVIGATION_DISAMBIGUATION.items():
        if feature in m and is_navigation_question:
            reply = f"'{feature.title()}' exists in multiple places:\n\n"
            for i, loc in enumerate(info["locations"], 1):
                reply += f"{i}. {loc}\n"
            reply += "\nWhen to use each:\n"
            for use_case in info["when_to_use"]:
                reply += f"- {use_case}\n"
            return reply
    
    return None


# --- Settings Reference (P1) ---
SETTINGS_REFERENCE = {
    "incident log": {
        "path": "Incident Log → Settings tab",
        "controls": [
            "Auto-approval rules (approve incidents automatically based on criteria)",
            "Escalation configuration (when to escalate, to whom)",
            "Notification settings (who gets notified for incidents)",
            "Review queue settings (approval workflow)"
        ]
    },
    "iot": {
        "path": "IoT Environmental → Settings tab",
        "controls": [
            "Sensor thresholds (temperature, humidity, etc.)",
            "Alert rules (when to create alerts)",
            "Device provisioning defaults"
        ]
    },
    "access control": {
        "path": "Access Control → Configuration tab",
        "controls": [
            "Access timeouts (how long badges work)",
            "Biometric settings",
            "Emergency override configuration",
            "Lockdown settings (which doors participate)"
        ]
    },
    "soc": {
        "path": "Security Operations Center → Settings tab",
        "controls": [
            "Camera provisioning defaults",
            "Recording retention",
            "Stream quality settings"
        ]
    },
    "guest safety": {
        "path": "Guest Safety → Settings tab",
        "controls": [
            "Evacuation procedures",
            "Mass notification templates",
            "Response team assignments",
            "Alert thresholds"
        ]
    },
    "visitor security": {
        "path": "Visitor Security → Settings tab",
        "controls": [
            "Check-in/check-out defaults",
            "Visitor access duration",
            "Notification settings",
            "Integration with Access Control"
        ]
    },
    "digital handover": {
        "path": "Digital Handover → Settings tab",
        "controls": [
            "Handover templates",
            "Required checklist items",
            "Equipment tracking settings",
            "Shift type configurations"
        ]
    },
    "patrol": {
        "path": "Patrol Command Center → Settings tab",
        "controls": [
            "Route optimization settings",
            "Checkpoint requirements",
            "Sync intervals",
            "Mobile app configuration"
        ]
    },
    "property items": {
        "path": "Property Items → Settings tab",
        "controls": [
            "Lost & found retention policies",
            "Package handling rules",
            "Storage location settings"
        ]
    },
    "smart lockers": {
        "path": "Smart Lockers → Settings tab",
        "controls": [
            "Locker assignment rules",
            "Access duration",
            "Notification settings"
        ]
    },
    "smart parking": {
        "path": "Smart Parking → Settings tab",
        "controls": [
            "Space availability thresholds",
            "Guest/valet parking rules",
            "Sensor calibration"
        ]
    },
    "banned individuals": {
        "path": "Banned Individuals → Settings tab",
        "controls": [
            "Detection sensitivity",
            "Alert rules",
            "False positive handling",
            "Integration with cameras/kiosks"
        ]
    },
    "system admin": {
        "path": "System Administration → Settings tab",
        "controls": [
            "Security policies",
            "Password requirements",
            "Session timeout settings",
            "Audit log retention"
        ]
    }
}


# --- Schemas ---
class CreateTicketBody(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    priority: str = Field(default="medium")
    category: str = Field(default="technical")


class UpdateTicketBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None


class ChatMessageBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)  # Accept both base_url and baseUrl from client

    message: str = Field(..., min_length=1, max_length=2000)
    last_user_message: Optional[str] = None
    last_bot_reply: Optional[str] = None
    openai_api_key: Optional[str] = None
    session_id: Optional[str] = None  # NEW: for conversation history
    model: Optional[str] = None  # NEW: LLM model name (overrides HELP_CHAT_LLM_MODEL if provided)
    base_url: Optional[str] = Field(None, alias="baseUrl")  # Accept baseUrl (camelCase) or base_url from client
    greeting_already_shown: Optional[bool] = Field(None, alias="greetingAlreadyShown")  # UI already showed greeting after validation


class ValidateApiBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    openai_api_key: str = Field(..., min_length=1)
    model: Optional[str] = None
    base_url: Optional[str] = Field(None, alias="baseUrl")


# Track per-session whether we've sent the "Hi I'm your [LLM] Proper 2.9 AI agent" greeting (only after API is confirmed working)
_session_greeting_sent: Dict[str, bool] = {}


def _model_display_name(model_id: Optional[str]) -> str:
    """Return a short display name for the model for the greeting."""
    if not model_id:
        return "AI"
    m = (model_id or "").lower()
    # Current Anthropic model IDs (claude-sonnet-4-5, claude-opus-4-6, etc.)
    if "claude-sonnet-4-5" in m or "claude-sonnet-4.5" in m:
        return "Claude Sonnet 4.5"
    if "claude-sonnet-4-" in m:
        return "Claude Sonnet 4"
    if "claude-opus-4-6" in m:
        return "Claude Opus 4.6"
    if "claude-opus-4-5" in m:
        return "Claude Opus 4.5"
    if "claude-opus-4-" in m:
        return "Claude Opus 4"
    if "claude-haiku-4-5" in m:
        return "Claude Haiku 4.5"
    if "claude-haiku-4-" in m:
        return "Claude Haiku 4"
    # Legacy IDs
    if "claude-3-5-sonnet" in m or "claude-3.5-sonnet" in m:
        return "Claude 3.5 Sonnet"
    if "claude-3-opus" in m:
        return "Claude 3 Opus"
    if "claude-3-haiku" in m:
        return "Claude 3 Haiku"
    if "claude-3-7-sonnet" in m:
        return "Claude 3.7 Sonnet"
    if "claude" in m:
        return "Claude"
    if "gpt-4o" in m and "mini" not in m:
        return "GPT-4o"
    if "gpt-4o-mini" in m:
        return "GPT-4o Mini"
    if "gpt-4" in m:
        return "GPT-4"
    if "gpt-3.5" in m:
        return "GPT-3.5 Turbo"
    if "grok" in m:
        return "Grok"
    return model_id[:30] if model_id else "AI"


# --- Endpoints ---
@router.get("/")
async def help_root():
    """Health check for help module; confirms /api/help is mounted."""
    return {"status": "ok", "module": "help-support"}


@router.post("/validate-api")
async def validate_api(body: ValidateApiBody):
    """
    Validate that the provided API key and LLM config are received and fully functional.
    Performs a minimal LLM call. Returns valid=true only when the API accepts the key and returns a response.
    """
    key = (body.openai_api_key or "").strip()
    if not key:
        return {"valid": False, "error": "API key is required"}
    try:
        # Use the same LLM path as chat; raise_on_failure=True so we get the real error for the UI
        reply = await _chat_reply_llm(
            "Reply with exactly: OK",
            session_id=None,
            last_user_message=None,
            last_bot_reply=None,
            api_key=key,
            user=None,
            model=body.model,
            base_url=body.base_url,
            raise_on_failure=True,
        )
        if reply and reply.strip():
            model_id = body.model or _HELP_CHAT_LLM_MODEL or "unknown"
            display_name = _model_display_name(model_id)
            logger.info("Validate API: success for model=%s display=%s", model_id, display_name)
            return {
                "valid": True,
                "model": model_id,
                "model_display_name": display_name,
            }
        logger.warning("Validate API: LLM returned empty reply")
        return {"valid": False, "error": "API returned an empty response. Check model name and base URL."}
    except Exception as e:
        error_msg = str(e)
        logger.warning("Validate API failed: %s", error_msg)
        # Shorten common API error messages for the UI
        if "401" in error_msg or "unauthorized" in error_msg.lower() or "incorrect api key" in error_msg.lower():
            error_msg = "Invalid API key. Check your key and try again."
        elif "404" in error_msg or "not found" in error_msg.lower():
            error_msg = "Model or endpoint not found. Check model name and base URL."
        elif "429" in error_msg or "rate limit" in error_msg.lower():
            error_msg = "Rate limit exceeded. Try again in a minute."
        return {"valid": False, "error": error_msg}


@router.get("/articles")
async def list_articles():
    _ensure_seed_data()
    return _articles


@router.get("/articles/{article_id}")
async def get_article(article_id: str):
    _ensure_seed_data()
    for a in _articles:
        if a["id"] == article_id:
            return a
    raise HTTPException(status_code=404, detail="Article not found")


@router.get("/tickets")
async def list_tickets(user: Optional[User] = Depends(get_current_user_optional)):
    _ensure_seed_data()
    return _tickets


@router.post("/tickets")
async def create_ticket(body: CreateTicketBody, user: Optional[User] = Depends(get_current_user_optional)):
    _ensure_seed_data()
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    ticket_id = f"TICKET-{uuid.uuid4().hex[:6].upper()}"
    ticket = {
        "id": ticket_id,
        "title": body.title,
        "description": body.description,
        "status": "open",
        "priority": body.priority,
        "category": body.category,
        "createdAt": now,
        "updatedAt": now,
        "assignedTo": None,
    }
    if user is not None:
        ticket["user_id"] = getattr(user, "id", None) or getattr(user, "user_id", None)
        ticket["email"] = getattr(user, "email", None)
    _tickets.append(ticket)
    logger.info("Help support ticket created: %s", ticket_id)
    return ticket


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    _ensure_seed_data()
    for t in _tickets:
        if t["id"] == ticket_id:
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, body: UpdateTicketBody):
    _ensure_seed_data()
    for t in _tickets:
        if t["id"] == ticket_id:
            t["updatedAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            if body.title is not None:
                t["title"] = body.title
            if body.description is not None:
                t["description"] = body.description
            if body.status is not None:
                t["status"] = body.status
            if body.priority is not None:
                t["priority"] = body.priority
            if body.category is not None:
                t["category"] = body.category
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.get("/contact")
async def get_contact():
    _ensure_seed_data()
    return _contacts


# --- Analytics Endpoint (P1) ---
@router.get("/chat/analytics")
async def get_chat_analytics(
    user: User = Depends(get_current_user),  # Admin only
):
    """Get conversation analytics for improvement."""
    if getattr(user, "role", None) not in ["admin", "security_manager", "manager"]:
        raise HTTPException(status_code=403, detail="Admin or manager access required")
    
    total = len(_conversation_logs)
    handled = sum(1 for log in _conversation_logs if log["was_handled"])
    escalated = sum(1 for log in _conversation_logs if log["escalated"])
    
    # Simple keyword extraction for top escalated topics
    escalated_messages = [log["user_message"] for log in _conversation_logs if log["escalated"]]
    topic_counts: Dict[str, int] = {}
    for msg in escalated_messages:
        for topic in ["camera", "door", "login", "patrol", "incident", "offline", "sync"]:
            if topic in msg.lower():
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_conversations": total,
        "handled_rate": handled / total if total > 0 else 0,
        "escalation_rate": escalated / total if total > 0 else 0,
        "top_escalated_topics": [{"topic": k, "count": v} for k, v in top_topics]
    }


# --- Mobile API Endpoints (Future-proof) ---
@router.get("/mobile/chat")
async def mobile_chat_get(
    user: User = Depends(get_current_user_optional),
    session_id: Optional[str] = None
):
    """Mobile app endpoint: get chat session info."""
    if session_id:
        history = _get_session_summary(session_id, max_turns=3)
        return {
            "session_id": session_id,
            "message_count": len(history),
            "last_message": history[-1] if history else None
        }
    return {"session_id": None, "message_count": 0}


@router.post("/mobile/chat")
async def mobile_chat_post(
    request: Request,
    body: ChatMessageBody,
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Mobile app endpoint: send chat message (mirrors POST /help/chat)."""
    # Reuse main chat endpoint logic
    return await chat(request, body, user)


@router.get("/chat/debug")
async def chat_debug(
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Debug endpoint: check LLM configuration (for troubleshooting)."""
    return {
        "has_env_api_key": bool(_HELP_CHAT_LLM_API_KEY),
        "env_model": _HELP_CHAT_LLM_MODEL,
        "env_base_url": _HELP_CHAT_LLM_BASE_URL or "not set (uses OpenAI default)",
        "openai_installed": _check_openai_installed(),
        "note": "This shows backend environment config. Frontend sends API key/model/base_url in request body."
    }


def _check_openai_installed() -> bool:
    """Check if OpenAI library is installed."""
    try:
        import openai
        return True
    except ImportError:
        return False


# Continue with existing helper functions and chat logic...
# (Keeping existing _has_negation_near, _dissect_problem, _reply_from_dissect, _chat_reply functions)
# Adding the new knowledge to _chat_reply function

def _has_negation_near(msg: str, topic_word: str) -> bool:
    """True if user is negating the topic."""
    m = msg.lower()
    neg = re.compile(r"\b(don't|dont|do not|not|no|never|isn't|arent|wasn't|weren't)\b", re.I)
    for match in re.finditer(re.escape(topic_word), m, re.I):
        start = max(0, match.start() - 30)
        end = min(len(m), match.end() + 30)
        if neg.search(m[start:end]):
            return True
    return False


def _dissect_problem(msg: str) -> dict:
    """Digest human conversation: infer topic, location/identifier, and what they already tried."""
    m = msg.lower().strip()
    out = {"topic": None, "detail": None, "already_tried": [], "is_problem": False}
    
    # Topic inference (order matters: more specific first)
    if any(x in m for x in ["camera", "cameras", "offline", "stream", "feed", "soc", "not showing", "black screen", "no picture"]):
        if not _has_negation_near(msg, "camera") and not _has_negation_near(msg, "offline"):
            out["topic"] = "camera"
            out["is_problem"] = any(x in m for x in ["offline", "down", "not working", "broken", "not showing", "black", "no feed", "since"])
    if any(x in m for x in ["door", "reader", "badge", "card", "won't open", "not opening", "locked out", "access denied"]):
        if not _has_negation_near(msg, "door"):
            out["topic"] = "door"
            out["is_problem"] = any(x in m for x in ["won't", "not working", "not opening", "denied", "broken"])
    if any(x in m for x in ["login", "log in", "password", "forgot", "locked out", "2fa", "can't get in", "authenticator"]):
        if not _has_negation_near(msg, "login") and not _has_negation_near(msg, "password"):
            out["topic"] = "login"
            out["is_problem"] = True
    if any(x in m for x in ["patrol", "app", "sync", "checkpoint", "officer", "mobile", "not syncing", "won't load"]):
        if not _has_negation_near(msg, "patrol") and not _has_negation_near(msg, "sync"):
            out["topic"] = "patrol"
            out["is_problem"] = any(x in m for x in ["not syncing", "won't", "stuck", "not loading", "crash"])
    if any(x in m for x in ["incident", "report", "event", "log an incident"]):
        if not _has_negation_near(msg, "incident"):
            out["topic"] = "incident"
            out["is_problem"] = any(x in m for x in ["can't", "don't know how", "where do i"])
    if any(x in m for x in ["guest safety", "evacuation", "mass notification"]):
        out["topic"] = "guest_safety"
    if any(x in m for x in ["visitor", "check-in", "check-out", "banned list"]):
        out["topic"] = "visitor"
    if any(x in m for x in ["sensor", "iot", "environmental", "temperature", "alert"]):
        out["topic"] = "iot"
    if any(x in m for x in ["handover", "shift change"]):
        out["topic"] = "handover"
    if any(x in m for x in ["lost and found", "lost & found", "package", "locker"]):
        out["topic"] = "lost_found"
    
    # Extract location/identifier
    for pattern, label in [
        (r"\b(camera\s*#?\s*\d+)\b", "camera_id"),
        (r"\b(door\s*#?\s*\d+)\b", "door_id"),
        (r"\b(lobby|main entrance|parking lot|floor\s*\d+|building\s*[a-z])\b", "location"),
        (r"\b(the\s+)?(\w+\s+)?(camera|door)\s+(in|at|by)\s+([\w\s]+?)(?:\s+is|\s+has|\.|,|$)", "location"),
    ]:
        match = re.search(pattern, m, re.I)
        if match:
            out["detail"] = match.group(0).strip()[:80]
            break
    if not out["detail"] and any(x in m for x in ["lobby", "entrance", "parking", "floor", "main"]):
        out["detail"] = next((w for w in ["lobby", "main entrance", "parking", "floor"] if w in m), None)
    
    # What they already tried
    if any(x in m for x in ["already tried", "i tried", "we tried", "tried that", "did that", "didn't work", "didn't help", "i restarted", "i refreshed", "we did that", "we restarted", "we refreshed"]):
        if any(x in m for x in ["refresh", "refreshed"]):
            out["already_tried"].append("refresh")
        if any(x in m for x in ["restart", "restarted", "reopen", "closed and opened"]):
            out["already_tried"].append("restart")
        if any(x in m for x in ["network", "wifi", "internet", "connection"]):
            out["already_tried"].append("network")
        if any(x in m for x in ["log out", "logout", "logged out", "sign out"]):
            out["already_tried"].append("logout")
        if any(x in m for x in ["device health", "settings", "health check"]):
            out["already_tried"].append("device_health")
    
    return out


def _reply_from_dissect(d: dict, user_message: str) -> Optional[str]:
    """Build a tailored reply from dissected problem."""
    if not d["topic"]:
        return None
    m = user_message.lower()
    topic = d["topic"]
    detail = d.get("detail") or ""
    tried = set(d.get("already_tried") or [])

    if topic == "camera":
        loc = f" ({detail})" if detail else ""
        if "refresh" in tried and "device_health" not in tried:
            return f"Since refresh didn't help{loc}, next step: in SOC open Settings (or device health) for that camera and check network status and any error. If it shows offline or error, try power/network at the device, or create a Support Ticket with the camera name/location and we'll have someone follow up."
        if "refresh" in tried and "device_health" in tried:
            return f"For that camera{loc}, the next step is a Support Ticket so our technical team can dig in. Help & Support → Support Tickets → New Ticket; title like 'Camera offline: [location]', category Technical. We'll respond within 2 business hours. For urgent coverage gaps, use Contact Support to call."
        return f"Got it—sounds like a camera issue{loc}. First step: open SOC (Security Operations Center), find that camera's tile, and try 'Refresh stream'. If it stays offline, go to Settings/device health for that camera and check network. Tell me what you see (e.g. 'still black' or 'it came back') and we'll do the next step—or I can create a ticket for you."

    if topic == "door":
        loc = f" ({detail})" if detail else ""
        return f"Understood—door/reader issue{loc}. (1) In Access Control → Access Points, check that door's status. (2) In Users, confirm your (or the user's) access includes that location. (3) If the reader is broken or the door is stuck, use physical keys for now and create a Support Ticket with the door/location. Want me to create a ticket for you, or are you checking Access Points now?"

    if topic == "login":
        return "To get you back in: use 'Forgot password' on the login page, or ask an administrator to reset your password or unlock your account in System Administration → Users. If 2FA is blocking you, an admin may need to help or you can use Profile Settings → Security after you're in. If you're the only admin and you're locked out, use Contact Support to call. Tell me which of these applies (forgot password / locked out / 2FA) and I can narrow the steps."

    if topic == "patrol":
        if "restart" in tried or "logout" in tried:
            return "Since restart/logout didn't fix the sync, have the officer check Wi‑Fi or mobile data and that they're on the correct property. If it's still not syncing, create a Support Ticket (Help & Support → Support Tickets) with 'Mobile app sync issue' and we'll have someone reach out."
        return "For patrol app not syncing: (1) Have the officer force-close the app and reopen. (2) Check Wi‑Fi or mobile data. (3) Log out and log back in. Tell me what happens after that (e.g. 'still not syncing') and I'll suggest the next step or create a ticket."

    if topic == "incident" and d.get("is_problem"):
        return "To report an incident: go to Incident Log in the sidebar → New Incident. Enter location, severity, and description; you can attach photos and assign to a response team. If you're not sure which team to assign, say what type of incident (e.g. guest injury, theft) and I'll point you to the right place. Need the full workflow or just the next click?"

    if topic == "guest_safety":
        return "Guest Safety handles incidents affecting guests, evacuation, and mass notification. Create the incident in Incident Log first, then assign it to a Guest Safety response team; that team uses the Guest Safety module to coordinate. What are you trying to do right now—create an incident, assign one, or run an evacuation/notification?"

    if topic == "visitor":
        return "Visitor Security is where you register visitors and do check-in/check-out; Banned Individuals is a separate module for the watchlist. Are you stuck on: registering a visitor, giving them access, or something with the banned list? Tell me which and I'll give the exact steps."

    if topic == "iot":
        return "For sensors/alerts: IoT Monitoring → Sensors tab to see status, Settings to set thresholds, Alerts tab to acknowledge. If a sensor is offline or showing wrong readings, check the device and network; for hardware issues, create a Support Ticket. What are you seeing—offline sensor, wrong reading, or alert not firing?"

    if topic == "handover":
        return "Digital Handover: create or complete a handover in Management; use a template if you have one. If it won't submit, check your role and that required fields are filled. What's blocking you—missing template, won't submit, or something else?"

    if topic == "lost_found":
        return "Lost & found and packages: Property Items (Lost & Found) → register the item, match to reports if any, record when claimed. For a locker not opening or missing item, check the record and locker status; hardware issues go to a Support Ticket. What do you need—register an item, find a record, or troubleshoot a locker?"

    return None


def _chat_reply(user_message: str, last_user_message: Optional[str] = None, last_bot_reply: Optional[str] = None, session_id: Optional[str] = None) -> tuple[str, bool]:
    """
    System-knowledge support bot with enhanced error handling, offline troubleshooting, and navigation disambiguation.
    """
    m = user_message.lower().strip()
    last_bot = (last_bot_reply or "").lower()[:500]

    # --- NEW: Error message matching (P0) ---
    error_match = _match_error_message(user_message)
    if error_match:
        fix_text = f"I see you're encountering an error. {error_match['cause']}\n\n"
        fix_text += "Here's how to fix it:\n"
        for i, step in enumerate(error_match['fix_steps'], 1):
            fix_text += f"{i}. {step}\n"
        if error_match.get('escalate_if'):
            fix_text += f"\nIf {error_match['escalate_if']}, say 'create a ticket' and I'll create one for you."
        else:
            fix_text += "\nIf this doesn't help, say 'create a ticket' and I'll create one for you."
        return (fix_text, True)

    # --- NEW: Offline queue troubleshooting (P0) ---
    if any(x in m for x in ["changes not saving", "not saving", "didn't save", "lost my changes"]):
        return (
            "If your changes aren't appearing, you might be offline. Check the top of the screen for an 'Offline' banner. "
            "When offline, all operations are automatically queued and will sync when your connection restores. "
            "You can continue working—your changes are saved locally. If you see a yellow badge showing pending operations, "
            "that's normal. They'll sync automatically. If you see a red badge with failed operations, click 'Retry Failed Operations'.",
            True
        )
    
    if any(x in m for x in ["pending operations", "queued operations", "offline queue"]):
        return (
            "Pending operations mean your changes are queued locally and will sync when your connection restores. "
            "This is normal when you're offline or have a weak connection. You'll see a yellow badge showing the count. "
            "Operations sync automatically every 60 seconds when online. If operations fail (red badge), click 'Retry Failed Operations' "
            "or check the error message in the queue. Say 'create a ticket' if operations are stuck.",
            True
        )
    
    if any(x in m for x in ["failed operations", "operations failed", "sync failed"]):
        return (
            "Failed operations couldn't sync to the server. Common causes: server error (500), validation error (422), or network timeout. "
            "To fix: (1) Click 'Retry Failed Operations' button. (2) If still failing, check the error message in the queue. "
            "If it's a validation error, you may need to recreate the operation with corrected data. If it's a server error, "
            "create a support ticket.",
            True
        )

    # --- NEW: WebSocket troubleshooting (P1) ---
    if any(x in m for x in ["dashboard not updating", "not getting updates", "real-time not working", "stale data"]):
        return (
            "If your dashboard isn't updating in real-time, the WebSocket connection may be disconnected. "
            "Real-time features (live incidents, camera updates, patrol status) require WebSocket. "
            "To fix: (1) Refresh the page (F5 or Ctrl+R) to reconnect. (2) Check browser console (F12) for WebSocket errors. "
            "If refreshing doesn't help, check your network connection and firewall settings. WebSocket uses ws:// protocol.",
            True
        )

    # --- NEW: Navigation disambiguation (P1) ---
    nav_reply = _handle_navigation_question(user_message)
    if nav_reply:
        return (nav_reply, True)

    # --- NEW: Settings reference (P1) ---
    if "how do i change" in m or "where is the setting" in m:
        for module, info in SETTINGS_REFERENCE.items():
            if module in m:
                reply = f"To change {module} settings:\n\n"
                reply += f"Go to: {info['path']}\n\n"
                reply += "This tab controls:\n"
                for control in info["controls"]:
                    reply += f"- {control}\n"
                return (reply, True)

    # --- Conversational follow-ups (existing logic) ---
    if last_bot and any(x in m for x in ["it didn't work", "didn't work", "still not working", "still doesn't work", "same problem", "no luck"]):
        if "camera" in last_bot or "offline" in last_bot or "stream" in last_bot:
            return ("Since it's still not working, the next step is to create a Support Ticket so our technical team can help. Go to Help & Support → Support Tickets → New Ticket. Use title like 'Camera offline: [location]' and category Technical. We'll respond within 2 business hours. For urgent security gaps, use Contact Support to call.", True)
        if "patrol" in last_bot or "app" in last_bot or "sync" in last_bot:
            return ("If the app is still not syncing, have the officer try: (1) Force-close the app and reopen. (2) Check Wi‑Fi or mobile data. (3) Log out and log back in. If it still fails, create a Support Ticket (Help & Support → Support Tickets) with 'Mobile app sync issue' and we'll have someone reach out.", True)
        if "door" in last_bot or "lock" in last_bot or "access" in last_bot:
            return ("If the door or reader is still not working, create a Support Ticket (Help & Support → Support Tickets) with the door/location and what happens. For immediate safety, use physical keys or Contact Support to call. Our team will follow up.", True)
        if "login" in last_bot or "password" in last_bot:
            return ("If you still can't log in, an administrator must reset your password or unlock your account in System Administration → Users. If you're the admin and locked out, use Contact Support to call. Don't rely on chat for account recovery.", True)
        return ("I'm sorry it's still not working. The best next step is to create a Support Ticket (Help & Support → Support Tickets → New Ticket) with a short description of what you tried and what happened. A representative will reach out within 2 business hours. For anything urgent, use Contact Support to call or email.", True)
    
    if last_bot and any(x in m for x in ["what next", "what's next", "and then", "next step", "what do i do now"]):
        if "incident" in last_bot and "assign" not in last_bot:
            return ("Next step: assign the incident to a response team (in the incident detail or list). If it's guest-related (injury, evacuation), assign to a Guest Safety team—they'll use the Guest Safety module for response and mass notification. Then track resolution and update status to Resolved when done.", True)
        if "patrol" in last_bot:
            return ("Next: the officer opens the mobile app, selects the assigned route, and starts the patrol. They visit each checkpoint in order and check in. If they see an issue they can report an incident from the app. When all checkpoints are done, the patrol completes and you'll see it in Patrol Overview.", True)
        if "ticket" in last_bot or "support" in last_bot:
            return ("Next: you'll get a response within 2 business hours. You can view and edit your tickets in Help & Support → Support Tickets. If it's urgent, use Contact Support to call or email directly.", True)
        return ("If you tell me what you're doing (e.g. 'reporting an incident', 'setting up a patrol', 'camera offline'), I can give you the exact next step. Or click one of the options above to start from a topic.", True)
    
    if last_bot and any(x in m for x in ["yes", "yeah", "yep", "please", "sure"]):
        if "ticket" in last_bot or "create a support" in last_bot or "escalat" in last_bot:
            return ("Create a ticket from Help & Support → Support Tickets → New Ticket. Fill in title, description, priority, and category. Submit and you'll get a reference; we'll respond within 2 business hours. Need the step-by-step for something else?", True)
        return ("What would you like to do next? You can ask for another topic (e.g. 'incident workflow', 'patrol') or say 'create a ticket' if you want to escalate.", True)
    
    if last_bot and any(x in m for x in ["no", "nope", "nah", "nothing else", "that's all", "all good", "we're good", "no thanks"]):
        if "anything else" in last_bot or "anything else i can" in last_bot:
            return ("No problem. You can start a new conversation using the button below, or close the chat. Have a good one!", True)
        return ("No problem. What do you need help with? You can pick a topic (e.g. incidents, patrol, access control, cameras, login, support ticket) or type your question. I'm here to walk you through it.", True)
    
    if last_bot and any(x in m for x in ["something else", "different topic", "other"]):
        return ("No problem. What do you need help with? You can pick a topic (e.g. incidents, patrol, access control, cameras, login, support ticket) or type your question. I'm here to walk you through it.", True)
    
    if last_bot and any(x in m for x in ["need more detail", "more detail", "more info", "explain more", "go deeper"]):
        return ("Tell me exactly what you're trying to do or what screen you're on (e.g. 'I'm in Incident Log and need to assign to Guest Safety' or 'Camera 3 is offline'). The more specific you are, the better I can give you the next click or step.", True)

    # --- Very short unclear message: one clarifying question ---
    words = user_message.strip().split()
    d = _dissect_problem(user_message)
    if len(words) <= 3 and d["topic"] is None:
        return (
            "I want to help but I'm not sure what you need. Is this about: a camera or feed, a door/access, login, the patrol app, reporting an incident, or something else? Reply with that (or a short description) and I'll give you concrete steps—or say 'create a ticket' and I'll open one for you.",
            True,
        )

    # --- Dissect problem from human conversation ---
    if d["topic"] and (d["is_problem"] or len(user_message.split()) > 8):
        tailored = _reply_from_dissect(d, user_message)
        if tailored:
            return (tailored, True)
    if d["topic"] and len(user_message.split()) >= 4:
        tailored = _reply_from_dissect(d, user_message)
        if tailored:
            return (tailored, True)

    # --- Greetings & meta (keeping existing logic, shortened for brevity) ---
    if any(x in m for x in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        return (
            "Hi! I'm the Proper 2.9 in-app support assistant. I know this platform in depth: what it is (security management for hotels/properties), "
            "every module's workflow, and how they interact. I can guide you step-by-step or troubleshoot; I don't access your live data or "
            "perform actions for you—I tell you how. When I can't help, I escalate and a person will reach out within 2 business hours. "
            "Ask me anything about the system, or try: 'what are you', 'what can you do', 'your limitations', or 'incident workflow'.",
            True
        )
    if any(x in m for x in ["how are you", "how's it going", "what's up", "how do you do", "how have you been"]):
        return (
            "I'm here and ready to help. Ask me about the system anytime, or we can just chat—what's on your mind?",
            True
        )
    if any(x in m for x in ["thank", "thanks", "bye"]):
        return ("You're welcome! Ask anytime if you need more help.", True)

    # --- Builder/developer testing (so they get a friendly reply even when API key not sent) ---
    if any(x in m for x in ["builder", "developer", "built this", "testing the api", "testing your api", "testing out your api", "testing out your system"]):
        return (
            "Hi! If you're the builder testing the assistant: right now you're seeing the built-in (rule-based) replies because the chat request didn't include an API key. "
            "To get the full AI (e.g. Claude): open the config (gear), add your API key, and click Test connection. Once validated, I'll use the LLM and can answer more freely (including meta questions like this). "
            "You can ask about any module or workflow, or say 'report this gap' if something's missing so the team can refine the feature.",
            True
        )

    # --- Identity, system purpose, limitations, expectations, role ---
    if any(x in m for x in ["what are you", "who are you", "what is this chat", "what is this bot", "are you ai", "are you human"]):
        return (
            "I'm the Proper 2.9 in-app support assistant. I'm a rule-based assistant trained on this platform: I know every module, "
            "their workflows, and how they connect. I don't have access to your live data or the ability to perform actions (e.g. I can't "
            "create an incident or lock a door for you)—I guide you through how to do it. When your question is unclear or outside what I "
            "know, I escalate to a human: a ticket is created and a representative will reach out within 2 business hours. You're using me "
            "inside the desktop console so you can keep working while we chat; I'm here to help you use the system and unblock yourself.",
            True
        )
    if any(x in m for x in ["what is proper 2.9", "what is this system", "what is the platform", "what does this do"]):
        return (
            "Proper 2.9 is a hotel and property security management platform. It's the desktop console you're using now, built for security "
            "managers, officers, front desk, and directors. It centralizes security operations: report and manage incidents (Incident Log), "
            "run and track patrols (Patrol Command Center + mobile app), control doors and lockdown (Access Control), view cameras and recordings "
            "(Security Operations Center), manage guest-related incidents and evacuation (Guest Safety), register visitors and manage the banned "
            "list (Visitor Security, Banned Individuals), monitor environmental sensors (IoT), handle shift handovers (Digital Handover), lost "
            "& found and packages (Property Items), lockers, parking, and more. The purpose is to give your team one place for visibility, "
            "documentation, and action so security operations run consistently and nothing falls through the cracks.",
            True
        )
    if any(x in m for x in ["your limitations", "what can't you do", "what can you not do", "limitations of the bot"]):
        return (
            "My limitations: (1) I can't access your live data—I don't see your incidents, patrols, or users in real time. (2) I can't perform "
            "actions in the system—I can't create an incident, lock a door, or assign a patrol for you; I tell you how to do it. (3) I can't "
            "fix hardware—if a camera or reader is broken, I guide troubleshooting and recommend a support ticket. (4) I can't change permissions "
            "or roles—that's for an administrator. (5) I answer from fixed knowledge; if your question is vague, very specific to your config, "
            "or outside my training, I escalate to a human. (6) I'm not generative AI—I don't make up steps; I follow the workflows I was built with.",
            True
        )
    if any(x in m for x in ["system limitations", "platform limitations", "what can the system not do"]):
        return (
            "System limitations: (1) Depends on hardware and network—cameras, door readers, sensors, and the mobile app need connectivity and "
            "working devices. (2) Features depend on configuration and your role—you may not see every module or action if your role doesn't "
            "include it. (3) Integrations (e.g. external alerting, PMS) may be limited or require setup. (4) The desktop app is for "
            "management and operations; field staff use the mobile app for patrol and reporting. (5) Data and availability depend on backend "
            "and any offline/sync behavior. (6) For custom workflows or deep integrations, a representative or implementation team may be needed.",
            True
        )
    if any(x in m for x in ["what can you do", "what do you do", "how can you help", "your role"]):
        return (
            "I can: (1) Explain any module and its workflow step-by-step (incidents, patrol, access, cameras, guest safety, visitors, banned, "
            "IoT, handover, lost & found, lockers, parking). (2) Explain how modules interact—e.g. incidents and Guest Safety, patrol and "
            "mobile app, visitors and access. (3) Troubleshoot common issues (login, camera offline, app sync, door not locking) and tell you "
            "where to click and what to check. (4) Point you to the right place (Support Tickets, Contact Support, Help Center, Resources). "
            "When I can't answer or fix it, I create a ticket and a person will reach out. You can keep using your screen while we chat—I'm "
            "here to help you use the system and get unblocked.",
            True
        )
    if any(x in m for x in ["expectations", "what should i expect", "response time", "when will someone contact me"]):
        return (
            "What to expect: From me you get immediate answers based on system knowledge and workflows. If I escalate (because I don't have "
            "enough information or it's outside my scope), a support ticket is created and a representative will reach out within 2 business "
            "hours; you'll see the ticket in Help & Support → Support Tickets. For emergencies or urgent issues, use Contact Support to call "
            "or email directly—don't rely on chat for life-safety. You can expect me to be consistent and to point you to the right module "
            "and steps; I won't make up procedures or access your data.",
            True
        )
    if any(x in m for x in ["who uses this", "who is this for", "who am i", "what is my role"]):
        return (
            "Proper 2.9 is used by security and operations staff: security managers and directors, security officers, patrol agents, front "
            "desk, valet, and sometimes other property staff. You're on the desktop console—typically used at a desk or command center. Your "
            "role (e.g. manager, patrol_agent, director) determines which modules and actions you see; I can explain what each module does "
            "and how to use it, but I can't see your role or change it—that's in System Administration (admins) or Account Settings. If you "
            "don't see something, an administrator may need to grant access. You can check Profile Settings for your profile and Work Details.",
            True
        )

    # --- Full system / workflows / how modules interact ---
    if any(x in m for x in ["workflow", "workflows", "how everything works", "how do modules work", "how do they interact", "how does it all connect", "big picture", "overview of system"]):
        return (
            "Here's how the system fits together. INCIDENT LOG: you report incidents (or they come from patrol/mobile); they can be reviewed in Review Queue, then approved and assigned to response teams—those teams live in GUEST SAFETY, so serious guest-related incidents are often assigned there. ACCESS CONTROL: doors, badges, lockdown; lockdown affects all configured doors at once. PATROL: routes and checkpoints are created in Patrol Command Center; officers run patrols on the MOBILE APP and check in at each checkpoint; if they see something they can report an incident from the app—it appears in Incident Log. VISITOR SECURITY: register visitors, check-in/check-out; can tie into access (e.g. temporary badge). BANNED INDIVIDUALS: watchlist and detections; detections can drive alerts or escalation. SOC (Security Operations Center): live cameras and recordings; device health ties to troubleshooting. IoT/ENVIRONMENTAL: sensors (temp, humidity, etc.) and alerts. DIGITAL HANDOVER: shift handovers and checklists. PROPERTY ITEMS: lost & found and packages; SMART LOCKERS and SMART PARKING are separate but related. Ask me for a specific workflow (e.g. 'patrol workflow' or 'incident to guest safety').",
            True
        )
    if any(x in m for x in ["incident workflow", "incident flow", "how do incidents work", "from report to resolution"]):
        return (
            "Incident workflow: (1) Report: Incident Log → New Incident (or from patrol mobile app). Enter location, severity, description, optional photos. (2) Review: incidents may go to Review Queue for approval—managers approve or reject. (3) Assign: once approved, assign to a response team or person. (4) Guest Safety: if it's guest-related (e.g. injury, evacuation), assign to a Guest Safety team—they use Guest Safety module for response, evacuation, mass notification. (5) Resolution: update status to resolved in Incident Log. Trends tab shows patterns. Escalation rules can be set in Settings.",
            True
        )
    if any(x in m for x in ["patrol workflow", "how do patrols work", "run a patrol", "patrol from start to finish"]):
        return (
            "Patrol workflow: (1) Setup: Patrol Command Center → create routes and add checkpoints (order matters). (2) Assign: assign officers to routes; officers need the mobile app and correct role. (3) Run: officer opens mobile app, starts the patrol, visits each checkpoint in order and checks in (GPS/location can be used). (4) During patrol: officer can report an incident from the app—it goes to Incident Log. (5) Complete: when all checkpoints are done, patrol is completed; Overview shows completion rate and efficiency. If an officer is offline, check Patrol Overview for device status; sync issues often need app restart or network.",
            True
        )
    if any(x in m for x in ["lockdown workflow", "how does lockdown work", "lockdown and access"]):
        return (
            "Lockdown workflow: Access Control module → Lockdown tab (or facility lockdown section). When you trigger lockdown, the system locks all access points that are configured for lockdown—doors, gates, etc. This is system-wide for that facility. To unlock, disable lockdown from the same place. Access Points tab shows each door/reader; Configuration controls which points participate in lockdown. Emergency override options may be in Configuration. For 'door not locking during lockdown' check that the access point is in the lockdown group and hardware is online.",
            True
        )
    if any(x in m for x in ["visitor and access", "visitor badge", "visitor check in access", "how do visitors get access"]):
        return (
            "Visitors and access: In Visitor Security you register visitors and do check-in/check-out. Depending on your setup, check-in can grant temporary access (e.g. a badge or door access for the visit duration). Access Control manages the actual doors and who has access; the two modules can integrate so that when a visitor is checked in, they get time-limited access that is revoked on check-out. If visitors can't get through a door, check (1) they're checked in, (2) the door is in their allowed areas, (3) Access Control → Users or permissions for that visitor/temporary credential.",
            True
        )
    if any(x in m for x in ["banned detection", "banned alert", "banned individual detected", "what happens when banned"]):
        return (
            "Banned individuals: The Banned Individuals module holds the watchlist. When a detection occurs (e.g. camera or kiosk matches someone on the list), it can create an alert or event. Those alerts can be viewed in the Banned Individuals module (e.g. Detections) and may be configured to notify security or create an incident. So the flow is: watchlist (Management) → detection (system or hardware) → alert/detection record → security response. For false positives, use the module to review and adjust or remove the match.",
            True
        )
    if any(x in m for x in ["camera and incident", "camera offline incident", "soc and incident"]):
        return (
            "Cameras and incidents: SOC (Security Operations Center) is for live view and recordings. If something happens on camera, you'd typically (1) note it in SOC (or use recording as evidence), (2) create an incident in Incident Log and link or describe the camera/location. There isn't always an automatic 'camera event → create incident'—you create the incident. If a camera goes offline, that's a separate issue: troubleshoot in SOC (refresh stream, device health) or create a support ticket for hardware; you can also log 'Camera X offline' as an incident if you want it tracked.",
            True
        )
    if any(x in m for x in ["guest safety and incident", "assign incident to guest safety", "incident to response team"]):
        return (
            "Guest Safety and incidents: Incidents are created in Incident Log. When you assign an incident to a response team, that team is often defined in Guest Safety (response teams). So the flow is: create incident in Incident Log → in the incident assign to a team → that team uses Guest Safety module to coordinate (evacuation, mass notification, messages). Guest Safety's Incidents tab may show incidents assigned to their teams; Evacuation and Mass Notification are used for broader alerts. So Incident Log is the source of record; Guest Safety is where response teams act.",
            True
        )
    if any(x in m for x in ["handover and shift", "shift change", "handover workflow"]):
        return (
            "Handover workflow: Digital Handover is for shift changes. (1) Create a handover (or use a template) with shift type (e.g. morning/afternoon/night), handover from/to, date, summary of incidents, pending tasks, equipment status, special instructions. (2) Complete the handover so the next shift has the record. (3) Tracking tab shows status of handovers. Equipment tab can list equipment and issues. So it's: create handover → fill checklist and notes → complete → next shift views it. Handovers don't automatically create incidents—they're documentation; if something needs follow-up you'd create an incident or ticket separately.",
            True
        )
    if any(x in m for x in ["lost found workflow", "lost and found process", "register lost item"]):
        return (
            "Lost & found workflow: In Property Items (Lost & Found), (1) Register an item: who found it, where, when, description, category. (2) Match: if someone reported a lost item, you can try to match (some systems have matching). (3) Claim: when the owner claims, record the claim. (4) Analytics tab for trends. Packages are similar: register package → deliver or notify recipient. Smart Lockers (if used) are for physical locker assignment; the locker module tracks which locker has which item or package.",
            True
        )
    if any(x in m for x in ["iot alert", "sensor alert", "environmental alert workflow"]):
        return (
            "IoT/Environmental alert workflow: In IoT Monitoring (or IoT Environmental), you define sensors and thresholds in Settings. When a reading exceeds a threshold (e.g. temperature too high), the system creates an alert. Alerts show in the Alerts tab; you acknowledge or resolve them. So flow: sensor data → compared to thresholds → alert created → you respond. If a sensor is offline, you won't get readings until it's back; create a ticket for hardware. Alerts don't auto-create incidents—you can create an incident in Incident Log if you want to track the response.",
            True
        )

    # --- Login / password / account ---
    if any(x in m for x in ["password", "forgot password", "reset password", "can't log", "cannot log", "locked out", "login failed", "2fa", "two factor", "authenticator"]):
        return (
            "Password & login: Use 'Forgot password' on the login page, or ask your administrator to reset your account. "
            "If you're locked out after too many attempts, an admin must unlock you in System Administration → Users. "
            "2FA issues: use Profile Settings → Security to disable/re-enable 2FA or revoke other sessions.",
            True
        )
    if any(x in m for x in ["emergency", "urgent incident", "immediate threat"]):
        return (
            "For an emergency: (1) Use Incident Log → Emergency Alert to log it. (2) For immediate help, use Help & Support → "
            "Contact Support to call or email—don't rely on chat for life-safety. If you need to lock the facility, use Access Control → Lockdown tab.",
            True
        )
    if any(x in m for x in ["can't see", "don't see", "missing module", "no access to module"]):
        return (
            "If you don't see a module or menu, your role may not include it. An administrator must grant the role in System Administration → Users "
            "(or Account Settings). Profile Settings shows your profile; I can't see or change your permissions—only an admin can.",
            True
        )
    if any(x in m for x in ["door won't open", "reader not working", "badge not working", "card not reading"]):
        return (
            "Door/reader not working: (1) Check Access Control → Access Points for that door's status. (2) Confirm your access is granted in Users. "
            "(3) Try another reader if available. (4) For hardware (reader broken, door stuck), create a Support Ticket. For immediate safety use physical keys or Contact Support.",
            True
        )
    if any(x in m for x in ["profile", "picture", "avatar", "photo", "company email", "employee id"]):
        return (
            "Profile: Go to Profile Settings (sidebar or your name) → Personal Info. There you can update name, email, "
            "phone, company email, employee ID, emergency contact, and upload a profile picture. Work details (department, "
            "hire date, shift) are under the Work Details tab.",
            True
        )

    # --- Incidents & event log ---
    if any(x in m for x in ["incident", "report incident", "event log", "reporting", "log an incident"]):
        return (
            "Incident Log (Event Log): Go to Incident Log from the sidebar (or Modules → Event Log). Click 'New Incident' or use "
            "the incident management tab. Enter location, severity, description; you can attach photos and assign to a response team. "
            "For emergencies use the Emergency Alert. The Review Queue tab shows incidents pending approval; Trends and Settings are there too.",
            True
        )
    if any(x in m for x in ["review queue", "approve incident", "pending incident"]):
        return (
            "Review Queue: In Incident Log, open the 'Review Queue' tab. You'll see incidents awaiting review/approval. "
            "Open one to approve, reject, or request changes. Use Settings to configure auto-approval or escalation rules.",
            True
        )

    # --- Access control ---
    if any(x in m for x in ["access control", "door", "lock", "badge", "grant access", "revoke", "lockdown"]):
        return (
            "Access Control: Open the Access Control module. Overview shows status; Access Points lists doors/readers; "
            "Users tab lets you grant/revoke access by user and location. Use Lockdown if you need to lock down the facility. "
            "Configuration tab for points, timeouts, biometrics. Hardware issues (reader not reading, door stuck)? Create a support ticket.",
            True
        )

    # --- Cameras & security operations ---
    if any(x in m for x in ["connect camera", "add camera", "add a camera", "connect my camera", "outdoor camera", "tapo camera", "how do i add a camera", "how to add camera", "provisioning camera"]):
        return (
            "To connect a camera (e.g. outdoor or Tapo) to the Security Operations Center: (1) Open Security Operations Center from the sidebar. "
            "(2) Click the Provisioning tab. (3) In the 'Add Camera' form fill: Camera Name (e.g. Front Gate Outdoor), Location (e.g. MAIN ENTRANCE GATE), "
            "IP Address (camera's IP on your network), Stream URL (e.g. rtsp://192.168.1.100/stream — RTSP, HTTP, HTTPS, or WSS). (4) If the camera needs login, add Username and Password. "
            "(5) Click Add Camera. (6) Open the Live View tab to see the new tile; use Refresh stream if the feed does not show. "
            "For Tapo/consumer cameras, get the RTSP or stream URL from the camera app or manual; the IP is often in your router's device list.",
            True
        )
    if any(x in m for x in ["camera", "cameras", "offline", "stream", "soc", "security operations", "live view", "recording"]):
        return (
            "Cameras & SOC: Security Operations Center (SOC) shows live view and camera tiles. If a camera is offline: (1) Check the "
            "tile status and try 'Refresh stream'. (2) In Settings, check device health and network. (3) For hardware or wiring issues, "
            "create a Support Ticket—our technical team will assist. Recordings and audit trail are in the SOC tabs.",
            True
        )

    # --- Patrol ---
    if any(x in m for x in ["patrol", "route", "checkpoint", "officer", "on duty", "patrol agent"]):
        return (
            "Patrol Command Center: Manage patrols, routes, and officers. Overview shows active patrols, on-duty count, completion. "
            "Create routes and checkpoints in the management tab; assign officers. Officers use the mobile app to run patrols and "
            "check in at checkpoints. If an officer's app isn't syncing, have them check network and restart the app; otherwise create a ticket.",
            True
        )

    # --- Guest safety ---
    if any(x in m for x in ["guest safety", "evacuation", "mass notification", "incident guest"]):
        return (
            "Guest Safety: Guest Safety module handles incidents affecting guests, evacuation plans, and mass notifications. "
            "Incidents tab to create/view; assign response teams. Evacuation tab for procedures; Mass Notification to send alerts. "
            "Messages tab for team communication. Use Contact Support or a ticket for integration with external alerting.",
            True
        )

    # --- Visitors & banned individuals ---
    if any(x in m for x in ["visitor", "visitors", "check-in", "check-out", "banned", "ban list"]):
        return (
            "Visitors & Banned Individuals: Visitor Security module: register visitors, check-in/check-out, events, and banned list. "
            "Banned Individuals (separate module) manages the watchlist and detections. For 'how to add a banned person' or "
            "false-positive detections, use the Management tab and details modals. Hardware (e.g. kiosk) issues → support ticket.",
            True
        )

    # --- IoT & environmental ---
    if any(x in m for x in ["iot", "sensor", "environmental", "temperature", "humidity", "alerts iot"]):
        return (
            "IoT / Environmental: IoT Monitoring (or IoT Environmental) shows sensors, alerts, and analytics. Add/edit sensors in "
            "Sensors tab; set thresholds in Settings. Alerts fire when thresholds are exceeded. If a sensor shows offline or wrong "
            "readings, check the device and network; for hardware replacement or calibration, create a support ticket.",
            True
        )

    # --- Digital handover ---
    if any(x in m for x in ["handover", "shift handover", "digital handover"]):
        return (
            "Digital Handover: Digital Handover module is for shift handovers—checklists, equipment status, notes. Create or "
            "complete handovers in Management; use Tracking for status. Equipment and Settings tabs for templates and config. "
            "If handover won't submit or data is missing, check your role and the handover template; else create a ticket.",
            True
        )

    # --- Property items, lockers, parking ---
    if any(x in m for x in ["lost and found", "lost & found", "property items", "package", "locker", "smart locker"]):
        return (
            "Property Items / Lost & Found / Lockers: Property Items module covers lost & found and packages. Register items, "
            "match to reports, manage packages. Smart Lockers (if enabled) are in their module for locker assignment and release. "
            "For missing item or locker not opening, check the item/package record and locker status; hardware issues → support ticket.",
            True
        )
    if any(x in m for x in ["parking", "valet", "space", "occupancy"]):
        return (
            "Smart Parking: Parking module shows spaces, occupancy, and guest/valet status. Manage spaces and guest registrations "
            "from the tabs. For a space stuck 'occupied' or sensor errors, check IoT/device status and create a ticket if needed.",
            True
        )

    # --- Support tickets & help ---
    if any(x in m for x in ["ticket", "support ticket", "create ticket", "open a ticket"]):
        return (
            "Support tickets: In Help & Support → Support Tickets, click 'New Ticket'. Enter title, description, priority (low/medium/high/urgent), "
            "and category (Technical, Account, Feature Request, Bug Report). We'll respond within 2 business hours. You can view and edit "
            "your tickets in the same tab.",
            True
        )
    if any(x in m for x in ["help", "documentation", "manual", "how do i", "where is"]):
        return (
            "Help & Support: Use Help & Support in the sidebar. Overview for quick stats; Help Center to search articles; Support Tickets "
            "to create or view tickets; Contact Support for email/phone; Resources for user manual, mobile app links, API docs, and training videos. "
            "Describe what you're trying to do and I can give step-by-step instructions.",
            True
        )

    # --- System admin & settings ---
    if any(x in m for x in ["admin", "system admin", "user management", "roles", "permissions"]):
        return (
            "System Administration: Admins use the System Administration module for users, roles, properties, system settings, security policies, "
            "and audit logs. User management: add/edit users, assign roles. For 'I don't have access'—your role may not include that module; "
            "an administrator must grant the role or permission. Account-level team settings are under Account Settings.",
            True
        )
    # Team Chat = the messaging module (check before generic "team" which means Account Settings)
    if any(x in m for x in ["team chat", "teamchat", "how does team chat work", "how team chat works"]):
        return (
            "Team Chat: Open the Team Chat module from the sidebar (path: /modules/team-chat). It's the secure real-time messaging for security personnel. "
            "Tabs: Messages (conversations), Channels (group channels), Analytics, Settings. Use the 'New Message' button to start a conversation. "
            "This is separate from Account Settings → Team (which is for team members and org settings).",
            True
        )
    if any(x in m for x in ["account settings", "team", "property"]):
        return (
            "Account Settings: Team members, team settings, integrations, and permissions are in Account Settings (sidebar). "
            "Profile Settings is for your own profile, 2FA, and sessions. Property selection (if you have multiple) is usually in the header or dashboard.",
            True
        )

    # --- Mobile app ---
    if any(x in m for x in ["mobile", "app", "mobile app", "download app", "patrol app", "where do i download", "get the app"]):
        return (
            "Mobile app: Download from Help & Support → Resources (iOS App Store or Google Play). Sign in with the same credentials as the desktop. "
            "Used for patrol check-ins, incident reporting, and real-time alerts. If login fails, confirm your account is active and you have the "
            "right role; for app crashes or sync issues, create a support ticket with 'Technical' or 'Bug Report'.",
            True
        )

    # --- Unclear: try to narrow down instead of immediately escalating ---
    if d["topic"]:
        t = d["topic"]
        if t == "camera":
            return ("Sounds like it might be camera-related. Try: (1) SOC → find the camera tile → Refresh stream. (2) Settings/device health for that camera. If that doesn't help, tell me what you see or say 'create a ticket' and I'll open one for you.", True)
        if t == "door":
            return ("Sounds like an access/door issue. Check Access Control → Access Points for that door's status, and Users for access. If the reader or door is faulty, use physical keys and create a ticket with the location. Say 'create a ticket' if you want me to open one.", True)
        if t == "login":
            return ("For login issues: use Forgot password or ask an admin to reset/unlock in System Administration → Users. 2FA: Profile Settings → Security (after you're in). If you're locked out and you're the admin, use Contact Support to call. Need more specific steps?", True)
        if t == "patrol":
            return ("For patrol/app issues: have the officer restart the app and check network; log out and back in if needed. If it's still not syncing, say what you've tried or 'create a ticket' and I'll open one.", True)
        if t == "incident":
            return ("For incidents: Incident Log → New Incident (location, severity, description). Need the full workflow or just where to click? Or say 'create a ticket' if you're stuck.", True)
    
    # No topic inferred: admit we don't know and offer to report the gap (plain text, no markdown)
    return (
        "I don't have a confident answer for that—it may be outside what I'm built to help with. You can try rephrasing (e.g. which module or task?), or say 'report this gap' and I'll create a ticket so the dev team can improve the assistant. You can also say 'create a ticket' for general support.",
        True
    )


ESCALATION_REPLY = (
    "I don't have enough information to solve this from here. I've notified the support team—a representative will reach out to you "
    "within 2 business hours. Your reference for this request is: {ticket_id}. You can also see this in Help & Support → Support Tickets. "
    "If it's urgent, use Contact Support to call or email directly."
)


def _is_report_gap_intent(message: str, last_bot_reply: Optional[str]) -> bool:
    """User wants to report that the AI didn't know / couldn't help (for dev refinement)."""
    m = message.lower().strip()
    return any(x in m for x in [
        "report this gap", "report gap", "report ai shortcoming", "report ai gap",
        "report that the ai didn't know", "ai didn't help", "report the assistant"
    ])


def _is_create_ticket_intent(message: str, last_bot_reply: Optional[str]) -> bool:
    m = message.lower().strip()
    if any(x in m for x in ["create a ticket", "create ticket", "i'll create a ticket", "escalate", "yes create a ticket"]):
        return True
    last_bot = (last_bot_reply or "").lower()
    if any(x in m for x in ["yes", "yeah", "yep", "please", "sure"]) and any(
        x in last_bot for x in ["ticket", "escalat", "new ticket", "create a support"]
    ):
        return True
    return False


# --- Full product knowledge for the LLM (every module, path, tab, button, workflow) ---
PROPER_29_FULL_KNOWLEDGE = r"""
## SIDEBAR NAVIGATION (exact paths)
All modules live under the sidebar "Enhanced Security Modules". Paths:
- Patrol Command Center → /modules/patrol
- Access Control → /modules/access-control
- Security Operations Center (SOC) → /modules/security-operations-center
- Incident Log → /modules/event-log
- Visitor Security → /modules/visitors
- Guest Safety → /modules/guest-safety
- Property Items → /modules/property-items
- Smart Lockers → /modules/smart-lockers
- Smart Parking → /modules/smart-parking
- Digital Handover → /modules/digital-handover
- Team Chat → /modules/team-chat
- IoT Monitoring → /modules/iot-monitoring
- System Administration → /modules/system-administration

Other routes: Help & Support → /help. Profile Settings → /profile or sidebar user menu. Account Settings → /settings. Notifications → /notifications.

## MODULE TABS AND BUTTONS (where to click)
Incident Log: Overview, Incidents (list), New Incident button, Review Queue tab (approve/reject incidents), Trends tab, Settings tab. Emergency Alert button for urgent incidents.
Access Control: Overview tab, Access Points tab (doors/readers, status), Users tab (grant/revoke access), Lockdown Facility tab (lock all doors), Configuration tab (timeouts, biometrics, emergency override), Events tab, Reports tab.
Security Operations Center (SOC): Live camera tiles, Refresh stream per camera, device health in Settings, recording/audit.
Patrol Command Center: Overview (active patrols, on-duty count), routes and checkpoints management, assign officers. Officers use the mobile app to run patrols and check in at checkpoints; they can report incidents from the app (appears in Incident Log).
Guest Safety: Incidents tab (assigned to teams), Evacuation tab, Mass Notification tab, Messages tab, Response Teams, Settings.
Visitor Security: Visitor registration, check-in/check-out, events, Banned list tab (visitor context). Settings for check-in defaults, access duration.
Banned Individuals: Management tab (watchlist, add/edit/remove), Detections tab (alerts when someone on list is detected). Settings for sensitivity, alert rules.
IoT Monitoring: Sensors tab (add/edit sensors, status), Alerts tab (acknowledge/resolve), Analytics tab, Settings (thresholds, alert rules).
Digital Handover: Management (create/complete handovers), Tracking tab, Equipment tab, Settings (templates, checklist items).
Team Chat: Secure real-time messaging for security personnel. Tabs: Messages (conversations), Channels (group channels), Analytics, Settings. New Message button to start a conversation. Path: /modules/team-chat. (Not the same as Account Settings → Team, which is org/team members.)
Property Items: Lost & found and packages; register items, match, claim. Analytics tab.
Smart Lockers / Smart Parking: Module-specific tabs; Settings for assignment rules, availability.
System Administration: Users tab (create users, assign roles, unlock accounts, reset password), full system config. Only admins see this.
Profile Settings: Personal Info (name, email, phone, profile picture), Work Details, Security (2FA, sessions).
Help & Support: Overview, Help Center (articles), Support Tickets (list, New Ticket), Contact Support, Resources. Live Chat opens this assistant.

## SETTINGS LOCATIONS (each module)
Incident Log → Settings: auto-approval rules, escalation, notifications, review queue workflow.
Access Control → Configuration (not "Settings"): access timeouts, biometrics, emergency override, lockdown participation.
SOC → Settings: camera defaults, recording retention, stream quality.
Guest Safety → Settings: evacuation procedures, mass notification templates, response teams, alert thresholds.
Visitor Security → Settings: check-in defaults, visitor access duration, integration with Access Control.
Banned Individuals → Settings: detection sensitivity, alert rules, false positive handling.
IoT Monitoring → Settings: sensor thresholds, alert rules.
Digital Handover → Settings: handover templates, checklist items, equipment tracking.
Team Chat → Settings: notifications, channel defaults, retention (in Team Chat module).
Patrol Command Center → Settings: route/checkpoint config, sync intervals, mobile app config.
Property Items / Smart Lockers / Smart Parking → Settings: per-module policies.
System Administration → Settings: security policies, password rules, session timeout, audit retention.

## DISAMBIGUATION (same name in multiple places)
- "Banned individuals": (1) Banned Individuals module = watchlist, detections, bulk ops. (2) Visitor Security → Banned tab = check if visitor is banned at check-in.
- "Emergency": (1) Incident Log → Emergency Alert = log emergency incident. (2) Access Control → Lockdown = lock all doors.
- "User management": (1) System Administration → Users = create users, roles, permissions. (2) Account Settings → Team = team-specific config.
- "Profile": Sidebar dropdown → Profile and Profile Settings module go to same place.
- "Team" vs "Team Chat": Team Chat = sidebar module /modules/team-chat (Messages, Channels, real-time chat). "Team" or "team settings" = Account Settings (sidebar) for team members and org settings.

## WORKFLOWS (step-by-step)
Incident: Incident Log → New Incident (or from patrol app) → enter location, severity, description, optional photos → Review Queue if enabled → assign to team/person → Guest Safety team uses Guest Safety module for response → resolve in Incident Log. Trends and Settings in Incident Log.
Patrol: Patrol Command Center → create routes, add checkpoints (order matters) → assign officers (need mobile app + role) → officer opens app, starts patrol, checks in at each checkpoint → can report incident from app → completes when all checkpoints done. Overview shows completion; sync issues → app restart, check network.
Lockdown: Access Control → Lockdown Facility tab → trigger lockdown (all configured doors lock) → disable from same place to unlock. Configuration controls which doors participate.
Visitor + access: Visitor Security → register/check-in → can grant temporary access; Access Control manages doors. If visitor can't enter, check check-in status and Access Control → Users / that door's config.
Banned detection: Banned Individuals → Management = watchlist. When camera/kiosk detects match → alert in Detections tab → security response. False positives: review in module, adjust or remove match.
Camera + incident: SOC for live view/recordings. To log something seen on camera: create incident in Incident Log (link or describe location). Camera offline: SOC → Refresh stream, device health; hardware → support ticket.

Connect a camera (e.g. outdoor, Tapo, or any IP camera) to the Security Operations Center — step by step: (1) Open Security Operations Center from the sidebar. (2) Click the **Provisioning** tab (not Live View). (3) In the "Add Camera" card, fill: **Camera Name** (e.g. "Front Gate Outdoor"), **Location** (e.g. "MAIN ENTRANCE GATE"), **IP Address** (the camera's IP on your network, e.g. 192.168.1.100), **Stream URL** (e.g. rtsp://192.168.1.100/stream or the URL from your camera's app; must be RTSP, HTTP, HTTPS, WS, or WSS). (4) If the camera requires login, enter **Username** and **Password** (optional; stored securely). (5) Click **Add Camera**. (6) Go to the **Live View** tab to see the new camera tile; use **Refresh stream** on the tile if the feed does not appear. Tip: For consumer cameras (e.g. Tapo), find the RTSP or stream URL in the camera's app or manual; IP is often in your router's device list.

Tapo C500 (and C500-specific): Same steps as above. For the C500: (1) In the Tapo app, add the camera and note its local IP (Tapo app → camera → Settings → Device info, or check your router's connected devices). (2) Enable RTSP in the Tapo app: open the C500 in Tapo → Settings (gear) → Advanced → enable "RTSP stream" or "Local recording / RTSP"; the app may show the stream URL (often rtsp://CAMERA_IP:554/stream1 or similar). (3) Use that IP in SOC Provisioning as IP Address and the RTSP URL as Stream URL. (4) If you set a camera password in Tapo, use that as the Username/Password in the SOC form (some C500 firmware uses the Tapo account email as username and device password as password—check Tapo docs). (5) Add Camera in SOC, then open Live View and use Refresh stream on the new tile.
Guest Safety + incident: Create incident in Incident Log → assign to response team (teams defined in Guest Safety) → team uses Guest Safety (Evacuation, Mass Notification, Messages).
Handover: Digital Handover → create handover (template), fill checklist, equipment status, notes → complete → next shift views in Tracking. Equipment tab for equipment list.
Lost & found: Property Items → register item (who found, where, description) → match/claim as needed. Packages similar. Smart Lockers for physical locker assignment.
IoT alert: IoT Monitoring → Settings for thresholds → when exceeded, alert in Alerts tab → acknowledge/resolve. Offline sensor → ticket for hardware.

## TROUBLESHOOTING (exact steps)
Password / login: Forgot password on login page, or admin resets in System Administration → Users. Locked out → admin unlocks in System Administration → Users. 2FA issues → Profile Settings → Security.
Door/reader not working: Access Control → Access Points (check door status) → Users (confirm access). Hardware broken → support ticket.
Camera offline: SOC → Refresh stream on tile → Settings / device health. Hardware → support ticket.
Patrol app not syncing: Officer check network, restart app, logout/login. Patrol Overview for device status.
Can't see module: Role doesn't include it. Admin grants in System Administration → Users (or Account Settings).
Offline queue: Operations queue when offline; sync when connection restores. No special click.
Emergency: Incident Log → Emergency Alert to log; Help & Support → Contact Support to call/email; Access Control → Lockdown to lock facility.

## RULES
- Natural conversation: Off-topic or casual messages (greetings, how are you, small talk, opinions, jokes) are fine. Respond in a friendly, natural way; don't force the conversation back to the system. When they ask about the system, use the knowledge above.
- Only the user can create a ticket: they say "create a ticket" or "escalate". You never say you created one; you say "Say **create a ticket** and I'll create one for you" or direct to Help & Support → Support Tickets → New Ticket.
- When you don't know the answer or aren't confident: say so clearly (e.g. "I don't have a confident answer for that" or "That's outside what I'm built to help with"). Then offer: "You can **report this gap** by saying 'report this gap' so the dev team can improve the assistant, or say 'create a ticket' for general support."
- Response time for tickets: 2 business hours. Life-safety → Contact Support, not chat.
- Do not make up features or buttons. Only reference modules, tabs, and paths listed above.
- Keep replies 2–4 short paragraphs. Use conversation context; if they already tried something, give the next step only.
"""

_HELP_CHAT_SYSTEM_PROMPT = """You are the in-app support assistant for Proper 2.9, a hotel and property security management platform (desktop console for security managers, officers, front desk, valet).

NATURAL CONVERSATION: You can and should hold normal, human conversation. Off-topic chat, small talk, "how are you", jokes, opinions, or casual back-and-forth are fine—respond in a friendly, natural way. Don't deflect to the system or act robotic. If the user is just chatting, chat back briefly. When they ask about the system or need help, use the product knowledge below. Either way, stay concise (1–3 short paragraphs) and personable.

You help users by explaining modules and workflows, giving step-by-step instructions (where to click, what to do), and troubleshooting. You do NOT perform actions for them—you guide. When you can't fix it, tell them to say "create a ticket" or "escalate", or use Help & Support → Contact Support. Response time for tickets: 2 business hours. For emergencies they must use Contact Support, not chat.

When you DON'T know the answer or aren't confident: admit it clearly (e.g. "I don't have a confident answer for that"). Then offer: they can say "report this gap" so the dev team can improve the assistant, or "create a ticket" for general support.

If the user says they are the builder/developer testing the system or the API: respond in a friendly, short way. You can say you're the in-app assistant with the product knowledge they provided, you don't access live data or the codebase, and they can ask about any module or workflow or use "report this gap" if something is missing. Keep it to 1–2 short paragraphs.

CRITICAL: Never say that you will create a ticket or that you have created a ticket. Only the user can trigger ticket creation by saying "create a ticket" or "escalate". If they want a ticket, say: "Say **create a ticket** and I'll create one for you," or direct them to Help & Support → Support Tickets → New Ticket.

Keep replies concise (2–4 short paragraphs max). Use the conversation context. Do not make up features; use ONLY the knowledge below.

""" + PROPER_29_FULL_KNOWLEDGE.strip() + "\n\nUse the knowledge above to answer. Give exact paths (Module → Tab → Button) when telling users where to click."


async def _chat_reply_llm(
    user_message: str,
    session_id: Optional[str] = None,
    last_user_message: Optional[str] = None,
    last_bot_reply: Optional[str] = None,
    api_key: Optional[str] = None,
    user: Optional[User] = None,
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    raise_on_failure: bool = False,
) -> Optional[str]:
    """Call OpenAI (or compatible) API with full conversation history. If raise_on_failure=True, re-raise on error (for validation)."""
    key = (api_key or _HELP_CHAT_LLM_API_KEY or "").strip()
    if not key:
        return None
    
    try:
        from openai import AsyncOpenAI
        # Use base_url from request, or fallback to environment variable, or None (defaults to OpenAI)
        api_base_url = (base_url or _HELP_CHAT_LLM_BASE_URL or "").strip()
        # Anthropic: normalize base URL for compatibility layer; prefer native SDK when base is Anthropic
        use_anthropic_native = bool(api_base_url and "anthropic.com" in api_base_url)
        if api_base_url and "anthropic.com" in api_base_url:
            api_base_url = api_base_url.rstrip("/")
            if not api_base_url.endswith("/v1"):
                api_base_url = (api_base_url + "/v1").rstrip("/") + "/"
            else:
                api_base_url = api_base_url + "/" if not api_base_url.endswith("/") else api_base_url
        logger.info(f"_chat_reply_llm: base_url param={base_url!r}, normalized={api_base_url or 'OpenAI default'}, use_anthropic_native={use_anthropic_native}")
        
        model_name = model or _HELP_CHAT_LLM_MODEL
        # Map deprecated Anthropic model IDs to current ones (per Anthropic deprecation docs)
        _ANTHROPIC_REPLACEMENTS = {
            "claude-3-5-sonnet-20241022": "claude-sonnet-4-5-20250929",
            "claude-3-5-sonnet-20240620": "claude-sonnet-4-5-20250929",
            "claude-3-opus-20240229": "claude-opus-4-6",
            "claude-3-7-sonnet-20250219": "claude-opus-4-6",
            "claude-3-5-haiku-20241022": "claude-haiku-4-5-20251001",
        }
        if use_anthropic_native and model_name in _ANTHROPIC_REPLACEMENTS:
            logger.info(f"Replacing deprecated model {model_name!r} with {_ANTHROPIC_REPLACEMENTS[model_name]!r}")
            model_name = _ANTHROPIC_REPLACEMENTS[model_name]
        
        # Build user context and system prompt once (used by native Anthropic and by OpenAI path)
        user_context = ""
        if user:
            role = getattr(user, "role", None) or "unknown"
            user_context = f"\n\nUSER CONTEXT:\nUser role: {role}. Note: In admin dashboard, admins and managers have full access to all modules."
        enhanced_prompt = _HELP_CHAT_SYSTEM_PROMPT + user_context
        
        # Native Anthropic path: more reliable than compatibility layer for Claude
        if use_anthropic_native:
            try:
                from anthropic import AsyncAnthropic
                ac = AsyncAnthropic(api_key=key)
            except ImportError:
                ac = None
            if ac is not None:
                ac_messages = []
                if session_id:
                    history = _get_session_summary(session_id, max_turns=20)
                    if history:
                        for msg in history:
                            ac_messages.append({"role": msg["role"], "content": msg["content"]})
                elif last_user_message and last_bot_reply:
                    ac_messages.append({"role": "user", "content": last_user_message[:800]})
                    ac_messages.append({"role": "assistant", "content": last_bot_reply[:800]})
                ac_messages.append({"role": "user", "content": user_message[:1500]})
                try:
                    resp = await ac.messages.create(
                        model=model_name,
                        max_tokens=500,
                        temperature=0.3,
                        system=enhanced_prompt,
                        messages=ac_messages,
                    )
                    reply = (resp.content[0].text if resp.content else "").strip()
                    if session_id:
                        _add_to_session(session_id, "user", user_message)
                        _add_to_session(session_id, "assistant", reply)
                    logger.info("LLM call succeeded (native Anthropic)")
                    return reply
                except Exception as ac_err:
                    err_str = str(ac_err)
                    if raise_on_failure:
                        if "invalid_api_key" in err_str.lower() or "401" in err_str:
                            raise ValueError("Invalid API key. Check your key and try again.") from ac_err
                        if "404" in err_str or "not_found" in err_str.lower():
                            raise ValueError(f"Model '{model_name}' not found. Check model name.") from ac_err
                        if "rate" in err_str.lower():
                            raise ValueError("Rate limit exceeded. Try again in a minute.") from ac_err
                        raise ValueError(err_str) from ac_err
                    logger.warning(f"Native Anthropic call failed, falling back to OpenAI compatibility: {ac_err}")
                    # Fall through to OpenAI client path
        
        # OpenAI SDK path (OpenAI or Anthropic compatibility layer)
        client_kwargs = {"api_key": key}
        if api_base_url:
            client_kwargs["base_url"] = api_base_url
        client = AsyncOpenAI(**client_kwargs)
        
        logger.info(f"LLM call: model={model_name}, base_url={api_base_url or 'OpenAI default'}, has_key={bool(key)}, key_prefix={key[:15] + '...' if key else 'none'}")
        
        # Build messages for OpenAI SDK (system + history + current user message)
        messages = [{"role": "system", "content": enhanced_prompt}]
        if session_id:
            history = _get_session_summary(session_id, max_turns=20)
            if history:
                clean_history = [{"role": msg["role"], "content": msg["content"]} for msg in history]
                messages.extend(clean_history)
        elif last_user_message and last_bot_reply:
            messages.append({"role": "user", "content": last_user_message[:800]})
            messages.append({"role": "assistant", "content": last_bot_reply[:800]})
        messages.append({"role": "user", "content": user_message[:1500]})
        
        # Call OpenAI (or compatibility layer)
        try:
            logger.info(f"Calling LLM API: model={model_name}, base_url={api_base_url or 'default'}, message_count={len(messages)}")
            resp = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=500,
                temperature=0.3,
            )
            logger.info(f"LLM API response received: has_choices={bool(resp.choices)}")
        except Exception as api_error:
            # Extract detailed error info from OpenAI SDK (APIStatusError has status_code/response; APIError has body)
            error_str = str(api_error)
            error_type = type(api_error).__name__
            status_code = None
            error_body = None
            
            if getattr(api_error, 'status_code', None) is not None:
                status_code = api_error.status_code
            if getattr(api_error, 'response', None) is not None:
                r = api_error.response
                if status_code is None and getattr(r, 'status_code', None) is not None:
                    status_code = r.status_code
                try:
                    if callable(getattr(r, 'json', None)):
                        error_body = r.json()
                    elif getattr(r, 'text', None) is not None:
                        error_body = r.text
                except Exception:
                    pass
            if error_body is None and getattr(api_error, 'body', None) is not None:
                error_body = api_error.body
            
            logger.error(f"LLM API call error: {error_type}: {error_str}")
            if status_code:
                logger.error(f"HTTP status: {status_code}")
            if error_body:
                logger.error(f"Error response body: {error_body}")
            
            # Build a more informative error message
            if status_code == 401:
                detailed_error = "Invalid API key. Check your key and try again."
            elif status_code == 404:
                detailed_error = f"Model '{model_name}' or endpoint not found. Check model name and base URL '{api_base_url}'."
            elif status_code == 429:
                detailed_error = "Rate limit exceeded. Try again in a minute."
            elif status_code == 400:
                detailed_error = f"Bad request: {error_str}. Check model name and parameters."
            elif "anthropic" in error_str.lower() or "claude" in error_str.lower():
                detailed_error = f"Claude API error: {error_str}"
            else:
                detailed_error = error_str
            
            # Create a more informative exception for raise_on_failure
            if raise_on_failure:
                raise ValueError(detailed_error) from api_error
            # Re-raise original for outer handler
            raise
        
        if resp.choices and resp.choices[0].message and resp.choices[0].message.content:
            reply = resp.choices[0].message.content.strip()
            
            # Store in session
            if session_id:
                _add_to_session(session_id, "user", user_message)
                _add_to_session(session_id, "assistant", reply)
            
            logger.info("LLM call succeeded")
            return reply
        else:
            logger.warning("LLM call returned empty response")
            if raise_on_failure:
                raise ValueError("API returned an empty response. Check model name and base URL.")
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        error_msg = str(e)
        logger.error("Help chat LLM call failed, using rule-based bot: %s", error_msg)
        logger.error("Full traceback:\n%s", error_details)
        # Log specific error types for debugging
        if "401" in error_msg or "unauthorized" in error_msg.lower():
            logger.error("API key authentication failed - check if key is valid")
        elif "404" in error_msg or "not found" in error_msg.lower():
            logger.error("Model or endpoint not found - check model name and base URL")
        elif "rate limit" in error_msg.lower() or "429" in error_msg:
            logger.error("Rate limit exceeded")
        elif "anthropic" in error_msg.lower() or "claude" in error_msg.lower():
            logger.error("Claude API specific error - check compatibility layer")
        if raise_on_failure:
            raise
    return None


def _ticket_with_user(ticket: dict, user: Optional[User]) -> dict:
    """Add user_id and email to ticket when user is authenticated."""
    if user is not None:
        ticket["user_id"] = getattr(user, "id", None) or getattr(user, "user_id", None)
        ticket["email"] = getattr(user, "email", None)
    return ticket


@router.post("/chat")
async def chat(
    request: Request,
    body: ChatMessageBody,
    user: Optional[User] = Depends(get_current_user_optional),
):
    """System-knowledge support bot with full conversation history and enhanced troubleshooting."""
    # Trim and reject empty/whitespace-only messages
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Please type a message.")
    
    # Generate session ID: user_id if authenticated, IP if not
    session_id = body.session_id
    if not session_id:
        if user and hasattr(user, "id"):
            session_id = f"user_{user.id}"
        elif request.client:
            session_id = f"ip_{request.client.host}"
    
    # Cleanup old sessions periodically (every 100 requests, ~1% chance)
    if random.random() < 0.01:
        _cleanup_old_sessions()
    
    # Rate limit: 30 requests per minute per user or IP
    rate_key = (str(user.id) if user and getattr(user, "id", None) is not None else None) or (str(getattr(user, "user_id", None)) if user else None) or (getattr(request.client, "host", None) if getattr(request, "client", None) and request.client else None) or "unknown"
    if not _check_chat_rate_limit(rate_key):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a minute before sending more.")

    # When user wants to report an AI shortcoming (so dev can refine the assistant)
    if _is_report_gap_intent(msg, body.last_bot_reply):
        _ensure_seed_data()
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        ticket_id = f"TICKET-{uuid.uuid4().hex[:6].upper()}"
        desc_parts = [
            "[AI shortcoming / gap report] User reported that the assistant did not know the answer or could not help. Use this for debugging and refining the feature.\n\n"
        ]
        if body.last_user_message:
            desc_parts.append(f"Question/topic the AI couldn't answer: {body.last_user_message[:800]}\n\n")
        if body.last_bot_reply:
            desc_parts.append(f"What the assistant replied: {body.last_bot_reply[:800]}\n\n")
        if session_id:
            history = _get_session_summary(session_id, max_turns=6)
            if history:
                desc_parts.append("Recent conversation:")
                for msg_entry in history:
                    role = msg_entry["role"].upper()
                    content = msg_entry["content"][:250]
                    desc_parts.append(f"\n[{role}]: {content}")
        if user:
            desc_parts.append(f"\n\nUser: {getattr(user, 'email', 'Unknown')}")
            desc_parts.append(f"Role: {getattr(user, 'role', 'Unknown')}")
        ticket = {
            "id": ticket_id,
            "title": "AI shortcoming / gap report (live chat)",
            "description": "".join(desc_parts),
            "status": "open",
            "priority": "medium",
            "category": "technical",
            "createdAt": now,
            "updatedAt": now,
            "assignedTo": None,
        }
        _ticket_with_user(ticket, user)
        _tickets.append(ticket)
        logger.info("Live chat: created AI gap report ticket %s for user", ticket_id)
        reply = (
            f"Your report has been created so the team can improve the assistant. Reference: {ticket_id}. "
            "You can view it in Help & Support → Support Tickets. Is there anything else I can do?"
        )
        _log_conversation(
            user_message=msg,
            bot_reply=reply,
            was_handled=True,
            escalated=True,
            user_id=str(user.id) if user and hasattr(user, "id") else None,
            session_id=session_id
        )
        return {"reply": reply, "escalated": True, "ticket_created": True, "ticket_id": ticket_id}

    # When user asks to create a ticket
    if _is_create_ticket_intent(msg, body.last_bot_reply):
        _ensure_seed_data()
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        ticket_id = f"TICKET-{uuid.uuid4().hex[:6].upper()}"
        desc_parts = ["User requested support via live chat."]
        
        # Include full conversation history if session exists
        if session_id:
            history = _get_session_summary(session_id, max_turns=10)
            if history:
                desc_parts.append("\n\nFull conversation history:")
                for msg_entry in history:
                    role = msg_entry["role"].upper()
                    content = msg_entry["content"][:300]
                    desc_parts.append(f"\n[{role}]: {content}")
        
        if body.last_user_message:
            desc_parts.append(f"\nLast user message: {body.last_user_message[:500]}")
        if body.last_bot_reply:
            desc_parts.append(f"\nLast bot reply: {body.last_bot_reply[:500]}")
        desc_parts.append(f"\nCurrent message: {msg[:500]}")
        
        # Also include user context
        if user:
            desc_parts.append(f"\n\nUser: {getattr(user, 'email', 'Unknown')}")
            desc_parts.append(f"Role: {getattr(user, 'role', 'Unknown')}")
        
        ticket = {
            "id": ticket_id,
            "title": "Live chat: support request",
            "description": "".join(desc_parts),
            "status": "open",
            "priority": "medium",
            "category": "technical",
            "createdAt": now,
            "updatedAt": now,
            "assignedTo": None,
        }
        _ticket_with_user(ticket, user)
        _tickets.append(ticket)
        logger.info("Live chat: created ticket %s for user", ticket_id)
        reply = f"Your support ticket has been created. Your reference: {ticket_id}. Is there anything else I can do for you today?"
        
        # Log conversation
        _log_conversation(
            user_message=msg,
            bot_reply=reply,
            was_handled=True,
            escalated=True,
            user_id=str(user.id) if user and hasattr(user, "id") else None,
            session_id=session_id
        )
        
        return {"reply": reply, "escalated": True, "ticket_created": True, "ticket_id": ticket_id}

    # Try real LLM first when API key is set
    body_dict = body.model_dump()
    logger.info(f"Chat request: has_api_key={bool(body.openai_api_key)}, model={body.model}, base_url={body.base_url}")
    logger.info(f"Chat request body fields: {list(body_dict.keys())}")
    logger.info(f"Chat request body values: openai_api_key={'***' if body.openai_api_key else None}, model={body_dict.get('model')}, base_url={body_dict.get('base_url')}")
    
    # Debug: Check if base_url is actually in the request
    if 'base_url' not in body_dict and body.base_url:
        logger.warning(f"base_url field mismatch: body.base_url={body.base_url} but not in dict")
    llm_reply = await _chat_reply_llm(
        msg,
        session_id=session_id,
        last_user_message=body.last_user_message,
        last_bot_reply=body.last_bot_reply,
        api_key=body.openai_api_key,
        user=user,
        model=body.model,  # Pass model from request
        base_url=body.base_url,  # Pass base_url from request
    )
    if llm_reply:
        logger.info("LLM response received successfully")
        model_id = body.model or _HELP_CHAT_LLM_MODEL
        model_display_name = _model_display_name(model_id)
        # First successful LLM reply in this session: prepend confirmation greeting (unless UI already showed it after validation)
        final_reply = llm_reply
        already_shown = getattr(body, "greeting_already_shown", None) is True
        if session_id and not _session_greeting_sent.get(session_id):
            _session_greeting_sent[session_id] = True
            if not already_shown:
                greeting = f"Hi, I'm your {model_display_name} Proper 2.9 AI agent.\n\n"
                final_reply = greeting + llm_reply
                logger.info("Chat: first LLM reply in session, prepended greeting for model=%s", model_display_name)
        # Log conversation (log the final reply shown to user)
        _log_conversation(
            user_message=msg,
            bot_reply=final_reply,
            was_handled=True,
            escalated=False,
            user_id=str(user.id) if user and hasattr(user, "id") else None,
            session_id=session_id
        )
        return {"reply": final_reply, "escalated": False, "model_display_name": model_display_name}

    # Client sent an API key but LLM failed: do NOT use rule-based preset — return an error message
    if (body.openai_api_key or "").strip():
        logger.warning("LLM call returned None but client sent API key - not using rule-based bot")
        err_reply = "The AI couldn't respond right now. Please check your connection and try again, or open the chat config (gear) to re-test the API."
        return {"reply": err_reply, "escalated": False}

    logger.warning("LLM call returned None - falling back to rule-based bot")

    # Fallback to rule-based bot (only when no API key was sent)
    reply_text, handled = _chat_reply(
        msg,
        last_user_message=body.last_user_message,
        last_bot_reply=body.last_bot_reply,
        session_id=session_id,
    )
    
    # Store rule-based reply in session (same as LLM path)
    if session_id and handled:
        _add_to_session(session_id, "user", msg)
        _add_to_session(session_id, "assistant", reply_text)
    
    # Log conversation
    _log_conversation(
        user_message=msg,
        bot_reply=reply_text if handled else None,
        was_handled=handled,
        escalated=not handled,
        user_id=str(user.id) if user and hasattr(user, "id") else None,
        session_id=session_id
    )
    
    if handled:
        return {"reply": reply_text, "escalated": False}

    # Escalate: create a ticket with full context
    _ensure_seed_data()
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    ticket_id = f"TICKET-{uuid.uuid4().hex[:6].upper()}"
    
    desc_parts = ["User requested help via live chat. Their message:\n\n"]
    desc_parts.append(f'"{msg}"\n\n')
    
    # Include full conversation history if session exists
    if session_id:
        history = _get_session_summary(session_id, max_turns=10)
        if history:
            desc_parts.append("Full conversation history:\n")
            for msg_entry in history:
                role = msg_entry["role"].upper()
                content = msg_entry["content"][:300]
                desc_parts.append(f"\n[{role}]: {content}")
    
    if user:
        desc_parts.append(f"\n\nUser: {getattr(user, 'email', 'Unknown')}")
        desc_parts.append(f"Role: {getattr(user, 'role', 'Unknown')}")
    
    desc_parts.append("\n\nA representative should reach out within 2 business hours.")
    
    escalation_ticket = {
        "id": ticket_id,
        "title": "Live chat escalation: support follow-up",
        "description": "".join(desc_parts),
        "status": "open",
        "priority": "medium",
        "category": "technical",
        "createdAt": now,
        "updatedAt": now,
        "assignedTo": None,
    }
    _ticket_with_user(escalation_ticket, user)
    _tickets.append(escalation_ticket)
    logger.info("Live chat escalation: created ticket %s for user message", ticket_id)
    reply = ESCALATION_REPLY.format(ticket_id=ticket_id)
    
    # Log conversation
    _log_conversation(
        user_message=msg,
        bot_reply=reply,
        was_handled=False,
        escalated=True,
        user_id=str(user.id) if user and hasattr(user, "id") else None,
        session_id=session_id
    )
    
    return {"reply": reply, "escalated": True}
