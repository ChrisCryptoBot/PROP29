# Live Chat Bot — What It Knows

This document lists everything the live chat bot is designed to know and respond to, so product and support can align on behavior and gaps. The same logic lives in the **backend** (`backend/api/help_support_endpoints.py`, `_chat_reply`) and the **client fallback** (`frontend/.../utils/chatBotFallback.ts`) when the API is unreachable.

---

## 1. Identity & meta

- **What the bot is**: In-app support assistant; rule-based (not generative AI); trained on the platform; no live data access; cannot perform actions (e.g. create incident, lock door)—only guides the user.
- **What Proper 2.9 is**: Hotel/property security management platform (desktop console); who it’s for (security managers, officers, patrol agents, front desk, valet).
- **Bot limitations**: No live data; no performing actions; no hardware fix; no permission/role changes; fixed knowledge; escalates when unclear or out-of-scope.
- **System limitations**: Depends on hardware/network; role-based features; integrations may be limited; desktop vs mobile; backend/sync.
- **What the bot can do**: Explain modules and workflows; explain how modules interact; troubleshoot common issues (login, camera offline, app sync, door); point to Support Tickets, Contact Support, Help Center, Resources.
- **Expectations**: Immediate answers from bot; on escalation, ticket created and rep within 2 business hours; urgent → Contact Support (call/email).
- **Who uses the system**: Role determines which modules/user sees; Profile Settings for own profile; admin grants access.

---

## 2. Greetings & conversation

- **Hello / hi / hey / good morning / good afternoon**: Short intro, what the bot can do, and suggestions (e.g. “what are you”, “incident workflow”).
- **Thanks / bye**: “You’re welcome; ask anytime.”
- **Follow-ups (context-aware)**:
  - “It didn’t work” / “still not working” → Uses last bot reply to give next step (camera → ticket; patrol/app → restart app, network, ticket; door/access → ticket or physical keys; login → admin reset or Contact Support).
  - “What next?” / “and then” / “next step” → Context: incident (assign team); patrol (officer runs on app); ticket (wait for response).
  - “Yes” / “please” (after ticket/escalation) → How to create ticket.
  - “No” / “something else” → Invite to pick another topic or type question.
  - “Need more detail” / “explain more” → Ask user to be specific (screen, action).
  - “Create a ticket” / “escalate” → Steps to New Ticket + Contact Support for urgent.

---

## 3. Full system & workflows

- **How modules work together**: Incident Log, Patrol (+ mobile app), Access Control (lockdown), SOC/cameras, Guest Safety, Visitor Security, Banned Individuals, IoT, Digital Handover, Property Items (lost & found, packages), lockers, parking; how they connect.
- **Incident workflow**: Report (New Incident or from patrol app) → Review Queue → Assign to team → Guest Safety if guest-related → Resolution.
- **Patrol workflow**: Setup routes/checkpoints → Assign officers → Run on mobile app, check in at checkpoints → Report incident from app → Complete.
- **Lockdown workflow**: Access Control → Lockdown tab → all configured doors lock; disable to unlock.
- **Visitors and access**: Visitor Security check-in can grant temporary access; revoked on check-out; tie to Access Control.
- **Banned detection**: Watchlist → detection (camera/kiosk) → alert/detection record → security response; false positives in Banned Individuals.
- **Camera and incident**: SOC for view/recordings; create incident manually; camera offline = troubleshoot or ticket.
- **Guest Safety and incident**: Assign incident to team → team uses Guest Safety (evacuation, mass notification, messages).
- **Handover workflow**: Create handover (template), checklist/notes → complete → next shift; Tracking tab.
- **Lost & found workflow**: Register item → match to reports → claim; packages; Smart Lockers.
- **IoT alert workflow**: Sensors and thresholds → alert when exceeded → Alerts tab acknowledge/resolve; sensor offline = ticket.

---

## 4. Topic-specific (where to click, what to do)

- **Password / login / 2FA**: Forgot password on login page; admin reset; locked out → admin unlock in System Administration → Users; 2FA → Profile Settings → Security.
- **Profile**: Profile Settings → Personal Info (name, email, phone, company email, employee ID, emergency contact, picture); Work Details.
- **Emergency**: Incident Log → Emergency Alert; Contact Support for immediate; Access Control → Lockdown if needed.
- **Can’t see module / no access**: Role may not include it; admin must grant in System Administration or Account Settings.
- **Door/reader not working**: Access Control → Access Points; check Users for access; hardware → Support Ticket; physical keys or Contact Support for immediate.
- **Incidents**: Incident Log → New Incident (location, severity, description, assign); Emergency Alert for emergencies.
- **Review Queue**: Incident Log → Review Queue; approve/reject; Settings for auto-approval/escalation.
- **Access Control**: Overview, Access Points, Users, Lockdown, Configuration (timeouts, biometrics).
- **Cameras / SOC**: Live view, tiles; camera offline → refresh stream, device health, then ticket; recordings in SOC.
- **Patrol**: Patrol Command Center; routes/checkpoints; assign officers; mobile app to run patrols.
- **Guest Safety**: Incidents, Evacuation, Mass Notification, Messages.
- **Visitors / Banned**: Visitor Security (register, check-in/out); Banned Individuals (watchlist, detections).
- **IoT**: Sensors tab, Settings for thresholds, Alerts tab.
- **Handover**: Digital Handover → Management, Tracking, Equipment, Settings/templates.
- **Lost & found / Property items**: Register, match, packages; Smart Lockers; locker issues → ticket.
- **Parking**: Spaces, occupancy, valet; sensor issues → IoT/device or ticket.
- **Support tickets**: Help & Support → Support Tickets → New Ticket (title, description, priority, category); 2 business hours.
- **Help / documentation**: Help & Support (Overview, Help Center, Support Tickets, Contact Support, Resources—manual, app links, API, videos).
- **Admin / roles / permissions**: System Administration (users, roles, properties, audit); no access = admin grants role.
- **Account settings**: Team, integrations; Profile Settings for self, 2FA, sessions.
- **Mobile app**: Help & Support → Resources (download); same credentials; patrol, incidents, alerts; login/sync issues → ticket.

---

## 5. Quick-start options (first open)

When the chat first opens, the user can click one of:

- Password / Login  
- Report an incident  
- Camera offline  
- How patrols work  
- Access & lockdown  
- Create a ticket  
- How modules connect  
- Something else  

Clicking sends that message and the bot replies; follow-up suggestions (e.g. “What next?”, “Still not working”, “Create a ticket”) appear after each bot message.

---

## 6. Out of scope

- Unclear or very specific/config questions → bot escalates (creates ticket, suggests Contact Support for urgent).
- Life-safety or urgent → always direct to Contact Support (call/email), not chat.

---

## Updating the bot

- **Backend**: Edit `_chat_reply()` in `backend/api/help_support_endpoints.py`; add or adjust keyword checks and return `(reply_text, True)` for handled, `("", False)` for escalate.
- **Fallback**: Edit `getChatReplyFallback()` in `frontend/src/features/help-support/utils/chatBotFallback.ts`; keep the same intent order (follow-ups first, then greetings, identity, workflows, topic-specific, catch-all).
- **Quick-start options**: Edit `QUICK_START_OPTIONS` in `LiveChatPanel.tsx`.
- **Suggested follow-ups**: Edit `SUGGESTED_FOLLOW_UPS` in `LiveChatPanel.tsx`.
