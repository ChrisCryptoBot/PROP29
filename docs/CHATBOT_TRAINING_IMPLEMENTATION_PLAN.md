# IT Chatbot Training Implementation Plan
## Addressing Critical Gaps for Admin Dashboard Scope

**Current Scope:** Admin dashboard only (admins/managers have full access)  
**Future Scope:** Mobile app, front desk interface (out of scope for now)

---

## P0 CRITICAL GAPS (Implement First)

### 1. Multi-Turn Conversation History (CRITICAL)

**Problem:** Bot only receives 1 previous exchange (last_user_message + last_bot_reply), losing context after 2-3 turns.

**Current Implementation:**
```python
# backend/api/help_support_endpoints.py:808-810
if last_user_message and last_bot_reply:
    messages.append({"role": "user", "content": last_user_message[:800]})
    messages.append({"role": "assistant", "content": last_bot_reply[:800]})
```

**Solution: Implement Conversation Session Management**

#### A. Add Conversation History Storage

```python
# backend/api/help_support_endpoints.py

from typing import Dict, List
from datetime import datetime, timedelta
import json

# In-memory conversation sessions (replace with DB/Redis in production)
_conversation_sessions: Dict[str, List[Dict]] = {}
_session_timeout = timedelta(hours=1)

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
```

#### B. Update LLM Function to Use Full History

```python
async def _chat_reply_llm(
    user_message: str,
    session_id: Optional[str] = None,  # NEW: session identifier
    last_user_message: Optional[str] = None,  # Keep for backward compat
    last_bot_reply: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """Call OpenAI with full conversation history."""
    key = (api_key or _HELP_CHAT_LLM_API_KEY or "").strip()
    if not key:
        return None
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=key,
            base_url=_HELP_CHAT_LLM_BASE_URL if _HELP_CHAT_LLM_BASE_URL else None,
        )
        
        messages = [{"role": "system", "content": _HELP_CHAT_SYSTEM_PROMPT}]
        
        # NEW: Use session history if available
        if session_id:
            history = _get_session_summary(session_id, max_turns=5)
            if history:
                messages.extend(history)
        # Fallback to single-turn for backward compat
        elif last_user_message and last_bot_reply:
            messages.append({"role": "user", "content": last_user_message[:800]})
            messages.append({"role": "assistant", "content": last_bot_reply[:800]})
        
        messages.append({"role": "user", "content": user_message[:1500]})
        
        resp = await client.chat.completions.create(
            model=_HELP_CHAT_LLM_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.3,
        )
        
        if resp.choices and resp.choices[0].message and resp.choices[0].message.content:
            reply = resp.choices[0].message.content.strip()
            
            # NEW: Store in session
            if session_id:
                _add_to_session(session_id, "user", user_message)
                _add_to_session(session_id, "assistant", reply)
            
            return reply
    except Exception as e:
        logger.warning("Help chat LLM call failed, using rule-based bot: %s", e)
    return None
```

#### C. Update Chat Endpoint to Generate Session ID

```python
@router.post("/chat")
async def chat(
    request: Request,
    body: ChatMessageBody,
    user: Optional[User] = Depends(get_current_user_optional),
):
    # Generate session ID: user_id if authenticated, IP if not
    session_id = None
    if user and hasattr(user, "id"):
        session_id = f"user_{user.id}"
    elif request.client:
        session_id = f"ip_{request.client.host}"
    
    # Cleanup old sessions periodically (every 100 requests)
    if random.random() < 0.01:  # 1% chance
        _cleanup_old_sessions()
    
    # ... existing code ...
    
    # Update LLM call to include session_id
    llm_reply = await _chat_reply_llm(
        msg,
        session_id=session_id,  # NEW
        last_user_message=body.last_user_message,
        last_bot_reply=body.last_bot_reply,
        api_key=body.openai_api_key,
    )
    
    # ... rest of function ...
```

#### D. Frontend: Maintain Session ID

