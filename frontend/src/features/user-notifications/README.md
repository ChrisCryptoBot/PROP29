# User Notifications

**Location:** `frontend/src/features/user-notifications`  
**Route:** `/notifications` (only from **profile dropdown** in sidebar — not in main nav)

- **Access:** Open the profile menu at the bottom of the sidebar → **Notifications** (shows unread count). A **Recent alerts** preview shows the last 3 items; "View all notifications" opens the full page.
- **Full page:** Single gold-standard page: filters (All, Unread, by category), list of notifications, Mark all read, remove.
- **Context:** Uses `NotificationsContext` (add/mark read/remove). Other features can push in-app alerts via `addNotification()`; for critical alerts, call `addNotification()` and optionally `toast.error()` or `showError()` so the user sees them without opening the notifications page.
