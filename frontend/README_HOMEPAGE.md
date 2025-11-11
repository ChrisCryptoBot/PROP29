# Homepage (Dashboard) - Complete Functional README

## Overview
The homepage (dashboard) is the central hub for the PROPER 2.9 platform. It provides real-time security insights, quick actions, notifications, AI analytics, and access to all feature modules. This document details every button, action, UI section, and expected behavior for thorough QA and onboarding.

---

## UI Map & Sections
- **Header Bar**
  - Logo/Brand: "Proper 2.9" and subtitle "AI enhanced security platform for hotels"
  - Search Bar: Centered, wide, for searching incidents, locations, staff, threats
  - Profile Dropdown: Top right, shows user name/role, with dropdown for Profile, Settings, Logout

- **Main Content**
  - Security Command Center Title & Subtitle
  - Time/Date Display
  - Period Selector: [Live] [Today] [Week]
  - Quick Actions: Row of buttons for rapid access to key features
  - Notifications Section: Key metrics and alerts
  - AI Risk Assessment Panel: AI-driven risk factors
  - AI Security Intelligence: AI suggestions and analytics
  - Cybersecurity Dashboard: Cyber metrics and status
  - Guest Safety & Experience: Guest-related metrics
  - Enhanced Security Modules: Grid of all feature modules (each a button)
  - Recent Activity: Activity stream of latest events

- **Background**
  - Subtle, semi-transparent watermark logo centered on the page

---

## Button & Action Reference

### 1. **Header Bar**
- **Search Bar**
  - Action: Enter text and press Enter to search incidents, locations, staff, threats
  - Expected: Triggers search (future: should display results or navigate to search page)
- **Profile Dropdown**
  - Profile: Navigates to Profile Settings
  - Settings: Navigates to Profile Settings
  - Logout: Logs out the user (future: should clear session and redirect to login)

### 2. **Period Selector**
- **Live / Today / Week**
  - Action: Click to filter dashboard metrics by period
  - Expected: Updates metrics and charts to reflect selected period

### 3. **Quick Actions**
- **Lockdown Facility**: Navigates to Lockdown Facility Auth page
- **Mass Notification**: Navigates to Mass Notification page
- **Silent Security Alert**: Navigates to Silent Security Alert page
- **Evacuation**: Navigates to Evacuation page
- **Deploy Guards**: Navigates to Deploy Guards page
- **View Cameras**: Navigates to Camera Monitoring page
- **Guest Panic Alerts**: Navigates to Guest Safety page
- **Medical Assistance**: Navigates to Medical Assistance page

### 4. **Notifications Section**
- **Metrics Cards**: Display live counts for group messages, sound alerts, AI patrols, security alerts, efficiency, threats blocked
- **Action**: No direct button, but metrics should update live

### 5. **AI Risk Assessment**
- **Risk Factors**: Each card shows a risk area and AI recommendation
- **Action**: No direct button, but should update based on AI analysis

### 6. **AI Security Intelligence**
- **AI Cards**: Show AI suggestions, behavioral analytics, guest safety
- **Action**: No direct button, but should update based on AI/ML backend

### 7. **Cybersecurity Dashboard**
- **Metrics**: Network security, threat detection, data protection, phishing attempts
- **Action**: No direct button, but metrics should update live

### 8. **Guest Safety & Experience**
- **Metrics**: Mobile app users, digital key access, panic response, feedback score
- **Action**: No direct button, but metrics should update live

### 9. **Enhanced Security Modules Grid**
- **Each Module Card**: Click to navigate to the respective module/feature
- **Action**: Navigates to module (e.g., Patrol Command Center, Access Control, Event Log, etc.)

### 10. **Recent Activity**
- **Activity Items**: Show latest events and actions
- **Action**: No direct button, but should update live

---

## Data Flow & Storage
- **All metrics and activity** should be sourced from backend APIs or real-time services.
- **Search queries** should be logged for analytics (future).
- **User actions** (quick actions, module navigation) should be auditable.
- **Profile/settings changes** should update user data in the backend.

---

## Hardware Integration
- **No direct hardware configuration on homepage.**
- **Modules accessed from homepage** may require hardware setup (see individual module READMEs).

---

## QA Checklist
- [ ] All header buttons (search, profile, settings, logout) work as described
- [ ] Period selector updates metrics
- [ ] All quick action buttons navigate to correct pages
- [ ] All module cards navigate to correct modules
- [ ] Metrics and notifications update live
- [ ] AI and risk panels display correct, up-to-date info
- [ ] Watermark logo is visible but subtle
- [ ] Responsive design: works on desktop, tablet, mobile
- [ ] No broken links or missing data
- [ ] Error states (API down, no data) are handled gracefully

---

## Future Enhancements
- Search results page/modal
- Customizable dashboard widgets
- User onboarding/help
- Accessibility improvements
- More granular audit logging

---

**Reviewed by:**
- [ ] Product Owner
- [ ] QA Lead
- [ ] Lead Developer

---

*This README should be updated as new features or UI changes are made to the homepage.* 