```typescript
// frontend/src/features/help-support/services/helpSupportService.ts

let sessionId: string | null = null;

function getOrCreateSessionId(): string {
    if (!sessionId) {
        // Use user ID if available, otherwise generate UUID
        const userId = getStoredUserId(); // Implement based on your auth
        sessionId = userId ? `user_${userId}` : `anon_${crypto.randomUUID()}`;
        // Store in sessionStorage so it persists during session
        sessionStorage.setItem('help_chat_session_id', sessionId);
    }
    return sessionId;
}

export async function sendChatMessage(
  message: string,
  context?: ChatContext
): Promise<ChatReply | null> {
  try {
    const openaiKey = getStoredOpenAIKey();
    const sessionId = getOrCreateSessionId();
    
    const res = await apiService.post<ChatReply>(`${PREFIX}/chat`, {
      message,
      session_id: sessionId,  // NEW
      last_user_message: context?.lastUserMessage,
      last_bot_reply: context?.lastBotReply,
      ...(openaiKey ? { openai_api_key: openaiKey } : {})
    });
    
    // ... rest of function ...
  }
}
```

**Impact:** Bot remembers full conversation context for troubleshooting flows.

---

### 2. Error Message → Fix Mapping (CRITICAL)

**Problem:** Users quote error messages but bot has no mapping to solutions.

**Solution: Create Error Message Knowledge Base**

#### A. Create Error Message Database

```python
# backend/api/help_support_endpoints.py

ERROR_MESSAGE_MAP = {
    # Network/Connection Errors
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
        "pattern": r"validation.*error|invalid.*field|required.*field|must be|at least|maximum",
        "cause": "Form field doesn't meet requirements",
        "fix_steps": [
            "Check the red error text below each field",
            "Required fields are marked with *",
            "Common issues:",
            "  - Text too short (e.g. 'First name must be at least 2 characters')",
            "  - Invalid format (e.g. email must be valid@email.com)",
            "  - Number out of range (e.g. severity must be 1-5)",
            "Fix each field and try submitting again"
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
        import re
        if re.search(error_info["pattern"], msg_lower, re.IGNORECASE):
            return error_info
    return None
```

#### B. Integrate Error Matching into Chat Reply

```python
def _chat_reply(user_message: str, last_user_message: Optional[str] = None, last_bot_reply: Optional[str] = None) -> tuple[str, bool]:
    m = user_message.lower().strip()
    
    # NEW: Check for error message first
    error_match = _match_error_message(user_message)
    if error_match:
        fix_text = f"I see you're encountering an error. {error_match['cause']}\n\n"
        fix_text += "Here's how to fix it:\n"
        for i, step in enumerate(error_match['fix_steps'], 1):
            fix_text += f"{i}. {step}\n"
        if error_match.get('escalate_if'):
            fix_text += f"\nIf {error_match['escalate_if']}, create a support ticket."
        return (fix_text, True)
    
    # ... rest of existing _chat_reply logic ...
```

**Impact:** Bot can diagnose and fix issues from quoted error messages.

---

### 3. Offline/Sync State Troubleshooting (CRITICAL)

**Problem:** Bot doesn't know about offline queues, pending operations, sync failures.

**Solution: Add Offline Queue Knowledge**

#### A. Document Offline Queue Behavior

```python
# backend/api/help_support_endpoints.py

OFFLINE_QUEUE_KNOWLEDGE = """
OFFLINE QUEUE SYSTEM:
- When connection is lost, operations automatically queue locally
- Users see yellow "X pending operations" badge
- Failed operations show red "X failed operations" badge
- Operations sync automatically when connection restores
- Each module has its own queue: Access Control, Incident Log, System Admin, etc.

COMMON USER CONFUSIONS:
- "My changes aren't saving" → Actually queued, will save when online
- "I see pending operations" → Normal when offline, will sync automatically
- "Operations failed" → Click "Retry Failed Operations" button
- "How do I check queue?" → Look for badge in module header or OfflineQueueManager component

TROUBLESHOOTING:
1. If user says "changes not saving" → Check if offline banner visible
2. If offline → Explain queue system, operations will sync
3. If online but pending → Check queue status, may need manual flush
4. If failed → Guide to retry button, check error message
"""

# Add to system prompt
_HELP_CHAT_SYSTEM_PROMPT = f"""{_HELP_CHAT_SYSTEM_PROMPT}

{OFFLINE_QUEUE_KNOWLEDGE}
"""
```

#### B. Add Offline Queue Keywords to Chat Reply

```python
def _chat_reply(user_message: str, ...):
    m = user_message.lower().strip()
    
    # NEW: Offline queue troubleshooting
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
            "Operations sync automatically every 30 seconds when online. If operations fail (red badge), click 'Retry Failed Operations' "
            "or check the error message in the queue.",
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
    
    # ... rest of function ...
```

