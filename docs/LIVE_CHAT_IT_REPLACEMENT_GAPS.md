# Live Chat — Logic Gaps & Edge Cases (IT Replacement)

This doc lists **unaddressed logic**, **edge cases**, and **missing capabilities** so the AI live chat can replace the IT guy as much as possible. The same bot lives in `backend/api/help_support_endpoints.py` (`_chat_reply`, `_dissect_problem`, `_reply_from_dissect`) and `frontend/.../utils/chatBotFallback.ts`.

---

## 1. Context & conversation logic

| Gap | Current behavior | Risk / impact |
|-----|------------------|---------------|
| **Only last turn sent** | API receives `last_user_message` + `last_bot_reply` only; no full history. | Long threads lose context: e.g. "what about the second one?" or "same for door 5" — bot doesn't know there was a first camera/door. |
| **No conversation/session ID** | Each request is stateless; no server-side session. | Can't tie multiple tickets to one conversation; can't say "continuing from your previous question." |
| **No flow state** | Bot doesn't track "we're in camera triage" or "user said they'd try refresh." | User says "done" or "still offline" — bot may not infer they mean "I refreshed, still offline" and suggest the *next* step (ticket) instead of repeating "try refresh." |
| **"Already tried" is keyword-only** | `_dissect_problem` only adds to `already_tried` if user says "already tried", "I tried", "didn't work". | User says "I restarted the app" without "I tried that" — bot may suggest "try restarting the app" again. |

**Recommendations:**  
- Send last N turns (e.g. 3 user + 3 bot) or full thread when using LLM; keep rule-based with last turn for now but add 1–2 optional previous turns.  
- Optional: lightweight flow state (e.g. "camera_triage", "login_recovery") so follow-ups like "done" / "still not working" get the right next step.  
- In dissect, also treat "I restarted", "I refreshed", "we did that" as already_tried.

---

## 2. Intent & understanding

| Gap | Current behavior | Risk / impact |
|-----|------------------|---------------|
| **Typos / slang** | Strict keyword matching; no fuzzy or normalized forms. | "camera is ofline", "loggin issue", "patrol not synk" may miss or hit wrong intent. |
| **Negation** | No handling of "I don't have a camera problem" or "not the door". | Can match "camera" / "door" and give camera/door reply. |
| **Multiple intents in one message** | `_dissect_problem` picks one `topic`; reply addresses one. | "Camera 2 is down and I need to report an incident" — only one topic (often first or last) gets a reply. |
| **Very short messages** | "help", "broken", "not working" — dissect may get no topic; falls to "I'm not sure" or generic. | Good that we don't hallucinate; bad that we don't ask one clarifying question (e.g. "What's broken—camera, door, app, or something else?"). |
| **Procedure vs troubleshooting** | "How do I report an incident?" vs "I reported an incident but it's not showing" — both can hit "incident". | Reply might be generic "go to Incident Log" for both; second needs "check Review Queue / filters / refresh" not just how to report. |
| **Order of checks** | Long flat list of `if any(x in m for x in [...])`. | Broader patterns (e.g. "patrol", "incident") can fire before more specific ones (e.g. "patrol app not syncing"); dissect runs early but topic-specific blocks can still override. |

**Recommendations:**  
- Add negation check: if message has "don't", "not", "no" + topic word, skip that topic or ask "So what *is* the issue?"  
- For 2+ topics in one message: either reply to the first + "You also mentioned [X] — want steps for that too?" or reply to both in one message.  
- For very short unclear messages: single clarifying question ("Is this about a camera, door, login, patrol app, or something else?") instead of going straight to "create a ticket."

---

## 3. Edge cases

| Edge case | Current behavior | Fix / recommendation |
|-----------|------------------|----------------------|
| **Whitespace-only message** | Body has `min_length=1`; "  " can pass. | Trim and reject empty after trim; return 400 or reply "Please type a message." |
| **Very long message** | 2000 char max; truncation in LLM path. | Truncate for rules too (e.g. first 500 chars for keyword matching); mention "I used the first part of your message" if truncated. |
| **Rapid / repeated messages** | No rate limiting on `POST /help/chat`. | Rate limit (e.g. 30 req/min per user or IP) to avoid spam and duplicate tickets. |
| **Same question twice** | No "you already asked this" or "as I said above". | Optional: compare current message to last_user_message; if very similar, reply "Same as before: [one-line recap]. Need a different step?" |
| **Offline + "create a ticket"** | Fallback says "I can't create a ticket while you're offline." | Consider: "When you're back online, say 'Create a ticket' again and I'll create one. Want me to remember this and create it when you're back?" (would need local queue + retry). |
| **Ticket not tied to user** | `POST /help/chat` doesn't use `get_current_user`; ticket has no user_id. | Pass authenticated user (or optional user_id) and store on ticket so support can contact the right person and see history. |
| **PII in ticket** | Ticket description = last user + last bot + current message; may contain names, emails, IDs. | Don't log full description in plaintext in insecure places; optional: redact known PII or warn user. |
| **LLM says "I'll create a ticket"** | Ticket is only created when *rule-based* intent detects "create a ticket" / "escalate" / "yes" after ticket suggestion. | If LLM replies "I'll create a ticket for you" but endpoint doesn't create it, user gets wrong expectation. Either: (1) have LLM return a structured action (e.g. `create_ticket: true`) and endpoint creates it, or (2) system prompt: "Never say you will create a ticket; say 'Say **create a ticket** and I will create one for you.'" |

---

## 4. Missing “IT guy” capabilities

