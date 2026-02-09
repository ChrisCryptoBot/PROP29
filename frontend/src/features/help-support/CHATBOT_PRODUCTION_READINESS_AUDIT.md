# Live Chat Bot — Production Readiness Audit

**Date:** 2025-02  
**Scope:** Live chat (LiveChatPanel, helpSupportService, chatBotFallback, backend `/help/chat`)

---

## Executive summary

| Area | Status | Notes |
|------|--------|--------|
| **Core flow** | ✅ Ready | Quick-start, context, ticket creation, wrap-up with Start new / Close |
| **Copy & tone** | ⚠️ Tweak | One dev-oriented string; rest is user-friendly |
| **Accessibility** | ⚠️ Improve | Add aria-live for new messages; optional focus trap |
| **Errors & offline** | ⚠️ Improve | Silent fallback; add gentle “using built-in help” when offline |
| **Security** | ✅ OK | No HTML injection; backend max length; no PII in logs beyond ticket |
| **Performance** | ✅ OK | No heavy work; context is last 2 messages only |
| **Real-life readiness** | ✅ Yes, with small fixes | Suitable for real users after copy + a11y + offline UX tweaks below |

---

## 1. User flow (high level)

```mermaid
flowchart TD
  A[User: Help & Support → Live Chat] --> B[Chat opens: welcome + quick-start options]
  B --> C{User action}
  C -->|Click option| D[Send message → Bot reply + 3 follow-up buttons]
  C -->|Type question| D
  C -->|Create a ticket| E[Backend creates ticket → "Ticket created. Anything else?"]
  D --> F{Continue or end?}
  E --> G[User says "no" / "nah"]
  G --> H[Wrap-up: "Start new convo or close" + Start new / Close buttons]
  F -->|Say "no" after "Anything else?"| H
  F -->|Keep chatting| D
  H --> I[Start new → reset to welcome | Close → panel closes]
```

**Same flow (text):**

```
User opens Help & Support → clicks "Live Chat"
    → Chat opens: welcome + "What do you need help with?" + 8 quick-start options
    → User clicks option / types question / types "Create a ticket"
    → Bot replies (API or fallback). After each reply: [ What next? ] [ Still not working ] [ Create a ticket ]
    → If "Create a ticket": backend creates ticket; "Ticket created. Your reference: TICKET-XXX. Anything else?"
    → User says "no" / "nah" after "Anything else?" → Wrap-up: "Start new conversation or close the chat" + [Start new] [Close]
    → Start new → reset to welcome + quick-start. Close → panel closes.
    → Unclear question → backend creates escalation ticket; user gets ticket ID.
```

---

## 2. Checklist (what was scrutinized)

### 2.1 Functionality

- [x] Quick-start options show when no user message yet; hide after first send
- [x] Clicking quick-start sends that message and gets a reply
- [x] Conversation context (last user + last bot) sent to API and fallback
- [x] Follow-up replies are context-aware (“it didn’t work”, “what next?”, “yes”/“no”)
- [x] “Create a ticket” / “escalate” (or “yes” after ticket suggestion) → backend creates ticket and returns “Ticket created. Anything else?”
- [x] “No” / “nah” after “Anything else?” → wrap-up with “Start new conversation or close the chat”
- [x] Wrap-up shows [Start new conversation] and [Close]; Start resets to welcome; Close closes panel
- [x] Unhandled messages → backend creates escalation ticket and returns ticket ID
- [x] Offline: fallback replies used; “Create a ticket” explains we can’t create while offline and points to New Ticket

### 2.2 Copy & tone

- [x] Welcome and bot replies are clear and professional
- [ ] **FIX:** `FALLBACK_REPLY` says “start the backend” — not for end users (see fixes below)
- [x] Emergency / life-safety always directs to Contact Support (call/email)
- [x] Expectations set: 2 business hours for tickets; immediate answers from bot

### 2.3 UX