**Impact:** Bot understands and troubleshoots offline queue issues.

---

## P1 HIGH PRIORITY GAPS

### 4. Role-Aware Responses (Simplified for Admin Dashboard)

**Current Scope:** Admins/managers have full access, so role-aware is less critical BUT still useful for:
- Explaining what other roles see (for admin planning)
- Understanding permission errors
- Future-proofing for when other interfaces are added

**Solution:** Add role context to system prompt (simplified)

```python
# backend/api/help_support_endpoints.py

def _get_user_context(user: Optional[User]) -> str:
    """Get user role context for system prompt."""
    if not user:
        return "User is not authenticated."
    role = getattr(user, "role", None) or "unknown"
    return f"User role: {role}. Note: In admin dashboard, admins and managers have full access to all modules."

# Update LLM call
async def _chat_reply_llm(..., user: Optional[User] = None):
    user_context = _get_user_context(user)
    enhanced_prompt = f"""{_HELP_CHAT_SYSTEM_PROMPT}

USER CONTEXT:
{user_context}
"""
    messages = [{"role": "system", "content": enhanced_prompt}]
    # ... rest of function ...
```

**Impact:** Bot can explain role-based features and permission issues.

---

### 5. Cross-Module Navigation Disambiguation

**Problem:** Features exist in multiple places, users get confused.

**Solution:** Add disambiguation knowledge

```python
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
    """Handle "where is X" questions with disambiguation."""
    m = user_message.lower()
    
    for feature, info in NAVIGATION_DISAMBIGUATION.items():
        if feature in m and any(x in m for x in ["where", "how do i find", "location"]):
            reply = f"'{feature.title()}' exists in multiple places:\n\n"
            for i, loc in enumerate(info["locations"], 1):
                reply += f"{i}. {loc}\n"
            reply += "\nWhen to use each:\n"
            for use_case in info["when_to_use"]:
                reply += f"- {use_case}\n"
            return reply
    
    return None
```

**Impact:** Bot explains where features are and when to use each location.

---

### 6. Settings/Configuration Reference

**Problem:** "How do I change X" questions need specific Settings tab guidance.

**Solution:** Document Settings tabs

```python
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
    }
}

# Add to chat reply logic
if "how do i change" in m or "where is the setting" in m:
    for module, info in SETTINGS_REFERENCE.items():
        if module in m:
            reply = f"To change {module} settings:\n\n"
            reply += f"Go to: {info['path']}\n\n"
            reply += "This tab controls:\n"
            for control in info["controls"]:
                reply += f"- {control}\n"
            return (reply, True)
```

**Impact:** Bot knows exactly where each setting is located.

---

### 7. WebSocket/Real-Time Troubleshooting

**Problem:** Dashboard not updating, real-time features broken.

**Solution:** Add WebSocket knowledge

```python
# Add to chat reply
if any(x in m for x in ["dashboard not updating", "not getting updates", "real-time not working", "stale data"]):
    return (
        "If your dashboard isn't updating in real-time, the WebSocket connection may be disconnected. "
        "Real-time features (live incidents, camera updates, patrol status) require WebSocket. "
        "To fix: (1) Refresh the page (F5 or Ctrl+R) to reconnect. (2) Check browser console (F12) for WebSocket errors. "
        "If refreshing doesn't help, check your network connection and firewall settings. WebSocket uses ws:// protocol.",
        True
    )
```

**Impact:** Bot troubleshoots real-time connection issues.

---

### 8. Form Field Validation Reference

**Problem:** Users stuck on form validation, don't know requirements.

**Solution:** Document form requirements

```python
FORM_VALIDATION_REFERENCE = {
    "incident": {
        "required": ["location", "severity", "description"],
        "validation": {
            "description": "Minimum 10 characters",
            "severity": "Must be one of: Low, Medium, High, Critical",
            "location": "Must be selected from dropdown or valid text"
        }
    },
    "user": {
        "required": ["first_name", "last_name", "email", "role"],
        "validation": {
            "first_name": "Minimum 2 characters",
            "last_name": "Minimum 2 characters",
            "email": "Must be valid email format (user@domain.com)",
            "role": "Must be selected from dropdown"
        }
    }
}

# Add to error message matching (already covered in error mapping)
```