| Capability | Why it matters |
|------------|----------------|
| **No live data** | Bot can't say "I see camera 3 is offline" or "your last login failed at 2pm." Real IT has dashboard; bot only has fixed knowledge. |
| **No read-only API** | Even read-only (e.g. list offline cameras, last login attempt) would allow "First, I see these 3 cameras are offline — which one are you asking about?" and fewer tickets. |
| **No action execution** | Can't create incident, refresh stream, or reset password for the user — only guides. To replace IT more: consider narrow, audited actions (e.g. "Create incident with title X" after user confirms). |
| **No guided wizards** | High-volume flows (login recovery, camera triage, create ticket) could be step-by-step: "Are you on the login page? Do you see 'Forgot password'?" with simple state machine. |
| **No "have you tried X?" before escalate** | We have already_tried in dissect, but we could explicitly ask "Have you tried refreshing the stream?" before "create a ticket" when topic is camera and we haven't suggested refresh yet. |
| **Sound / analytics / export** | If the app has Sound Monitoring, Analytics, or "export report", the bot has no or minimal coverage — add keywords and one-line steps. |
| **"Where is the [button/label]?"** | Partially covered by "where is" in help; could add explicit "Where is the lockdown button?" → "Access Control → Lockdown tab, top of the page." |
| **Export / reports** | "How do I export incident report?" not clearly in bot — add. |
| **Notifications** | "How do I get notified when…?" — point to module Settings or Notifications; add if missing. |
| **Integrations** | "Does it work with [PMS]?" — only "integrations may be limited"; no list of known integrations or "ask your account manager." |
| **Version / config** | "We're on 2.9, does that have X?" — not addressed; could add "Proper 2.9 includes [list]. For your exact build, check Help & Support → About or ask support." |
| **Multi-property** | "I have 3 properties, how do I switch?" — Account Settings says "property in header"; could add one sentence: "Use the property selector in the header to switch." |

---

## 5. Safety & escalation

| Item | Current behavior | Recommendation |
|------|------------------|----------------|
| **Emergency** | Correct: Contact Support + Emergency Alert; don't rely on chat. | Keep; optionally if message contains "emergency" or "urgent" + life-safety words, prepend "If this is an emergency, use Contact Support to call now. Otherwise: " and then reply. |
| **Abuse** | No rate limiting. | Rate limit per user/IP; optional: cap tickets per user per day. |
| **Urgency in sentence** | "This is urgent" in the middle of a message doesn't change reply. | If "urgent" or "asap" in message and we're about to give a long procedure, add "If you need someone now, use Contact Support to call." |

---

## 6. Consistency (backend vs frontend fallback)

| Risk | Recommendation |
|------|----------------|
| **Drift** | New intents or replies added only in backend (or only in fallback) → different behavior online vs offline. | Single source of truth: either (1) generate fallback from backend rules (e.g. export JSON), or (2) checklist in PR: "help_support_endpoints.py + chatBotFallback.ts updated together." |
| **LLM vs rules** | When LLM is used, tone and steps can differ from rule-based; LLM might say "I'll create a ticket" without endpoint creating it. | See edge case above: structured action for create_ticket, or strict system prompt. |

---

## 7. Quick wins (high impact, low effort)

**Implemented (done):**
1. **Trim and reject empty/whitespace** — Backend returns 400 with "Please type a message."; frontend fallback returns "Please type a message." for empty; UI already skips send when trimmed message is empty.
2. **Negation** — `_has_negation_near()` in backend and `hasNegationNear()` in frontend; topic cleared when user says "don't"/"not" near the topic word.
3. **"Already tried"** — Backend and frontend now treat "i restarted", "i refreshed", "we did that", "we restarted", "we refreshed" as triggers for already_tried extraction.
4. **Ticket tied to user** — `POST /help/chat` and escalation tickets store `user_id` and `email` when user is authenticated; `POST /tickets` also stores them.
5. **One clarifying question** — Messages with ≤3 words and no inferred topic get: "Is this about: a camera or feed, a door/access, login, the patrol app, reporting an incident, or something else?…"
6. **Rate limit** — `POST /help/chat` limited to 30 requests per minute per user (or IP when unauthenticated); returns 429 with "Too many messages. Please wait a minute."
7. **LLM create_ticket** — System prompt updated: "Never say that you will create a ticket or that you have created a ticket. Only the user can trigger ticket creation by saying 'create a ticket' or 'escalate'. If they want a ticket, say: 'Say **create a ticket** and I'll create one for you.'"

---

## 8. Medium-term (replace IT further)

1. **Send last 2–3 turns** to API and use in rule-based follow-ups (e.g. "still not working" + last bot contained "refresh" → suggest ticket).
2. **Lightweight flow state** for camera triage, login recovery, create ticket — so "done" / "still not working" gets the right next step.
3. **Read-only context**: optional API that returns "offline cameras", "last failed login" (if safe); inject into LLM or use in rules so bot can say "I see camera 3 is offline."
4. **Guided wizard** for 1–2 flows (e.g. "Forgot password: are you on the login page? Do you see 'Forgot password'? Click it and…").
5. **Coverage**: add explicit answers for export report, notifications, "where is [button]", integrations, multi-property switch, version/features.
6. **Backend/fallback sync**: script or checklist so both stay in sync.

---

## Summary

- **Logic:** Context is one turn only; no flow state; "already tried" and negation are weak; multiple intents and typos not handled.
- **Edge cases:** Empty/whitespace, long message, no rate limit, ticket not tied to user, LLM can promise a ticket without creating it.
- **IT replacement:** No live data, no actions, no wizards; some topics (export, notifications, integrations, version) missing.
- **Quick wins:** Trim/empty reject, negation, already_tried expansion, ticket user_id, one clarifying question, rate limit, LLM ticket wording or structured create.

Using this list you can prioritize: quick wins first, then context/flow and read-only context, then optional actions and wizards.
