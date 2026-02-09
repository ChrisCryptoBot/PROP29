/**
 * Client-side fallback when the help/chat API is unreachable.
 * Mirrors backend bot: dissects problems from human conversation and tailors replies instead of just deferring.
 */

export interface ChatContext {
  lastUserMessage?: string;
  lastBotReply?: string;
}

interface DissectedProblem {
  topic: string | null;
  detail: string | null;
  alreadyTried: string[];
  isProblem: boolean;
}

function hasNegationNear(msg: string, topicWord: string): boolean {
  const m = msg.toLowerCase();
  const neg = /\b(don't|dont|do not|not|no|never|isn't|arent|wasn't|weren't)\b/i;
  const re = new RegExp(topicWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(m)) !== null) {
    const start = Math.max(0, match.index - 30);
    const end = Math.min(m.length, match.index + match[0].length + 30);
    if (neg.test(m.slice(start, end))) return true;
  }
  return false;
}

function dissectProblem(msg: string): DissectedProblem {
  const m = msg.toLowerCase().trim();
  const out: DissectedProblem = { topic: null, detail: null, alreadyTried: [], isProblem: false };
  if (/\b(camera|cameras|offline|stream|feed|soc|not showing|black screen|no picture)\b/.test(m)) {
    if (!hasNegationNear(msg, "camera") && !hasNegationNear(msg, "offline")) {
      out.topic = "camera";
      out.isProblem = /\b(offline|down|not working|broken|not showing|black|no feed|since)\b/.test(m);
    }
  }
  if (/\b(door|reader|badge|card|won't open|not opening|locked out|access denied)\b/.test(m)) {
    if (!hasNegationNear(msg, "door")) {
      out.topic = "door";
      out.isProblem = /\b(won't|not working|not opening|denied|broken)\b/.test(m);
    }
  }
  if (/\b(login|log in|password|forgot|locked out|2fa|can't get in|authenticator)\b/.test(m)) {
    if (!hasNegationNear(msg, "login") && !hasNegationNear(msg, "password")) {
      out.topic = "login";
      out.isProblem = true;
    }
  }
  if (/\b(patrol|app|sync|checkpoint|officer|mobile|not syncing|won't load)\b/.test(m)) {
    if (!hasNegationNear(msg, "patrol") && !hasNegationNear(msg, "sync")) {
      out.topic = "patrol";
      out.isProblem = /\b(not syncing|won't|stuck|not loading|crash)\b/.test(m);
    }
  }
  if (/\b(incident|report|event|log an incident)\b/.test(m)) {
    if (!hasNegationNear(msg, "incident")) {
      out.topic = "incident";
      out.isProblem = /\b(can't|don't know how|where do i)\b/.test(m);
    }
  }
  if (/\b(guest safety|evacuation|mass notification)\b/.test(m)) out.topic = "guest_safety";
  if (/\b(visitor|check-in|check-out|banned list)\b/.test(m)) out.topic = "visitor";
  if (/\b(sensor|iot|environmental|temperature|alert)\b/.test(m)) out.topic = "iot";
  if (/\b(handover|shift change)\b/.test(m)) out.topic = "handover";
  if (/\b(lost and found|lost & found|package|locker)\b/.test(m)) out.topic = "lost_found";
  const locMatch = m.match(/\b(camera\s*#?\s*\d+|door\s*#?\s*\d+|lobby|main entrance|parking lot|floor\s*\d+)\b/);
  if (locMatch) out.detail = locMatch[0].slice(0, 80);
  if (/\b(already tried|i tried|we tried|tried that|did that|didn't work|didn't help|i restarted|i refreshed|we did that|we restarted|we refreshed)\b/.test(m)) {
    if (/\b(refresh|refreshed)\b/.test(m)) out.alreadyTried.push("refresh");
    if (/\b(restart|restarted|reopen)\b/.test(m)) out.alreadyTried.push("restart");
    if (/\b(network|wifi|internet|connection)\b/.test(m)) out.alreadyTried.push("network");
    if (/\b(log out|logout|logged out|sign out)\b/.test(m)) out.alreadyTried.push("logout");
    if (/\b(device health|settings|health check)\b/.test(m)) out.alreadyTried.push("device_health");
  }
  return out;
}

function replyFromDissect(d: DissectedProblem, userMessage: string): string | null {
  if (!d.topic) return null;
  const m = userMessage.toLowerCase();
  const detail = d.detail ? ` (${d.detail})` : "";
  const tried = new Set(d.alreadyTried);
  if (d.topic === "camera") {
    if (tried.has("refresh") && !tried.has("device_health"))
      return `Since refresh didn't help${detail}, next step: in SOC open Settings (or device health) for that camera and check network status. If it shows offline or error, try power/network at the device, or create a Support Ticket with the camera name/location.`;
    if (tried.has("refresh") && tried.has("device_health"))
      return `For that camera${detail}, create a Support Ticket: Help & Support → Support Tickets → New Ticket; title like 'Camera offline: [location]', category Technical. We'll respond within 2 business hours.`;
    return `Got it—sounds like a camera issue${detail}. First: SOC → find that camera's tile → Refresh stream. If it stays offline, check Settings/device health for that camera. Tell me what you see and we'll do the next step—or say 'create a ticket'.`;
  }
  if (d.topic === "door")
    return `Understood—door/reader issue${detail}. (1) Access Control → Access Points, check that door's status. (2) Users: confirm access includes that location. (3) If reader is broken, use physical keys and create a Support Ticket. Want me to create a ticket, or checking Access Points now?`;
  if (d.topic === "login")
    return "To get back in: use Forgot password or ask an admin to reset/unlock in System Administration → Users. 2FA: Profile Settings → Security after you're in. If you're the only admin and locked out, use Contact Support to call. Which applies: forgot password / locked out / 2FA?";
  if (d.topic === "patrol") {
    if (tried.has("restart") || tried.has("logout"))
      return "Since restart/logout didn't fix sync, have the officer check Wi‑Fi or mobile data. If still not syncing, create a Support Ticket with 'Mobile app sync issue'.";
    return "For patrol app not syncing: (1) Force-close the app and reopen. (2) Check Wi‑Fi or mobile data. (3) Log out and log back in. Tell me what happens or say 'create a ticket'.";
  }
  if (d.topic === "incident" && d.isProblem)
    return "To report an incident: Incident Log → New Incident (location, severity, description); you can attach photos and assign a team. Need the full workflow or just the next click?";
  if (d.topic === "guest_safety")
    return "Guest Safety: create the incident in Incident Log, then assign to a Guest Safety team; that team uses the module for evacuation/notification. What are you doing—creating an incident, assigning one, or running an evacuation?";
  if (d.topic === "visitor")
    return "Visitor Security: register visitors and check-in/check-out. Banned Individuals is separate. Stuck on: registering a visitor, access, or banned list? Tell me which.";
  if (d.topic === "iot")
    return "Sensors/alerts: IoT Monitoring → Sensors, Settings (thresholds), Alerts tab. Sensor offline or wrong reading? Check device and network; hardware → Support Ticket. What are you seeing?";
  if (d.topic === "handover")
    return "Digital Handover: create/complete handover in Management; use a template if you have one. Won't submit? Check role and required fields. What's blocking you?";
  if (d.topic === "lost_found")
    return "Lost & found: Property Items → register item, match to reports, record when claimed. Locker not opening? Check record and status; hardware → ticket. What do you need—register, find record, or troubleshoot locker?";
  return null;
}

const CLARIFYING_REPLY =
  "I want to help but I'm not sure what you need. Is this about: a camera or feed, a door/access, login, the patrol app, reporting an incident, or something else? Reply with that (or a short description) and I'll give you concrete steps—or say 'create a ticket' and I'll open one for you.";

export function getChatReplyFallback(userMessage: string, context?: ChatContext): string {
  const trimmed = (userMessage ?? "").trim();
  if (!trimmed) return "Please type a message.";
  const m = trimmed.toLowerCase();
  const lastBot = (context?.lastBotReply ?? "").toLowerCase().slice(0, 500);

  // Casual / off-topic so natural conversation doesn't throw the bot off (when API unreachable)
  if (/\b(how are you|how's it going|what's up|how do you do|how have you been)\b/.test(m))
    return "I'm here and ready to help. Ask me about the system anytime, or we can just chat—what's on your mind?";
  if (/\b(hello|hi|hey)\b/.test(m) && trimmed.split(/\s+/).length <= 4)
    return "Hi! I'm the Proper 2.9 support assistant. Ask me anything about the system or type a question—I'll guide you step by step.";

  if (lastBot && /\b(it didn't work|didn't work|still not working|still doesn't work|same problem|no luck)\b/.test(m)) {
    if (/camera|offline|stream/.test(lastBot)) return "Since it's still not working, create a Support Ticket (Help & Support → Support Tickets → New Ticket). Use title like 'Camera offline: [location]' and category Technical. We'll respond within 2 business hours. For urgent gaps, use Contact Support to call.";
    if (/patrol|app|sync/.test(lastBot)) return "If the app is still not syncing: (1) Force-close the app and reopen. (2) Check Wi‑Fi or mobile data. (3) Log out and log back in. If it still fails, create a Support Ticket with 'Mobile app sync issue'.";
    if (/door|lock|access/.test(lastBot)) return "If the door or reader is still not working, create a Support Ticket with the door/location. For immediate safety use physical keys or Contact Support. Our team will follow up.";
    if (/login|password/.test(lastBot)) return "If you still can't log in, an administrator must reset your password or unlock your account in System Administration → Users. If you're the admin and locked out, use Contact Support to call.";
    return "I'm sorry it's still not working. Create a Support Ticket (Help & Support → Support Tickets → New Ticket) with what you tried and what happened. A rep will reach out within 2 business hours. For urgent issues, use Contact Support to call or email.";
  }
  if (lastBot && /\b(what next|what's next|and then|next step|what do i do now)\b/.test(m)) {
    if (/incident/.test(lastBot) && !/assign/.test(lastBot)) return "Next: assign the incident to a response team. If guest-related, assign to a Guest Safety team—they'll use Guest Safety for response. Then update status to Resolved when done.";
    if (/patrol/.test(lastBot)) return "Next: the officer opens the mobile app, selects the route, starts the patrol, and checks in at each checkpoint. They can report incidents from the app. When all checkpoints are done, the patrol completes in Overview.";
    if (/ticket|support/.test(lastBot)) return "You'll get a response within 2 business hours. View tickets in Help & Support → Support Tickets. For urgent, use Contact Support to call or email.";
    return "Tell me what you're doing (e.g. 'reporting an incident', 'camera offline') and I'll give the exact next step. Or pick a topic above.";
  }
  if (lastBot && /\b(yes|yeah|yep|please|sure)\b/.test(m)) {
    if (/ticket|create a support|escalat/.test(lastBot)) return "I can't create a ticket while you're offline. When you're back online, say 'Create a ticket' again and I'll create one for you, or go to Help & Support → Support Tickets → New Ticket. Is there anything else I can do for you today?";
    return "What would you like next? Ask for another topic (e.g. 'incident workflow') or say 'create a ticket' to escalate.";
  }
  if (lastBot && /\b(no|nope|nah|nothing else|that's all|all good|we're good|no thanks)\b/.test(m)) {
    if (/anything else|anything else i can/.test(lastBot)) return "No problem. You can start a new conversation using the button below, or close the chat. Have a good one!";
    return "No problem. What do you need help with? Pick a topic (incidents, patrol, access, cameras, login, ticket) or type your question.";
  }
  if (lastBot && /\b(something else|different topic|other)\b/.test(m)) {
    return "No problem. What do you need help with? Pick a topic (incidents, patrol, access, cameras, login, ticket) or type your question.";
  }
  if (lastBot && /\b(need more detail|more detail|more info|explain more|go deeper)\b/.test(m)) {
    return "Tell me exactly what you're doing or what screen you're on (e.g. 'I'm in Incident Log and need to assign to Guest Safety'). The more specific, the better I can give the next click or step.";
  }
  if (/\b(create a ticket|create ticket|i'll create a ticket|escalate)\b/.test(m)) {
    return "I can't create a ticket while you're offline. When you're back online, say 'Create a ticket' again and I'll create one for you, or go to Help & Support → Support Tickets → New Ticket. Is there anything else I can do for you today?";
  }
  if (/\b(report this gap|report gap|report ai shortcoming|report ai gap)\b/.test(m)) {
    return "I can't create a gap report while you're offline. When you're back online, say 'Report this gap' again and I'll create a ticket for the dev team, or go to Help & Support → Support Tickets → New Ticket and describe that the assistant couldn't answer your question.";
  }

  // --- NEW: Error message matching (P0) ---
  if (/\bnetwork error\b|\bconnection.*failed\b|\bfailed to fetch\b|\bfetch.*error\b/i.test(m)) {
    return "Network error detected. Check your internet connection and look for 'Offline' banner at top of screen. If offline, wait for connection to restore (operations will queue). If online but still failing, refresh the page (F5 or Ctrl+R). Say 'create a ticket' if still failing after refresh.";
  }
  if (/\bpermission.*denied\b|\baccess.*denied\b|\bunauthorized\b|\b403\b|\bforbidden\b/i.test(m)) {
    return "Permission denied: Your role doesn't have permission for this action. If you're an admin, check System Administration → Users → Your account → Role. If role is correct, try logging out and back in. Some features require specific role permissions (check module Settings). Say 'create a ticket' if role is correct but still denied.";
  }
  if (/\bvalidation.*error\b|\binvalid.*field\b|\brequired.*field\b|\bmust be\b|\bat least\b|\bmaximum\b/i.test(m)) {
    return "Validation error: Form field doesn't meet requirements. Check the red error text below each field. Required fields are marked with *. Common issues: Text too short, invalid format (e.g. email), number out of range. Fix each field and try submitting again. Say 'create a ticket' if field looks correct but validation still fails.";
  }
  if (/\bplease fix.*error\b|\bfix.*error.*form\b|\berrors.*form\b/i.test(m)) {
    return "Form has validation errors. Scroll through the form and look for red error messages. Each error will tell you what's wrong (e.g. 'Required field', 'Invalid format'). Fix all errors before submitting. If no errors are visible, try refreshing the page. Say 'create a ticket' if no errors visible but form won't submit.";
  }
  if (/\bfailed.*operation\b|\boperation.*failed\b|\bsync.*failed\b/i.test(m)) {
    return "Failed operations: Queued operation couldn't sync to server. Look for red badge showing failed operation count. Click 'Retry Failed Operations' button. If still failing, check the error message in the queue. Common causes: Server error (500), validation error (422), or network timeout. If retry doesn't work, recreate the operation manually. Say 'create a ticket' if operations consistently failing.";
  }
  if (/\bwebsocket.*disconnect\b|\bws.*disconnect\b|\brealtime.*off\b/i.test(m)) {
    return "WebSocket disconnected: Real-time updates connection lost. Real-time features (live incidents, camera updates) require WebSocket. Refresh the page (F5) to reconnect. If dashboard isn't updating, refresh to get latest data. Check browser console (F12) for WebSocket errors. Say 'create a ticket' if WebSocket won't reconnect after refresh.";
  }
  if (/\bcannot.*submit\b|\bsubmit.*disabled\b|\bbutton.*disabled\b/i.test(m)) {
    return "Cannot submit: Form validation preventing submission. Check for red error messages below fields. All required fields (marked with *) must be filled. Check field formats (email, date, number ranges). If button is grayed out, hover to see tooltip explaining why. Say 'create a ticket' if all fields valid but submit still disabled.";
  }

  // --- NEW: Offline queue troubleshooting (P0) ---
  if (/\bchanges not saving\b|\bnot saving\b|\bdidn't save\b|\blost my changes\b/i.test(m)) {
    return "If your changes aren't appearing, you might be offline. Check the top of the screen for an 'Offline' banner. When offline, all operations are automatically queued and will sync when your connection restores. You can continue working—your changes are saved locally. If you see a yellow badge showing pending operations, that's normal. They'll sync automatically every 60 seconds when online. If you see a red badge with failed operations, click 'Retry Failed Operations'. Say 'create a ticket' if operations are stuck.";
  }
  if (/\bpending.*operation\b|\bqueued.*operation\b|\boffline.*queue\b/i.test(m)) {
    return "Pending operations mean your changes are queued locally and will sync when your connection restores. This is normal when you're offline or have a weak connection. You'll see a yellow badge showing the count. Operations sync automatically every 60 seconds when online. If operations fail (red badge), click 'Retry Failed Operations' or check the error message in the queue. Say 'create a ticket' if operations are stuck in queue after connection restored.";
  }

  // --- NEW: WebSocket troubleshooting (P1) ---
  if (/\bdashboard not updating\b|\bnot getting updates\b|\breal-time not working\b|\bstale data\b/i.test(m)) {
    return "If your dashboard isn't updating in real-time, the WebSocket connection may be disconnected. Real-time features (live incidents, camera updates, patrol status) require WebSocket. To fix: (1) Refresh the page (F5 or Ctrl+R) to reconnect. (2) Check browser console (F12) for WebSocket errors. If refreshing doesn't help, check your network connection and firewall settings. WebSocket uses ws:// protocol. Say 'create a ticket' if WebSocket won't reconnect.";
  }

  // --- NEW: Navigation disambiguation (P1) ---
  if (/\bbanned individuals\b/i.test(m) && (/\bwhere\b|\bhow do i find\b|\blocation\b|\bhow do i\b|\bwhere do i\b|\bwhere can i\b|\bnavigate\b|\bgo to\b/i.test(m))) {
    return "'Banned Individuals' exists in multiple places:\n\n1. Banned Individuals module (dedicated module)\n2. Visitor Security → Banned Individuals tab (visitor context)\n\nWhen to use each:\n- Use Banned Individuals module for: managing watchlist, viewing all detections, bulk operations\n- Use Visitor Security → Banned Individuals tab for: checking if visitor is banned during check-in";
  }
  if (/\bemergency\b/i.test(m) && (/\bwhere\b|\bhow do i find\b|\blocation\b|\bhow do i\b|\bwhere do i\b|\bwhere can i\b|\bnavigate\b|\bgo to\b/i.test(m))) {
    return "'Emergency' exists in multiple places:\n\n1. Incident Log → Emergency Alert button\n2. Access Control → Lockdown tab\n\nWhen to use each:\n- Use Emergency Alert for: logging emergency incidents, notifying teams\n- Use Lockdown for: physically locking all doors, facility-wide security";
  }
  if (/\buser management\b/i.test(m) && (/\bwhere\b|\bhow do i find\b|\blocation\b|\bhow do i\b|\bwhere do i\b|\bwhere can i\b|\bnavigate\b|\bgo to\b/i.test(m))) {
    return "'User Management' exists in multiple places:\n\n1. System Administration → Users tab (full user management)\n2. Account Settings → Team tab (team-specific settings)\n\nWhen to use each:\n- Use System Administration for: creating users, assigning roles, permissions\n- Use Account Settings for: team-specific configurations, integrations";
  }

  // --- NEW: Settings reference (P1) ---
  if (/\bhow do i change\b|\bwhere is the setting\b/i.test(m)) {
    if (/\bincident log\b/i.test(m)) {
      return "To change Incident Log settings:\n\nGo to: Incident Log → Settings tab\n\nThis tab controls:\n- Auto-approval rules (approve incidents automatically based on criteria)\n- Escalation configuration (when to escalate, to whom)\n- Notification settings (who gets notified for incidents)\n- Review queue settings (approval workflow)";
    }
    if (/\biot\b/i.test(m)) {
      return "To change IoT Environmental settings:\n\nGo to: IoT Environmental → Settings tab\n\nThis tab controls:\n- Sensor thresholds (temperature, humidity, etc.)\n- Alert rules (when to create alerts)\n- Device provisioning defaults";
    }
    if (/\baccess control\b/i.test(m)) {
      return "To change Access Control settings:\n\nGo to: Access Control → Configuration tab\n\nThis tab controls:\n- Access timeouts (how long badges work)\n- Biometric settings\n- Emergency override configuration\n- Lockdown settings (which doors participate)";
    }
    if (/\bsoc\b|\bsecurity operations\b/i.test(m)) {
      return "To change Security Operations Center settings:\n\nGo to: Security Operations Center → Settings tab\n\nThis tab controls:\n- Camera provisioning defaults\n- Recording retention\n- Stream quality settings";
    }
    if (/\bguest safety\b/i.test(m)) {
      return "To change Guest Safety settings:\n\nGo to: Guest Safety → Settings tab\n\nThis tab controls:\n- Evacuation procedures\n- Mass notification templates\n- Response team assignments\n- Alert thresholds";
    }
    if (/\bvisitor security\b/i.test(m)) {
      return "To change Visitor Security settings:\n\nGo to: Visitor Security → Settings tab\n\nThis tab controls:\n- Check-in/check-out defaults\n- Visitor access duration\n- Notification settings\n- Integration with Access Control";
    }
    if (/\bdigital handover\b/i.test(m)) {
      return "To change Digital Handover settings:\n\nGo to: Digital Handover → Settings tab\n\nThis tab controls:\n- Handover templates\n- Required checklist items\n- Equipment tracking settings\n- Shift type configurations";
    }
    if (/\bpatrol\b/i.test(m)) {
      return "To change Patrol Command Center settings:\n\nGo to: Patrol Command Center → Settings tab\n\nThis tab controls:\n- Route optimization settings\n- Checkpoint requirements\n- Sync intervals\n- Mobile app configuration";
    }
    if (/\bproperty items\b/i.test(m)) {
      return "To change Property Items settings:\n\nGo to: Property Items → Settings tab\n\nThis tab controls:\n- Lost & found retention policies\n- Package handling rules\n- Storage location settings";
    }
    if (/\bsmart lockers\b/i.test(m)) {
      return "To change Smart Lockers settings:\n\nGo to: Smart Lockers → Settings tab\n\nThis tab controls:\n- Locker assignment rules\n- Access duration\n- Notification settings";
    }
    if (/\bsmart parking\b/i.test(m)) {
      return "To change Smart Parking settings:\n\nGo to: Smart Parking → Settings tab\n\nThis tab controls:\n- Space availability thresholds\n- Guest/valet parking rules\n- Sensor calibration";
    }
    if (/\bbanned individuals\b/i.test(m)) {
      return "To change Banned Individuals settings:\n\nGo to: Banned Individuals → Settings tab\n\nThis tab controls:\n- Detection sensitivity\n- Alert rules\n- False positive handling\n- Integration with cameras/kiosks";
    }
    if (/\bsystem admin\b/i.test(m)) {
      return "To change System Administration settings:\n\nGo to: System Administration → Settings tab\n\nThis tab controls:\n- Security policies\n- Password requirements\n- Session timeout settings\n- Audit log retention";
    }
  }

  // Very short unclear message: one clarifying question
  const d = dissectProblem(trimmed);
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && d.topic === null) return CLARIFYING_REPLY;

  // Dissect problem from human conversation and tailor reply (digest, don't just defer)
  const wordCount = words.length;
  if (d.topic && (d.isProblem || wordCount > 8)) {
    const tailored = replyFromDissect(d, trimmed);
    if (tailored) return tailored;
  }
  if (d.topic && wordCount >= 4) {
    const tailored = replyFromDissect(d, trimmed);
    if (tailored) return tailored;
  }

  if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(m)) {
    return "Hi! I'm the Proper 2.9 in-app support assistant. I know this platform in depth: what it is (security management for hotels/properties), every module's workflow, and how they interact. I can guide you step-by-step or troubleshoot; I don't access your live data or perform actions for you—I tell you how. When I can't help, I escalate and a person will reach out within 2 business hours. Ask me anything about the system, or try: 'what are you', 'what can you do', 'your limitations', or 'incident workflow'.";
  }
  if (/\b(thank|thanks|bye)\b/.test(m)) {
    return "You're welcome! Ask anytime if you need more help.";
  }

  if (/\b(what are you|who are you|what is this chat|what is this bot|are you ai|are you human)\b/.test(m)) {
    return "I'm the Proper 2.9 in-app support assistant. I'm a rule-based assistant trained on this platform: I know every module, their workflows, and how they connect. I don't have access to your live data or the ability to perform actions (e.g. I can't create an incident or lock a door for you)—I guide you through how to do it. When your question is unclear or outside what I know, I escalate to a human: a ticket is created and a representative will reach out within 2 business hours. You're using me inside the desktop console so you can keep working while we chat; I'm here to help you use the system and unblock yourself.";
  }
  if (/\b(what is proper 2\.9|what is this system|what is the platform|what does this do)\b/.test(m)) {
    return "Proper 2.9 is a hotel and property security management platform. It's the desktop console you're using now, built for security managers, officers, front desk, and directors. It centralizes security operations: report and manage incidents (Incident Log), run and track patrols (Patrol Command Center + mobile app), control doors and lockdown (Access Control), view cameras and recordings (SOC), manage guest-related incidents and evacuation (Guest Safety), register visitors and banned list (Visitor Security, Banned Individuals), environmental sensors (IoT), shift handovers (Digital Handover), lost & found and packages (Property Items), lockers, parking. The purpose is to give your team one place for visibility, documentation, and action so security operations run consistently.";
  }
  if (/\b(your limitations|what can't you do|what can you not do|limitations of the bot)\b/.test(m)) {
    return "My limitations: (1) I can't access your live data—I don't see your incidents, patrols, or users in real time. (2) I can't perform actions in the system—I can't create an incident, lock a door, or assign a patrol; I tell you how. (3) I can't fix hardware—I guide troubleshooting and recommend a support ticket. (4) I can't change permissions or roles—that's for an administrator. (5) I answer from fixed knowledge; if your question is vague or outside my training, I escalate to a human. (6) I'm not generative AI—I don't make up steps; I follow the workflows I was built with.";
  }
  if (/\b(system limitations|platform limitations|what can the system not do)\b/.test(m)) {
    return "System limitations: (1) Depends on hardware and network—cameras, readers, sensors, and the mobile app need connectivity and working devices. (2) Features depend on configuration and your role—you may not see every module if your role doesn't include it. (3) Integrations (e.g. external alerting) may be limited. (4) Desktop is for management; field staff use the mobile app. (5) Data depends on backend and sync. (6) Custom workflows or deep integrations may need a representative or implementation team.";
  }
  if (/\b(what can you do|what do you do|how can you help|your role)\b/.test(m)) {
    return "I can: (1) Explain any module and its workflow step-by-step (incidents, patrol, access, cameras, guest safety, visitors, banned, IoT, handover, lost & found, lockers, parking). (2) Explain how modules interact—e.g. incidents and Guest Safety, patrol and mobile app, visitors and access. (3) Troubleshoot common issues (login, camera offline, app sync, door not locking) and tell you where to click. (4) Point you to Support Tickets, Contact Support, Help Center, Resources. When I can't answer or fix it, I create a ticket and a person will reach out. You can keep using your screen while we chat—I'm here to help you use the system and get unblocked.";
  }
  if (/\b(expectations|what should i expect|response time|when will someone contact me)\b/.test(m)) {
    return "What to expect: From me you get immediate answers based on system knowledge and workflows. If I escalate, a support ticket is created and a representative will reach out within 2 business hours; you'll see the ticket in Help & Support → Support Tickets. For emergencies use Contact Support to call or email directly. I'm consistent and point you to the right module and steps; I won't make up procedures or access your data.";
  }
  if (/\b(who uses this|who is this for|who am i|what is my role)\b/.test(m)) {
    return "Proper 2.9 is used by security and operations staff: security managers and directors, officers, patrol agents, front desk, valet. You're on the desktop console—typically at a desk or command center. Your role determines which modules you see; I can explain each module but I can't see or change your role—that's System Administration or Account Settings. If you don't see something, an administrator may need to grant access. Check Profile Settings for your profile and Work Details.";
  }

  if (/\b(workflow|workflows|how everything works|how do modules work|how do they interact|how does it all connect|big picture|overview of system)\b/.test(m)) {
    return "Here's how the system fits together. INCIDENT LOG: you report incidents (or they come from patrol/mobile); they can be reviewed in Review Queue, then approved and assigned to response teams—those teams live in GUEST SAFETY. ACCESS CONTROL: doors, badges, lockdown; lockdown affects all configured doors at once. PATROL: routes and checkpoints are created in Patrol Command Center; officers run patrols on the MOBILE APP and check in at each checkpoint; they can report incidents from the app into Incident Log. VISITOR SECURITY: register visitors, check-in/check-out; can tie into access. BANNED INDIVIDUALS: watchlist and detections can drive alerts. SOC: live cameras and recordings. IoT/ENVIRONMENTAL: sensors and alerts. DIGITAL HANDOVER: shift handovers. PROPERTY ITEMS: lost & found and packages. Ask for a specific workflow (e.g. 'patrol workflow' or 'incident to guest safety').";
  }
  if (/\b(incident workflow|incident flow|how do incidents work|from report to resolution)\b/.test(m)) {
    return "Incident workflow: (1) Report: Incident Log → New Incident (or from patrol mobile app). Enter location, severity, description, optional photos. (2) Review: incidents may go to Review Queue for approval. (3) Assign: assign to a response team. (4) Guest Safety: if guest-related, assign to a Guest Safety team—they use that module for response, evacuation, mass notification. (5) Resolution: update status in Incident Log. Escalation rules can be set in Settings.";
  }
  if (/\b(patrol workflow|how do patrols work|run a patrol|patrol from start to finish)\b/.test(m)) {
    return "Patrol workflow: (1) Setup: Patrol Command Center → create routes and checkpoints. (2) Assign officers (they need the mobile app). (3) Run: officer starts patrol on app, visits each checkpoint and checks in. (4) During patrol: officer can report an incident from the app—it goes to Incident Log. (5) Complete: when all checkpoints are done, patrol is completed. Overview shows completion rate. Sync issues: have officer restart app or check network.";
  }
  if (/\b(lockdown workflow|how does lockdown work|lockdown and access)\b/.test(m)) {
    return "Lockdown workflow: Access Control → Lockdown tab. When you trigger lockdown, all configured access points (doors, gates) lock system-wide. To unlock, disable lockdown from the same place. Access Points and Configuration control which points participate. For a door not locking, check it's in the lockdown group and hardware is online.";
  }
  if (/\b(visitor and access|visitor badge|visitor check in access|how do visitors get access)\b/.test(m)) {
    return "Visitors and access: In Visitor Security you register visitors and check-in/check-out. Check-in can grant temporary access (badge/door access). Access Control manages doors; the two can integrate so check-in gives time-limited access, revoked on check-out. If visitors can't get through a door, check they're checked in and the door is in their allowed areas.";
  }
  if (/\b(banned detection|banned alert|banned individual detected|what happens when banned)\b/.test(m)) {
    return "Banned individuals: The module holds the watchlist. When a detection occurs (camera or kiosk match), it can create an alert. Alerts are viewed in Banned Individuals (e.g. Detections) and may notify security or create an incident. Flow: watchlist → detection → alert/detection record → security response. False positives: review in the module.";
  }
  if (/\b(camera and incident|camera offline incident|soc and incident)\b/.test(m)) {
    return "Cameras and incidents: SOC is for live view and recordings. To log something from camera: create an incident in Incident Log and describe the camera/location. Camera offline: troubleshoot in SOC (refresh stream, device health) or create a support ticket; you can also log 'Camera X offline' as an incident.";
  }
  if (/\b(guest safety and incident|assign incident to guest safety|incident to response team)\b/.test(m)) {
    return "Guest Safety and incidents: Create incident in Incident Log, then assign to a response team (teams are in Guest Safety). That team uses Guest Safety for coordination—evacuation, mass notification, messages. Incident Log is the source of record; Guest Safety is where response teams act.";
  }
  if (/\b(handover and shift|shift change|handover workflow)\b/.test(m)) {
    return "Handover workflow: Digital Handover → create handover (or template) with shift type, from/to, summary of incidents, pending tasks, equipment status. Complete the handover so the next shift has the record. Tracking tab shows status. Handovers are documentation; for follow-up create an incident or ticket separately.";
  }
  if (/\b(lost found workflow|lost and found process|register lost item)\b/.test(m)) {
    return "Lost & found: Property Items (Lost & Found) → register item (who found it, where, description). Match to reports if applicable. When owner claims, record the claim. Packages: register → deliver or notify. Smart Lockers track locker assignment.";
  }
  if (/\b(iot alert|sensor alert|environmental alert workflow)\b/.test(m)) {
    return "IoT/Environmental alerts: Define sensors and thresholds in Settings. When a reading exceeds a threshold, an alert is created. Alerts tab: acknowledge or resolve. Sensor offline: no readings until it's back; create a ticket for hardware. You can create an incident in Incident Log to track response.";
  }

  if (/\b(password|forgot password|reset password|can't log|cannot log|locked out|login failed|2fa|two factor|authenticator)\b/.test(m)) {
    return "Password & login: Use 'Forgot password' on the login page, or ask your administrator to reset your account. Locked out: an admin must unlock you in System Administration → Users. 2FA: Profile Settings → Security to disable/re-enable 2FA or revoke sessions.";
  }
  if (/\b(emergency|urgent incident|immediate threat)\b/.test(m)) {
    return "For an emergency: (1) Use Incident Log → Emergency Alert to log it. (2) For immediate help, use Help & Support → Contact Support to call or email—don't rely on chat for life-safety. Lockdown: Access Control → Lockdown tab if you need to lock the facility.";
  }
  if (/\b(can't see|don't see|missing module|no access to module|where is .* module)\b/.test(m)) {
    return "If you don't see a module or menu, your role may not include it. An administrator must grant the role in System Administration → Users (or Account Settings). Profile Settings shows your profile; I can't see or change your permissions—only an admin can.";
  }
  if (/\b(door won't open|reader not working|badge not working|card not reading)\b/.test(m)) {
    return "Door/reader not working: (1) Check Access Control → Access Points for that door's status. (2) Confirm your access is granted in Users. (3) Try another reader if available. (4) For hardware (reader broken, door stuck), create a Support Ticket. For immediate safety use physical keys or Contact Support.";
  }
  if (/\b(profile|picture|avatar|photo|company email|employee id)\b/.test(m)) {
    return "Profile: Profile Settings → Personal Info. Update name, email, phone, company email, employee ID, emergency contact, profile picture. Work details (department, hire date, shift) are under Work Details.";
  }
  if (/\b(incident|report incident|event log|reporting|log an incident)\b/.test(m)) {
    return "Incident Log: Sidebar → Incident Log (or Event Log). New Incident: enter location, severity, description; attach photos; assign to response team. Emergency Alert for emergencies. Review Queue for pending approval; Trends and Settings available.";
  }
  if (/\b(review queue|approve incident|pending incident)\b/.test(m)) {
    return "Review Queue: Incident Log → Review Queue tab. View incidents awaiting review/approval; open to approve, reject, or request changes. Settings for auto-approval or escalation rules.";
  }
  if (/\b(access control|door|lock|badge|grant access|revoke|lockdown)\b/.test(m)) {
    return "Access Control: Overview (status), Access Points (doors/readers), Users (grant/revoke by user and location). Lockdown tab to lock down the facility. Configuration for points, timeouts, biometrics. Hardware issues → support ticket.";
  }
  if (/\b(camera|cameras|offline|stream|soc|security operations|live view|recording)\b/.test(m)) {
    return "Cameras & SOC: Security Operations Center shows live view and camera tiles. Camera offline: (1) Check tile, try Refresh stream. (2) Settings → device health and network. (3) Hardware/wiring → support ticket. Recordings and audit in SOC tabs.";
  }
  if (/\b(patrol|route|checkpoint|officer|on duty|patrol agent)\b/.test(m)) {
    return "Patrol Command Center: Manage patrols, routes, officers. Create routes and checkpoints in management; assign officers. Officers use the mobile app to run patrols and check in at checkpoints. App not syncing: check network, restart app; else create a ticket.";
  }
  if (/\b(guest safety|evacuation|mass notification|incident guest)\b/.test(m)) {
    return "Guest Safety: Incidents affecting guests, evacuation plans, mass notifications. Incidents tab to create/view and assign teams. Evacuation tab for procedures; Mass Notification for alerts; Messages for team communication.";
  }
  if (/\b(visitor|visitors|check-in|check-out|banned|ban list)\b/.test(m)) {
    return "Visitor Security: register visitors, check-in/check-out, events, banned list. Banned Individuals (separate module): watchlist and detections. Add banned person or handle false positives in Management. Kiosk/hardware issues → support ticket.";
  }
  if (/\b(iot|sensor|environmental|temperature|humidity|alerts iot)\b/.test(m)) {
    return "IoT/Environmental: IoT Monitoring shows sensors, alerts, analytics. Add/edit sensors in Sensors tab; thresholds in Settings. Alerts when thresholds exceeded. Sensor offline or wrong readings: check device and network; hardware → support ticket.";
  }
  if (/\b(handover|shift handover|digital handover)\b/.test(m)) {
    return "Digital Handover: Shift handovers—checklists, equipment status, notes. Management to create/complete handovers; Tracking for status. Equipment and Settings for templates. Handover won't submit: check role and template; else create a ticket.";
  }
  if (/\b(lost and found|lost & found|property items|package|locker|smart locker)\b/.test(m)) {
    return "Property Items: lost & found and packages. Register items, match to reports, manage packages. Smart Lockers (separate) for locker assignment and release. Missing item or locker not opening: check record and status; hardware → support ticket.";
  }
  if (/\b(parking|valet|space|occupancy)\b/.test(m)) {
    return "Smart Parking: Spaces, occupancy, guest/valet status. Manage spaces and guest registrations in the tabs. Space stuck 'occupied' or sensor errors: check IoT/device status; create a ticket if needed.";
  }
  if (/\b(ticket|support ticket|create ticket|open a ticket)\b/.test(m)) {
    return "Support tickets: Help & Support → Support Tickets → New Ticket. Enter title, description, priority (low/medium/high/urgent), category (Technical, Account, Feature Request, Bug Report). We respond within 2 business hours. View and edit tickets in the same tab.";
  }
  if (/\b(help|documentation|manual|how do i|where is)\b/.test(m)) {
    return "Help & Support: Overview (stats), Help Center (search articles), Support Tickets (create/view), Contact Support (email/phone), Resources (manual, mobile app links, API docs, videos). Describe what you're trying to do and I can give step-by-step instructions.";
  }
  if (/\b(admin|system admin|user management|roles|permissions)\b/.test(m)) {
    return "System Administration: Users, roles, properties, system settings, security policies, audit logs. Add/edit users, assign roles. No access to a module: your role may not include it; an administrator must grant the role. Account-level team settings are in Account Settings.";
  }
  if (/\b(account settings|team|property)\b/.test(m)) {
    return "Account Settings: Team members, team settings, integrations, permissions. Profile Settings is for your own profile, 2FA, sessions. Property selection (if multiple) is usually in the header or dashboard.";
  }
  if (/\b(mobile|app|mobile app|download app|patrol app|where do i download|get the app)\b/.test(m)) {
    return "Mobile app: Help & Support → Resources (iOS/Google Play). Sign in with same credentials as desktop. Used for patrol check-ins, incident reporting, real-time alerts. Login fails: confirm account is active and role is correct; app crashes or sync → support ticket (Technical or Bug Report).";
  }

  // Unclear: narrow down instead of cold defer
  const dLast = dissectProblem(trimmed);
  if (dLast.topic) {
    if (dLast.topic === "camera")
      return "Sounds like it might be camera-related. Try SOC → find the camera tile → Refresh stream; then Settings/device health. If that doesn't help, tell me what you see or say 'create a ticket'.";
    if (dLast.topic === "door")
      return "Sounds like an access/door issue. Check Access Control → Access Points and Users. If the reader or door is faulty, use physical keys and create a ticket with the location. Say 'create a ticket' if you want one.";
    if (dLast.topic === "login")
      return "For login: Forgot password or ask an admin to reset/unlock (System Administration → Users). 2FA: Profile Settings → Security. Locked out as admin? Use Contact Support to call. Need more specific steps?";
    if (dLast.topic === "patrol")
      return "For patrol app: have the officer restart the app and check network; log out and back in if needed. Still not syncing? Say what you've tried or 'create a ticket'.";
    if (dLast.topic === "incident")
      return "For incidents: Incident Log → New Incident (location, severity, description). Need the full workflow or just where to click? Or say 'create a ticket' if you're stuck.";
  }
  return "I don't have a confident answer for that. You can try rephrasing (e.g. which module or task?), or say 'report this gap' so the dev team can improve the assistant, or 'create a ticket' for general support.";
}