**Impact:** Bot can explain form requirements when users are stuck.

---

### 9. Feedback Loop / Analytics

**Problem:** No way to track what bot fails on, improve over time.

**Solution:** Add conversation logging

```python
# backend/api/help_support_endpoints.py

from datetime import datetime
import json

# Simple logging (replace with DB in production)
_conversation_logs: List[Dict] = []

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

# Add logging to chat endpoint
@router.post("/chat")
async def chat(...):
    # ... existing code ...
    
    # Log conversation
    _log_conversation(
        user_message=msg,
        bot_reply=reply_text if handled else None,
        was_handled=handled,
        escalated=not handled,
        user_id=str(user.id) if user and hasattr(user, "id") else None,
        session_id=session_id
    )
    
    # ... rest of function ...

# Add analytics endpoint (for admin dashboard)
@router.get("/chat/analytics")
async def get_chat_analytics(
    user: User = Depends(get_current_user),  # Admin only
):
    """Get conversation analytics for improvement."""
    if getattr(user, "role", None) not in ["admin", "director"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total = len(_conversation_logs)
    handled = sum(1 for log in _conversation_logs if log["was_handled"])
    escalated = sum(1 for log in _conversation_logs if log["escalated"])
    
    # Top escalated topics (simple keyword extraction)
    escalated_messages = [log["user_message"] for log in _conversation_logs if log["escalated"]]
    # ... simple keyword counting ...
    
    return {
        "total_conversations": total,
        "handled_rate": handled / total if total > 0 else 0,
        "escalation_rate": escalated / total if total > 0 else 0,
        "top_escalated_topics": [...]  # Implement keyword extraction
    }
```

**Impact:** Track what bot fails on, prioritize knowledge gaps.

---

### 10. Richer Escalation Tickets

**Problem:** Tickets only include last exchange, support reps need full context.

**Solution:** Include full conversation in ticket

```python
# Update ticket creation in chat endpoint
if _is_create_ticket_intent(msg, body.last_bot_reply):
    # ... existing ticket creation ...
    
    # NEW: Include full conversation history if session exists
    if session_id:
        history = _get_session_summary(session_id, max_turns=10)
        if history:
            desc_parts.append("\n\nFull conversation history:")
            for msg in history:
                role = msg["role"].upper()
                content = msg["content"][:300]  # Truncate long messages
                desc_parts.append(f"\n[{role}]: {content}")
    
    # Also include user context
    if user:
        desc_parts.append(f"\n\nUser: {getattr(user, 'email', 'Unknown')}")
        desc_parts.append(f"Role: {getattr(user, 'role', 'Unknown')}")
    
    ticket["description"] = "".join(desc_parts)
    # ... rest of ticket creation ...
```

**Impact:** Support reps get full context, faster resolution.

---

## IMPLEMENTATION PRIORITY

### Week 1: P0 Critical
1. ✅ Multi-turn conversation history (Session management)
2. ✅ Error message → fix mapping
3. ✅ Offline/sync state troubleshooting

### Week 2: P1 High Priority
4. ✅ Cross-module navigation disambiguation
5. ✅ Settings/configuration reference
6. ✅ WebSocket troubleshooting
7. ✅ Form validation reference

### Week 3: Analytics & Polish
8. ✅ Feedback loop / analytics
9. ✅ Richer escalation tickets
10. ✅ Role-aware responses (simplified)

---

## NOTES FOR FUTURE SCOPE

When mobile app and front desk interfaces are added:
- **Mobile app:** Add mobile-specific troubleshooting (app crashes, sync issues, GPS)
- **Front desk:** Add role-aware responses (front desk can't do admin actions)
- **Multi-property:** Add property switching guidance
- **Hardware troubleshooting:** Expand beyond "create ticket" to deeper diagnosis

---

## TESTING CHECKLIST

- [ ] Bot remembers conversation across 5+ turns
- [ ] Bot recognizes and fixes error messages
- [ ] Bot explains offline queue behavior
- [ ] Bot disambiguates navigation questions
- [ ] Bot knows Settings tab locations
- [ ] Bot troubleshoots WebSocket issues
- [ ] Bot explains form validation
- [ ] Analytics endpoint works
- [ ] Escalation tickets include full context

---

**Last Updated:** 2026-02-06  
**Status:** Implementation Plan - Ready for Development