- [x] Panel is narrow, bottom-right; user can keep using the page
- [x] Send on Enter (no Send on Shift+Enter); input disabled while sending
- [x] “Typing...” while waiting for reply
- [x] Scroll to bottom on new messages
- [ ] **IMPROVE:** When reply came from fallback, user isn’t told (could show a short “Using built-in help” note)

### 2.4 Accessibility

- [x] `role="dialog"` and `aria-label="Live chat — IT Support"`
- [x] Close and Send have `aria-label`
- [ ] **IMPROVE:** New messages not announced to screen readers; add `aria-live="polite"` on messages area
- [ ] **OPTIONAL:** Focus trap inside dialog (floating widget often omits this by design)

### 2.5 Security & data

- [x] User message rendered as text only (no `dangerouslySetInnerHTML`) — no XSS from content
- [x] Backend: `message` max length 2000
- [x] Ticket creation stores conversation snippet in ticket description (for support); no extra PII beyond what user sent
- [ ] **RECOMMEND:** Rate-limit `/help/chat` per user in production (e.g. 30 req/min) to prevent abuse

### 2.6 Edge cases

- [x] Empty message: trimmed and not sent
- [x] Double-submit: `sending` blocks further sends and disables buttons
- [x] Very long threads: only last user + last bot sent as context (by design)
- [x] Multiple agent messages: only the one containing wrap-up text shows [Start new] [Close]

### 2.7 Backend

- [x] Create-ticket intent detected before `_chat_reply`; ticket created with context in description
- [x] Escalation (unhandled) creates ticket and returns ticket ID
- [x] All reply text is server-controlled (no user content in bot reply)

---

## 3. Fixes applied (or to apply)

1. **Production copy**  
   Replace `FALLBACK_REPLY` with user-facing text, e.g.:  
   *“We’re having trouble reaching the support server right now. You’re seeing answers from our built-in assistant. For a live agent or to create a ticket, try again in a moment or go to Help & Support → Support Tickets.”*

2. **Offline / fallback indicator**  
   When the last reply came from fallback (API returned null), show a short, subtle line under the reply:  
   *“You’re seeing built-in help. For a live agent, try again later or create a ticket in Support Tickets.”*

3. **Accessibility**  
   Add `aria-live="polite"` to the messages container so new messages are announced to screen readers.

4. **Optional**  
   - Rate-limit `POST /help/chat` per user (e.g. 30/min).  
   - Focus trap when panel is open (optional for a non-modal widget).

---

## 4. Screens to verify manually (and optional screenshots for docs)

| # | Scenario | What to check | Screenshot idea |
|---|----------|--------------|-----------------|
| 1 | Open chat | Help & Support → Live Chat; welcome + “What do you need help with?” + 8 quick-start buttons | Full panel, first-open state |
| 2 | Quick-start | Click “Report an incident”; user bubble + bot reply + [What next?] [Still not working] [Create a ticket] | One exchange + follow-up buttons |
| 3 | Create ticket | Click “Create a ticket”; reply “I've created a support ticket… Your reference: TICKET-XXX. Anything else?” | Message showing ticket ID |
| 4 | Wrap-up | Reply “no”; message “Start new conversation or close the chat” + [Start new conversation] [Close] | Wrap-up state |
| 5 | Start new | Click Start new conversation; back to welcome + quick-start | Reset state |
| 6 | Close | Click Close; panel closes | N/A |
| 7 | Offline | Stop backend; send message; fallback reply + “You’re seeing built-in help…” note at bottom | Offline / fallback state |

Use these for QA sign-off and, if needed, for training or support docs.

---

## 5. Verdict

**Ready for real-life use with real people** once:

1. Production fallback copy is in place.  
2. Optional but recommended: fallback indicator and `aria-live` for new messages.  
3. Before high traffic: add rate limiting on `/help/chat`.

The flow is clear, ticket creation and wrap-up work, and the bot’s scope and limitations are documented in `LIVE_CHAT_BOT_KNOWLEDGE.md`.
