# Profile Settings

**Location:** `frontend/src/features/profile-settings`  
**Import:** `import ProfileSettings from './features/profile-settings'` or `@/features/profile-settings` (if alias configured)  
**Routes:** Canonical `/profile`; `/modules/profile-settings` also renders the same module.  
**Sidebar:** Profile Settings

User profile management: personal info, work details, certifications, preferences, security (password, 2FA, sessions, clear cache).  
API-backed via `/api/profile` (GET/PUT profile, change-password, 2FA, sessions, certifications).  
Global refresh: Ctrl+Shift+R. ErrorBoundary per tab.
