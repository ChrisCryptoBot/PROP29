# PATROL COMMAND CENTER - GOLD STANDARD BLUEPRINT
## Complete Design System Reference
**Last Updated:** 2025-12-06  
**Status:** ✅ COMPREHENSIVE BLUEPRINT  
**Reference Site:** https://benevolent-brioche-83fe74.netlify.app/modules/patrol

---

## 📋 TABLE OF CONTENTS

1. [Page Layout & Structure](#1-page-layout--structure)
2. [Header Section](#2-header-section)
3. [Tab Navigation](#3-tab-navigation)
4. [Main Content Container](#4-main-content-container)
5. [Metric Cards (Dashboard)](#5-metric-cards-dashboard)
6. [Content Cards](#6-content-cards)
7. [Icon System](#7-icon-system)
8. [Badge System](#8-badge-system)
9. [Button System](#9-button-system)
10. [Typography](#10-typography)
11. [Color Palette](#11-color-palette)
12. [Spacing & Padding](#12-spacing--padding)
13. [Status Indicators](#13-status-indicators)
14. [Progress Bars](#14-progress-bars)
15. [Card Headers](#15-card-headers)
16. [Background & Gradients](#16-background--gradients)
17. [Complete Code Examples](#17-complete-code-examples)

---

## 1. PAGE LAYOUT & STRUCTURE

### **Root Container**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
  {/* Header */}
  {/* Tab Navigation */}
  {/* Main Content */}
</div>
```

**Exact Classes:**
- Root: `min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200`
- Background gradient: Light gray gradient from top-left to bottom-right

---

## 2. HEADER SECTION

### **Header Container**
```tsx
<div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
  <div className="relative max-w-7xl mx-auto px-6 py-6">
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-4">
        {/* Icon */}
        {/* Title & Subtitle */}
      </div>
    </div>
  </div>
</div>
```

**Exact Specifications:**
- **Outer Container:** `relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg`
- **Inner Container:** `relative max-w-7xl mx-auto px-6 py-6`
- **Content Wrapper:** `flex items-center justify-center` (CENTERED)
- **Content Flex:** `flex items-center space-x-4`

### **Header Icon**
```tsx
<div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
  <i className="fas fa-route text-white text-2xl" />
</div>
```

**Exact Specifications:**
- **Size:** `w-16 h-16` (64px × 64px)
- **Gradient:** `bg-gradient-to-br from-blue-700 to-blue-800` (DARKER BLUE)
- **Border Radius:** `rounded-2xl`
- **Shadow:** `shadow-lg`
- **Icon:** `text-white text-2xl`
- **Icon Class:** Font Awesome icon (e.g., `fa-route`, `fa-shield-alt`, etc.)

### **Header Title**
```tsx
<div>
  <h1 className="text-3xl font-bold text-slate-900">
    Patrol Command Center
  </h1>
  <p className="text-slate-600 font-medium">
    Advanced patrol management and security operations
  </p>
</div>
```

**Exact Specifications:**
- **Title:** `text-3xl font-bold text-slate-900`
- **Subtitle:** `text-slate-600 font-medium`

---

## 3. TAB NAVIGATION

### **Tab Container**
```tsx
<div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
  <div className="relative max-w-7xl mx-auto px-6 py-4">
    <div className="flex justify-center">
      <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
        {/* Tab Buttons */}
      </div>
    </div>
  </div>
</div>
```

**Exact Specifications:**
- **Outer Container:** `relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg`
- **Inner Container:** `relative max-w-7xl mx-auto px-6 py-4`
- **Tab Wrapper:** `flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30`
- **Tab Button Container:** `flex justify-center`

### **Tab Buttons**
```tsx
<button
  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
    activeTab === tab.id
      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
  }`}
>
  {tab.label}
</button>
```

**Exact Specifications:**
- **Base Classes:** `px-4 py-2 text-sm font-medium rounded-md transition-all duration-200`
- **Active Tab:** `bg-white text-slate-900 shadow-sm border border-slate-200`
- **Inactive Tab:** `text-slate-600 hover:text-slate-900 hover:bg-white/50`

---

## 4. MAIN CONTENT CONTAINER

### **Content Wrapper**
```tsx
<div className="relative max-w-[1800px] mx-auto px-6 py-6">
  {/* Tab Content */}
</div>
```

**Exact Specifications:**
- **Container:** `relative max-w-[1800px] mx-auto px-6 py-6`
- **Max Width:** `1800px` (NOT `max-w-7xl`)
- **Padding:** `px-6 py-6`

---

## 5. METRIC CARDS (DASHBOARD)

### **CRITICAL: Metric Card Structure**

**❌ NEVER USE CardHeader for Metric Cards**
**✅ ALWAYS USE CardContent Only**

### **Complete Metric Card Template**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    {/* Status Badge - Top Right */}
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-[COLOR]-800 bg-[COLOR]-100 rounded">
        STATUS
      </span>
    </div>
    
    {/* Icon Container - Top Left */}
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-[COLOR]-700 to-[COLOR]-800 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-[icon] text-white text-xl"></i>
      </div>
    </div>
    
    {/* Content Section */}
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Card Title</p>
      <h3 className="text-2xl font-bold text-blue-600">Number Value</h3>
      <p className="text-slate-600 text-sm">Description text</p>
    </div>
  </CardContent>
</Card>
```

### **Exact Metric Card Specifications**

#### **Card Container**
- **Component:** `<Card>` (uses base Card component)
- **CardContent Classes:** `pt-6 px-6 pb-6 relative`
  - `pt-6`: Top padding (24px) - ensures icon doesn't touch top
  - `px-6`: Horizontal padding (24px)
  - `pb-6`: Bottom padding (24px)
  - `relative`: For absolute positioning of badge

#### **Status Badge (Top Right)**
- **Position:** `absolute top-4 right-4`
- **Badge Classes:** `px-2 py-1 text-xs font-semibold text-[COLOR]-800 bg-[COLOR]-100 rounded`
- **Badge Colors:**
  - **LIVE:** `text-slate-800 bg-slate-100` (light gray background, dark gray text)
  - **ON DUTY:** `text-green-800 bg-green-100` (light green background, dark green text)
  - **ACTIVE:** `text-blue-800 bg-blue-100` (light blue background, dark blue text)
  - **SUCCESS:** `text-green-800 bg-green-100` (light green background, dark green text)
- **Text:** Uppercase, semibold, extra small
- **Shape:** `rounded` (not `rounded-full`)

#### **Icon Container**
- **Wrapper:** `flex items-center justify-between mb-4 mt-2`
  - `mb-4`: Bottom margin (16px) - spacing between icon and content
  - `mt-2`: Top margin (8px) - additional spacing from top
- **Icon Box:** `w-12 h-12 bg-gradient-to-br from-[COLOR]-700 to-[COLOR]-800 rounded-lg flex items-center justify-center shadow-lg`
  - **Size:** `w-12 h-12` (48px × 48px)
  - **Blue Icons:** `from-blue-700 to-blue-800` (DARKER BLUE)
  - **Green Icons:** `from-green-600 to-green-700` (DARKER GREEN)
  - **Border Radius:** `rounded-lg` (NOT `rounded-xl`)
  - **Shadow:** `shadow-lg`
- **Icon:** `text-white text-xl`

#### **Content Section**
- **Wrapper:** `space-y-1` (4px vertical spacing between elements)
- **Title Label:** `text-sm font-medium text-slate-600`
- **Number Value:** `text-2xl font-bold text-blue-600` (ALWAYS BLUE, not slate)
- **Description:** `text-slate-600 text-sm`

### **Metric Card Grid**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Metric Cards */}
</div>
```

**Exact Specifications:**
- **Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- **Gap:** `gap-4` (16px) - NOT `gap-6`

### **Specific Metric Card Examples**

#### **Active Patrols Card**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">LIVE</span>
    </div>
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-route text-white text-xl"></i>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Active Patrols</p>
      <h3 className="text-2xl font-bold text-blue-600">{metrics.activePatrols}</h3>
      <p className="text-slate-600 text-sm">Currently in progress</p>
    </div>
  </CardContent>
</Card>
```

#### **Officers On Duty Card**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">ON DUTY</span>
    </div>
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-user-shield text-white text-xl"></i>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Officers On Duty</p>
      <h3 className="text-2xl font-bold text-blue-600">{metrics.onDutyOfficers}</h3>
      <p className="text-slate-600 text-sm">Out of {metrics.totalOfficers} total</p>
    </div>
  </CardContent>
</Card>
```

#### **Active Routes Card**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">ACTIVE</span>
    </div>
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-map-marked-alt text-white text-xl"></i>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Active Routes</p>
      <h3 className="text-2xl font-bold text-blue-600">{metrics.activeRoutes}</h3>
      <p className="text-slate-600 text-sm">Patrol routes in use</p>
    </div>
  </CardContent>
</Card>
```

#### **Completion Rate Card (With Progress Bar)**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">SUCCESS</span>
    </div>
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-check-double text-white text-xl"></i>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Completion Rate</p>
      <h3 className="text-2xl font-bold text-blue-600">{metrics.checkpointCompletionRate}%</h3>
      <p className="text-slate-600 text-sm">Checkpoint success</p>
      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${metrics.checkpointCompletionRate}%` }}
        ></div>
      </div>
    </div>
  </CardContent>
</Card>
```

**Progress Bar Specifications:**
- **Container:** `w-full bg-slate-200 rounded-full h-2 mt-2`
- **Fill:** `bg-green-500 h-2 rounded-full transition-all duration-300`
- **Height:** `h-2` (8px)

---

## 6. CONTENT CARDS

### **Content Card Structure (With Header)**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-[COLOR]-700 to-[COLOR]-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-[icon] text-white"></i>
      </div>
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Card Content */}
  </CardContent>
</Card>
```

**Exact Specifications:**
- **CardHeader:** Uses default `p-6` padding
- **CardTitle:** `flex items-center` for icon + title layout
- **Icon Container:** `w-10 h-10 bg-gradient-to-br from-[COLOR]-700 to-[COLOR]-800 rounded-lg flex items-center justify-center mr-2 shadow-lg`
  - **Size:** `w-10 h-10` (40px × 40px) - SMALLER than metric card icons
  - **Gradient:** Same as metric cards (blue-700/800 or green-600/700)
  - **Border Radius:** `rounded-lg`
  - **Icon:** `text-white` (no size specified, uses default)
  - **Margin:** `mr-2` (8px right margin)
- **CardContent:** Uses default `p-6 pt-0` (overridden by CardHeader padding)

### **Content Card Examples**

#### **Emergency Status Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-shield-alt text-white"></i>
      </div>
      Emergency Status
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Note:** Emergency Status uses `from-slate-600 to-slate-700` (gray gradient, not blue)

#### **Weather Conditions Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-cloud-sun text-white"></i>
      </div>
      Weather Conditions
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### **Patrol Schedule Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
          <i className="fas fa-calendar-alt text-white"></i>
        </div>
        Patrol Schedule
      </span>
      {/* Badges or Actions */}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### **Recent Alerts Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
          <i className="fas fa-bell text-white"></i>
        </div>
        Recent Alerts
      </span>
      {/* Badge */}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### **Officer Status Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-users text-white"></i>
      </div>
      Officer Status
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## 7. ICON SYSTEM

### **Icon Size Hierarchy**

#### **Header Icon (Largest)**
- **Size:** `w-16 h-16` (64px × 64px)
- **Gradient:** `from-blue-700 to-blue-800`
- **Border Radius:** `rounded-2xl`
- **Icon Size:** `text-2xl`
- **Example:**
```tsx
<div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
  <i className="fas fa-route text-white text-2xl" />
</div>
```

#### **Metric Card Icons (Medium)**
- **Size:** `w-12 h-12` (48px × 48px)
- **Gradient:** `from-blue-700 to-blue-800` (blue) or `from-green-600 to-green-700` (green)
- **Border Radius:** `rounded-lg`
- **Icon Size:** `text-xl`
- **Example:**
```tsx
<div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
  <i className="fas fa-route text-white text-xl"></i>
</div>
```

#### **Content Card Icons (Small)**
- **Size:** `w-10 h-10` (40px × 40px)
- **Gradient:** `from-blue-700 to-blue-800` (blue) or `from-slate-600 to-slate-700` (gray)
- **Border Radius:** `rounded-lg`
- **Icon Size:** Default (no size class)
- **Example:**
```tsx
<div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
  <i className="fas fa-cloud-sun text-white"></i>
</div>
```

#### **Small Icons (AI, etc.)**
- **Size:** `w-8 h-8` (32px × 32px)
- **Gradient:** `from-blue-700 to-blue-800`
- **Border Radius:** `rounded-lg`
- **Icon Size:** `text-sm`
- **Example:**
```tsx
<div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3">
  <i className="fas fa-brain text-white text-sm"></i>
</div>
```

### **Icon Color Rules**

#### **Blue Icons (Primary)**
- **Gradient:** `from-blue-700 to-blue-800` (DARKER SHADES)
- **Used For:**
  - Active Patrols
  - Active Routes
  - Weather Conditions
  - Patrol Schedule
  - Recent Alerts
  - Officer Status
  - Header
  - Most content cards

#### **Green Icons (Success/Status)**
- **Gradient:** `from-green-600 to-green-700` (DARKER SHADES)
- **Used For:**
  - Officers On Duty
  - Completion Rate

#### **Gray Icons (Neutral)**
- **Gradient:** `from-slate-600 to-slate-700`
- **Used For:**
  - Emergency Status (security/neutral context)

### **Icon Shadow**
- **All Icons:** `shadow-lg` (required on all icon containers)

---

## 8. BADGE SYSTEM

### **Status Badges (Metric Cards - Top Right)**

#### **Badge Structure**
```tsx
<div className="absolute top-4 right-4">
  <span className="px-2 py-1 text-xs font-semibold text-[COLOR]-800 bg-[COLOR]-100 rounded">
    STATUS TEXT
  </span>
</div>
```

**Exact Specifications:**
- **Position:** `absolute top-4 right-4` (16px from top and right)
- **Padding:** `px-2 py-1` (8px horizontal, 4px vertical)
- **Text:** `text-xs font-semibold`
- **Shape:** `rounded` (slightly rounded, NOT `rounded-full`)
- **Text Color:** `text-[COLOR]-800` (dark text)
- **Background:** `bg-[COLOR]-100` (light background)

#### **Badge Color Mapping**

| Badge Text | Background | Text Color | Usage |
|------------|-----------|------------|-------|
| LIVE | `bg-slate-100` | `text-slate-800` | Active Patrols |
| ON DUTY | `bg-green-100` | `text-green-800` | Officers On Duty |
| ACTIVE | `bg-blue-100` | `text-blue-800` | Active Routes |
| SUCCESS | `bg-green-100` | `text-green-800` | Completion Rate |

**CRITICAL:** Badges use LIGHT backgrounds (100) with DARK text (800) - NOT white text on colored backgrounds

### **Status Badges (Content Cards)**

#### **Emergency Status Badge**
```tsx
<div className={`px-3 py-1 rounded-full text-sm font-medium ${
  level === 'normal' ? 'bg-green-100 text-green-800' :
  level === 'elevated' ? 'bg-yellow-100 text-yellow-800' :
  level === 'high' ? 'bg-orange-100 text-orange-800' :
  'bg-red-100 text-red-800'
}`}>
  {level.toUpperCase()}
</div>
```

**Exact Specifications:**
- **Padding:** `px-3 py-1`
- **Shape:** `rounded-full` (pill-shaped)
- **Text:** `text-sm font-medium`
- **Colors:** Light backgrounds (100) with dark text (800)

### **Priority Badges (Patrol Schedule, Alerts)**
```tsx
<Badge variant={
  priority === 'critical' ? 'destructive' :
  priority === 'high' ? 'warning' :
  'default'
}>
  {priority}
</Badge>
```

**Uses Badge component with variants**

### **Officer Status Badges (Content Cards)**
```tsx
<span className={`px-2 py-1 text-xs font-semibold rounded ${
  status === 'on-duty' 
    ? 'text-green-800 bg-green-100' 
    : status === 'break'
    ? 'text-yellow-800 bg-yellow-100'
    : 'text-slate-800 bg-slate-100'
}`}>
  {status}
</span>
```

**Exact Specifications:**
- **Padding:** `px-2 py-1` (8px horizontal, 4px vertical)
- **Text:** `text-xs font-semibold`
- **Shape:** `rounded` (slightly rounded, NOT `rounded-full`) - **CRITICAL: Matches card badge shape**
- **Colors:** Light backgrounds (100) with dark text (800)
- **On-Duty:** `text-green-800 bg-green-100`
- **Break:** `text-yellow-800 bg-yellow-100`
- **Off-Duty/Unavailable:** `text-slate-800 bg-slate-100`

**CRITICAL:** Officer Status badges MUST use `rounded` (not `rounded-full`) to match card badge shape

### **Recent Alerts Badges**

#### **Unread Badge (Header)**
```tsx
<span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
  {unreadCount} unread
</span>
```

**Exact Specifications:**
- **Padding:** `px-2 py-1` (8px horizontal, 4px vertical)
- **Text:** `text-xs font-semibold`
- **Shape:** `rounded` (slightly rounded, NOT `rounded-full`)
- **Colors:** `text-blue-800 bg-blue-100` (light blue background, dark blue text)

#### **Severity Badges (Alert Items)**
```tsx
<span className={`px-2 py-1 text-xs font-semibold rounded ${
  severity === 'critical' 
    ? 'text-red-800 bg-red-100' 
    : severity === 'high'
    ? 'text-orange-800 bg-orange-100'
    : severity === 'medium'
    ? 'text-yellow-800 bg-yellow-100'
    : 'text-blue-800 bg-blue-100'
}`}>
  {severity}
</span>
```

**Exact Specifications:**
- **Padding:** `px-2 py-1` (8px horizontal, 4px vertical)
- **Text:** `text-xs font-semibold`
- **Shape:** `rounded` (slightly rounded, NOT `rounded-full`)
- **Color Mapping:**
  - **Critical:** `text-red-800 bg-red-100`
  - **High:** `text-orange-800 bg-orange-100`
  - **Medium:** `text-yellow-800 bg-yellow-100`
  - **Low:** `text-blue-800 bg-blue-100`

**CRITICAL:** All Recent Alerts badges MUST use `rounded` (not `rounded-full`) to match card badge shape

---

## 9. BUTTON SYSTEM

### **Primary Buttons (Gold Standard Blue)**
```tsx
<Button
  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
>
  <i className="fas fa-[icon] mr-2"></i>
  Button Text
</Button>
```

**Exact Specifications:**
- **Background:** `!bg-[#2563eb]` (EXACT HEX - use `!important`)
- **Hover:** `hover:!bg-blue-700` (use `!important`)
- **Text:** `text-white`
- **Size:** Default (`h-10 py-2 px-4 text-sm`)
- **Icon Spacing:** `mr-2` (8px right margin)

### **Secondary Buttons (Outline)**
```tsx
<Button variant="outline">
  Button Text
</Button>
```

**Exact Specifications:**
- **Variant:** `outline`
- **Classes:** `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`

### **Button Sizes**

#### **Default Size (Standard)**
- **Classes:** `h-10 py-2 px-4 text-sm`
- **Height:** 40px
- **Padding:** 8px vertical, 16px horizontal
- **Text:** Small

#### **Small Size**
- **Classes:** `h-8 px-3 text-xs`
- **Height:** 32px
- **Padding:** 12px horizontal
- **Text:** Extra small

#### **Large Size**
- **Classes:** `h-12 px-8 text-base`
- **Height:** 48px
- **Padding:** 32px horizontal
- **Text:** Base

#### **AI Generate Button Size (Enhanced)**
```tsx
<Button
  className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-16 px-6 py-3 text-xl font-semibold"
>
  <i className={`fas fa-[icon] mr-3 text-xl`}></i>
  Generate
</Button>
```

**Exact Specifications:**
- **Height:** `h-16` (64px) - 1.6x default size
- **Padding:** `px-6 py-3` (24px horizontal, 12px vertical)
- **Text Size:** `text-xl` (20px)
- **Font Weight:** `font-semibold`
- **Icon Size:** `text-xl` (20px)
- **Icon Margin:** `mr-3` (12px right margin)
- **Background:** `!bg-[#2563eb]` (EXACT HEX - use `!important`)
- **Hover:** `hover:!bg-blue-700` (use `!important`)

**Usage:** AI Generate buttons in Schedule Suggestions, Template Suggestions, and other AI panels

**Note:** Standard primary actions use DEFAULT size. AI Generate buttons use this enhanced size for better visibility and prominence.

---

## 10. TYPOGRAPHY

### **Headings**

#### **Page Title (Header)**
- **Classes:** `text-3xl font-bold text-slate-900`
- **Size:** 30px (3xl)
- **Weight:** Bold (700)
- **Color:** `text-slate-900` (dark slate)

#### **Card Title (Content Cards)**
- **Classes:** `text-2xl font-semibold leading-none tracking-tight` (CardTitle default)
- **Can Override:** `text-lg font-medium text-slate-900` for smaller titles
- **Size:** 24px (2xl) or 18px (lg)
- **Weight:** Semibold (600) or Medium (500)

#### **Section Headings**
- **Classes:** `text-xl font-semibold text-slate-900`
- **Size:** 20px (xl)
- **Weight:** Semibold (600)

#### **Subsection Headings**
- **Classes:** `text-sm font-medium text-slate-900`
- **Size:** 14px (sm)
- **Weight:** Medium (500)

### **Body Text**

#### **Metric Card Title Label**
- **Classes:** `text-sm font-medium text-slate-600`
- **Size:** 14px (sm)
- **Weight:** Medium (500)
- **Color:** `text-slate-600` (medium gray)

#### **Metric Card Number**
- **Classes:** `text-2xl font-bold text-blue-600`
- **Size:** 24px (2xl)
- **Weight:** Bold (700)
- **Color:** `text-blue-600` (ALWAYS BLUE, not slate)

#### **Metric Card Description**
- **Classes:** `text-slate-600 text-sm`
- **Size:** 14px (sm)
- **Weight:** Normal (400)
- **Color:** `text-slate-600`

#### **Body Text (Standard)**
- **Classes:** `text-slate-900` or `text-slate-600`
- **Primary:** `text-slate-900` (dark)
- **Secondary:** `text-slate-600` (medium gray)

#### **Small Text / Labels**
- **Classes:** `text-xs text-slate-500` or `text-xs text-slate-600`
- **Size:** 12px (xs)
- **Color:** `text-slate-500` (light gray) or `text-slate-600` (medium gray)

### **Text Color Hierarchy**

| Element | Color Class | Usage |
|---------|------------|-------|
| Main Headings | `text-slate-900` | Page titles, card titles |
| Metric Numbers | `text-blue-600` | ALL metric card numbers |
| Body Text | `text-slate-900` | Primary content |
| Secondary Text | `text-slate-600` | Descriptions, labels |
| Muted Text | `text-slate-500` | Timestamps, metadata |
| Status Text (Green) | `text-green-700` | System status (Online, Active, Ready) |
| Status Text (Yellow) | `text-yellow-600` | Warnings, caution |
| Status Text (Red) | `text-red-600` | Errors, critical |

---

## 11. COLOR PALETTE

### **Primary Colors**

#### **Blue (Primary Actions)**
- **Primary Blue:** `#2563eb` (EXACT HEX for buttons)
- **Blue Hover:** `blue-700` (`#1d4ed8`)
- **Blue Text:** `blue-600` (`#2563eb`) - for metric numbers
- **Blue Icon Gradient:** `from-blue-700 to-blue-800`
  - `blue-700`: `#1d4ed8`
  - `blue-800`: `#1e40af`
- **Blue Badge Background:** `blue-100` (`#dbeafe`)
- **Blue Badge Text:** `blue-800` (`#1e40af`)

#### **Green (Success/Status)**
- **Green Icon Gradient:** `from-green-600 to-green-700`
  - `green-600`: `#16a34a`
  - `green-700`: `#15803d`
- **Green Badge Background:** `green-100` (`#dcfce7`)
- **Green Badge Text:** `green-800` (`#166534`)
- **Green Status Text:** `green-700` (`#15803d`)
- **Green Status Dot:** `green-400` (`#4ade80`)
- **Green Progress Bar:** `green-500` (`#22c55e`)

#### **Gray/Slate (Neutral)**
- **Slate-50:** `#f8fafc` (background gradient start)
- **Slate-100:** `#f1f5f9` (background gradient middle, badge backgrounds)
- **Slate-200:** `#e2e8f0` (borders, progress bar background)
- **Slate-500:** `#64748b` (muted text)
- **Slate-600:** `#475569` (secondary text, icon gradient for Emergency Status)
- **Slate-700:** `#334155` (icon gradient end for Emergency Status)
- **Slate-800:** `#1e293b` (badge text)
- **Slate-900:** `#0f172a` (headings, primary text)

### **Status Colors**

#### **Status Dots (Muted)**
- **Green:** `bg-green-400` (`#4ade80`)
- **Blue:** `bg-blue-400` (`#60a5fa`)
- **Yellow:** `bg-yellow-400` (`#facc15`)
- **Orange:** `bg-orange-400` (`#fb923c`)
- **Red:** `bg-red-400` (`#f87171`)
- **Gray:** `bg-gray-500` (`#6b7280`)

**Size:** `w-2 h-2` (8px × 8px) or `w-3 h-3` (12px × 12px)

#### **Status Text Colors**
- **Green Status:** `text-green-700` (darker for better contrast)
- **Yellow Status:** `text-yellow-600`
- **Red Status:** `text-red-600`

### **Background Colors**

#### **Page Background**
- **Gradient:** `bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200`

#### **Card Backgrounds**
- **Card Base:** `bg-white`
- **Card Hover:** `hover:shadow-md` (shadow change, not background)
- **Info Boxes:** `bg-blue-50` (`#eff6ff`)
- **Unread Alerts:** `bg-blue-50 border border-blue-200`
- **Summary Cards:** `bg-slate-50` (`#f8fafc`)

---

## 12. SPACING & PADDING

### **Container Padding**

#### **Main Content Container**
- **Padding:** `px-6 py-6` (24px all sides)

#### **Header Container**
- **Padding:** `px-6 py-6` (24px all sides)

#### **Tab Navigation Container**
- **Padding:** `px-6 py-4` (24px horizontal, 16px vertical)

### **Card Padding**

#### **Metric Cards**
- **CardContent:** `pt-6 px-6 pb-6` (24px top, 24px horizontal, 24px bottom)
- **Icon Container Margin:** `mb-4 mt-2` (16px bottom, 8px top)
- **Content Spacing:** `space-y-1` (4px between title, number, description)

#### **Content Cards**
- **CardHeader:** `p-6` (24px all sides) - default
- **CardContent:** `p-6 pt-0` (24px all sides except top) - default
- **Can Override:** Use custom padding classes if needed

### **Grid Gaps**

#### **Metric Card Grid**
- **Gap:** `gap-4` (16px) - NOT `gap-6`

#### **Content Grid**
- **Two Column:** `gap-6` (24px)
- **Three Column:** `gap-6` (24px)

### **Element Spacing**

#### **Vertical Spacing**
- **Tight:** `space-y-1` (4px)
- **Standard:** `space-y-4` (16px)
- **Large:** `space-y-6` (24px)

#### **Horizontal Spacing**
- **Tight:** `space-x-2` (8px)
- **Standard:** `space-x-3` (12px)
- **Large:** `space-x-4` (16px)

### **Margin Specifications**

#### **Section Spacing**
- **Between Sections:** `mb-6` (24px) or `space-y-6` (24px)

#### **Icon Margins**
- **Icon to Content:** `mb-4` (16px)
- **Icon Top Margin:** `mt-2` (8px) - additional spacing from top
- **Icon Right Margin:** `mr-2` (8px) or `mr-3` (12px)

---

## 13. STATUS INDICATORS

### **Status Dots**

#### **System Status Dots**
```tsx
<div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
<span className="text-green-700 font-medium">Online</span>
```

**Exact Specifications:**
- **Size:** `w-2 h-2` (8px × 8px)
- **Shape:** `rounded-full`
- **Colors:** Muted (400 range)
- **Margin:** `mr-1` (4px right margin)
- **Text:** `text-green-700 font-medium` (darker for contrast)

#### **Schedule Status Dots**
```tsx
<div className={`w-3 h-3 rounded-full ${
  status === 'completed' ? 'bg-green-400' :
  status === 'in-progress' ? 'bg-blue-400' :
  status === 'scheduled' ? 'bg-yellow-400' :
  'bg-gray-500'
}`}></div>
```

**Exact Specifications:**
- **Size:** `w-3 h-3` (12px × 12px) - LARGER than system status dots
- **Colors:** Muted (400 range)
- **Completed:** `bg-green-400`
- **In Progress:** `bg-blue-400`
- **Scheduled:** `bg-yellow-400`
- **Default:** `bg-gray-500`

#### **Alert Severity Dots**
```tsx
<div className={`w-2 h-2 rounded-full ${
  severity === 'critical' ? 'bg-red-400' :
  severity === 'high' ? 'bg-orange-400' :
  severity === 'medium' ? 'bg-yellow-400' :
  'bg-green-400'
}`}></div>
```

**Exact Specifications:**
- **Size:** `w-2 h-2` (8px × 8px)
- **Colors:** Muted (400 range)

#### **Route Performance Dots**
```tsx
<div className={`w-2 h-2 rounded-full ${
  score >= 90 ? 'bg-green-400' :
  score >= 70 ? 'bg-yellow-400' :
  'bg-red-400'
}`}></div>
```

**Exact Specifications:**
- **Size:** `w-2 h-2` (8px × 8px)
- **Colors:** Muted (400 range)

#### **Unread Indicator Dot**
```tsx
<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
```

**Exact Specifications:**
- **Size:** `w-2 h-2` (8px × 8px)
- **Color:** `bg-blue-400` (muted blue)

---

## 14. PROGRESS BARS

### **Completion Rate Progress Bar**
```tsx
<div className="w-full bg-slate-200 rounded-full h-2 mt-2">
  <div 
    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
    style={{ width: `${percentage}%` }}
  ></div>
</div>
```

**Exact Specifications:**
- **Container:** `w-full bg-slate-200 rounded-full h-2 mt-2`
  - **Background:** `bg-slate-200` (light gray)
  - **Height:** `h-2` (8px)
  - **Shape:** `rounded-full`
  - **Margin:** `mt-2` (8px top margin)
- **Fill:** `bg-green-500 h-2 rounded-full transition-all duration-300`
  - **Color:** `bg-green-500` (medium green)
  - **Height:** `h-2` (8px)
  - **Transition:** `transition-all duration-300`
  - **Width:** Dynamic via inline style

---

## 15. CARD HEADERS

### **Content Card Header Structure**
```tsx
<CardHeader>
  <CardTitle className="flex items-center">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
      <i className="fas fa-[icon] text-white"></i>
    </div>
    Card Title
  </CardTitle>
</CardHeader>
```

### **Content Card Header with Actions**
```tsx
<CardHeader>
  <CardTitle className="flex items-center justify-between">
    <span className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-[icon] text-white"></i>
      </div>
      Card Title
    </span>
    {/* Badges or Buttons */}
  </CardTitle>
</CardHeader>
```

**Exact Specifications:**
- **CardTitle:** `flex items-center` or `flex items-center justify-between`
- **Icon Container:** `w-10 h-10` (40px × 40px)
- **Icon Gradient:** `from-blue-700 to-blue-800` (blue) or `from-slate-600 to-slate-700` (gray)
- **Icon Margin:** `mr-2` (8px right margin)
- **Icon Shadow:** `shadow-lg`

---

## 16. BACKGROUND & GRADients

### **Page Background**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
```

**Exact Specifications:**
- **Gradient:** `bg-gradient-to-br` (top-left to bottom-right)
- **Colors:** `from-slate-50 via-slate-100 to-slate-200`
  - Start: `slate-50` (`#f8fafc`)
  - Middle: `slate-100` (`#f1f5f9`)
  - End: `slate-200` (`#e2e8f0`)

### **Header Background**
```tsx
<div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
```

**Exact Specifications:**
- **Backdrop Blur:** `backdrop-blur-xl`
- **Background:** `bg-white/80` (80% opacity white)
- **Border:** `border-b border-white/20` (20% opacity white border)
- **Shadow:** `shadow-lg`

### **Tab Navigation Background**
```tsx
<div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
```

**Exact Specifications:**
- **Backdrop Blur:** `backdrop-blur-xl`
- **Background:** `bg-white/60` (60% opacity white - LIGHTER than header)
- **Border:** `border-b border-white/20`
- **Shadow:** `shadow-lg`

### **Tab Wrapper Background**
```tsx
<div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
```

**Exact Specifications:**
- **Background:** `bg-white/60 backdrop-blur-sm`
- **Padding:** `p-1` (4px)
- **Border:** `border border-white/30`
- **Shadow:** `shadow-lg`

---

## 17. COMPLETE CODE EXAMPLES

### **Complete Dashboard Tab Structure**
```tsx
case 'dashboard':
  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Patrols Card */}
        <Card>
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">LIVE</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-route text-white text-xl"></i>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Active Patrols</p>
              <h3 className="text-2xl font-bold text-blue-600">{metrics.activePatrols}</h3>
              <p className="text-slate-600 text-sm">Currently in progress</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Officers On Duty Card */}
        <Card>
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">ON DUTY</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-user-shield text-white text-xl"></i>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Officers On Duty</p>
              <h3 className="text-2xl font-bold text-blue-600">{metrics.onDutyOfficers}</h3>
              <p className="text-slate-600 text-sm">Out of {metrics.totalOfficers} total</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Active Routes Card */}
        <Card>
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-map-marked-alt text-white text-xl"></i>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Active Routes</p>
              <h3 className="text-2xl font-bold text-blue-600">{metrics.activeRoutes}</h3>
              <p className="text-slate-600 text-sm">Patrol routes in use</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Completion Rate Card */}
        <Card>
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">SUCCESS</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-check-double text-white text-xl"></i>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Completion Rate</p>
              <h3 className="text-2xl font-bold text-blue-600">{metrics.checkpointCompletionRate}%</h3>
              <p className="text-slate-600 text-sm">Checkpoint success</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${metrics.checkpointCompletionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Cards */}
      </div>
    </div>
  );
```

### **Complete Header Structure**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
  {/* HEADER - GOLD STANDARD LAYOUT */}
  <div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
    <div className="relative max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-route text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Patrol Command Center
            </h1>
            <p className="text-slate-600 font-medium">
              Advanced patrol management and security operations
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Tab Navigation */}
  <div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
    <div className="relative max-w-7xl mx-auto px-6 py-4">
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* Main Content */}
  <div className="relative max-w-[1800px] mx-auto px-6 py-6">
    {renderTabContent()}
  </div>
</div>
```

---

## 18. CRITICAL RULES & COMMON MISTAKES

### **❌ NEVER DO THIS**

1. **Metric Cards:**
   - ❌ DON'T use `CardHeader` for metric cards
   - ❌ DON'T use `p-8` padding (use `pt-6 px-6 pb-6`)
   - ❌ DON'T use `gap-6` for metric grid (use `gap-4`)
   - ❌ DON'T use `text-slate-900` for metric numbers (use `text-blue-600`)
   - ❌ DON'T use `rounded-xl` for metric card icons (use `rounded-lg`)
   - ❌ DON'T use `from-blue-600 to-blue-700` for icons (use `from-blue-700 to-blue-800`)
   - ❌ DON'T use white text on colored badge backgrounds (use dark text on light backgrounds)

2. **Icons:**
   - ❌ DON'T use `from-blue-600 to-blue-700` (too light)
   - ❌ DON'T use `from-green-500 to-green-600` (too light)
   - ❌ DON'T forget `shadow-lg` on icon containers
   - ❌ DON'T use different icon sizes inconsistently

3. **Badges:**
   - ❌ DON'T use `bg-blue-500 text-white` (wrong style)
   - ❌ DON'T use `bg-green-500 text-white` (wrong style)
   - ❌ DON'T use `rounded-full` for status badges (use `rounded`)
   - ❌ DON'T use white text (use dark text on light background)

4. **Buttons:**
   - ❌ DON'T use `size="sm"` for primary action buttons
   - ❌ DON'T use `!bg-blue-600` (use exact hex `#2563eb`)
   - ❌ DON'T forget `!important` overrides

5. **Layout:**
   - ❌ DON'T use `max-w-7xl` for main content (use `max-w-[1800px]`)
   - ❌ DON'T center header content (use `justify-center`)
   - ❌ DON'T use `justify-between` for header (centered layout)

### **✅ ALWAYS DO THIS**

1. **Metric Cards:**
   - ✅ ALWAYS use `CardContent` only (NO CardHeader)
   - ✅ ALWAYS use `pt-6 px-6 pb-6` padding
   - ✅ ALWAYS use `gap-4` for metric grid
   - ✅ ALWAYS use `text-blue-600` for metric numbers
   - ✅ ALWAYS use `rounded-lg` for metric card icons
   - ✅ ALWAYS use `from-blue-700 to-blue-800` for blue icons
   - ✅ ALWAYS use `from-green-600 to-green-700` for green icons
   - ✅ ALWAYS use `mb-4 mt-2` for icon container
   - ✅ ALWAYS use `absolute top-4 right-4` for badges
   - ✅ ALWAYS use light backgrounds with dark text for badges

2. **Icons:**
   - ✅ ALWAYS use darker shades (700-800 for blue, 600-700 for green)
   - ✅ ALWAYS include `shadow-lg` on icon containers
   - ✅ ALWAYS use consistent icon sizes per context

3. **Badges:**
   - ✅ ALWAYS use `bg-[COLOR]-100 text-[COLOR]-800` pattern
   - ✅ ALWAYS use `rounded` (not `rounded-full`) for status badges
   - ✅ ALWAYS position with `absolute top-4 right-4`

4. **Buttons:**
   - ✅ ALWAYS use `!bg-[#2563eb] hover:!bg-blue-700 text-white`
   - ✅ ALWAYS use default size for primary actions
   - ✅ ALWAYS include `!important` overrides

5. **Layout:**
   - ✅ ALWAYS use `max-w-[1800px]` for main content
   - ✅ ALWAYS center header content
   - ✅ ALWAYS use `max-w-7xl` for header and tab containers

---

## 19. COLOR REFERENCE TABLE

### **Complete Color Mapping**

| Element | Background | Text/Icon | Usage |
|---------|-----------|-----------|-------|
| **Blue Icons** | `from-blue-700 to-blue-800` | `text-white` | Active Patrols, Active Routes, Weather, Schedule, Alerts, Officers, Header |
| **Green Icons** | `from-green-600 to-green-700` | `text-white` | Officers On Duty, Completion Rate |
| **Gray Icons** | `from-slate-600 to-slate-700` | `text-white` | Emergency Status |
| **Metric Numbers** | - | `text-blue-600` | ALL metric card numbers |
| **LIVE Badge** | `bg-slate-100` | `text-slate-800` | Active Patrols status |
| **ON DUTY Badge** | `bg-green-100` | `text-green-800` | Officers On Duty status |
| **ACTIVE Badge** | `bg-blue-100` | `text-blue-800` | Active Routes status |
| **SUCCESS Badge** | `bg-green-100` | `text-green-800` | Completion Rate status |
| **Primary Buttons** | `!bg-[#2563eb]` | `text-white` | All primary actions |
| **Button Hover** | `hover:!bg-blue-700` | - | Primary button hover |
| **Status Dots** | `bg-[COLOR]-400` | - | System status, alerts, schedules |
| **Progress Bar** | `bg-slate-200` | - | Progress bar background |
| **Progress Fill** | `bg-green-500` | - | Progress bar fill |
| **System Status Text** | - | `text-green-700` | Online, Active, Ready |

---

## 20. SPACING REFERENCE TABLE

### **Complete Spacing Guide**

| Element | Padding/Margin | Value | Usage |
|---------|---------------|-------|-------|
| **Main Container** | `px-6 py-6` | 24px | Main content wrapper |
| **Header Container** | `px-6 py-6` | 24px | Header inner container |
| **Tab Container** | `px-6 py-4` | 24px/16px | Tab navigation container |
| **Metric Card** | `pt-6 px-6 pb-6` | 24px | Metric card content |
| **Icon Top Margin** | `mt-2` | 8px | Additional spacing from top |
| **Icon Bottom Margin** | `mb-4` | 16px | Spacing to content |
| **Content Spacing** | `space-y-1` | 4px | Between title, number, description |
| **Metric Grid Gap** | `gap-4` | 16px | Between metric cards |
| **Content Grid Gap** | `gap-6` | 24px | Between content cards |
| **Section Spacing** | `space-y-6` | 24px | Between sections |
| **Badge Position** | `top-4 right-4` | 16px | Badge from top/right |
| **Icon Right Margin** | `mr-2` | 8px | Icon to title spacing |
| **Button Icon Margin** | `mr-2` | 8px | Icon to text spacing |

---

## 21. COMPONENT SIZE REFERENCE

### **Icon Sizes**

| Context | Size Class | Pixels | Border Radius | Shadow |
|---------|-----------|--------|---------------|--------|
| Header Icon | `w-16 h-16` | 64×64 | `rounded-2xl` | `shadow-lg` |
| Metric Card Icon | `w-12 h-12` | 48×48 | `rounded-lg` | `shadow-lg` |
| Content Card Icon | `w-10 h-10` | 40×40 | `rounded-lg` | `shadow-lg` |
| Small Icon | `w-8 h-8` | 32×32 | `rounded-lg` | - |

### **Status Dot Sizes**

| Context | Size Class | Pixels |
|---------|-----------|--------|
| System Status | `w-2 h-2` | 8×8 |
| Schedule Status | `w-3 h-3` | 12×12 |
| Alert Severity | `w-2 h-2` | 8×8 |
| Route Performance | `w-2 h-2` | 8×8 |
| Unread Indicator | `w-2 h-2` | 8×8 |

### **Progress Bar Sizes**

| Element | Height | Background | Fill Color |
|---------|--------|------------|------------|
| Completion Rate | `h-2` (8px) | `bg-slate-200` | `bg-green-500` |

---

## 22. TYPOGRAPHY REFERENCE TABLE

### **Complete Typography Guide**

| Element | Size Class | Font Size | Weight | Color | Usage |
|---------|-----------|-----------|--------|-------|-------|
| Page Title | `text-3xl` | 30px | `font-bold` | `text-slate-900` | Header title |
| Card Title | `text-2xl` | 24px | `font-semibold` | `text-slate-900` | CardTitle default |
| Card Title (Small) | `text-lg` | 18px | `font-medium` | `text-slate-900` | Smaller card titles |
| Metric Number | `text-2xl` | 24px | `font-bold` | `text-blue-600` | Metric card numbers |
| Section Heading | `text-xl` | 20px | `font-semibold` | `text-slate-900` | Section titles |
| Subsection Heading | `text-sm` | 14px | `font-medium` | `text-slate-900` | Subsection titles |
| Metric Label | `text-sm` | 14px | `font-medium` | `text-slate-600` | Metric card labels |
| Body Text | `text-sm` | 14px | Normal | `text-slate-600` | Descriptions |
| Small Text | `text-xs` | 12px | Normal | `text-slate-500` | Timestamps, metadata |
| Status Text | `text-xs` | 12px | `font-semibold` | `text-[COLOR]-800` | Badge text |
| Button Text | `text-sm` | 14px | `font-medium` | `text-white` | Primary buttons |

---

## 23. COMPLETE IMPLEMENTATION CHECKLIST

### **Before Starting Development**

- [ ] Read this entire blueprint document
- [ ] Understand metric card structure (CardContent only)
- [ ] Understand icon color system (darker shades)
- [ ] Understand badge system (light bg, dark text)
- [ ] Understand button system (exact hex colors)
- [ ] Understand spacing system (exact padding values)

### **During Development**

- [ ] Use `pt-6 px-6 pb-6` for metric cards
- [ ] Use `gap-4` for metric grid
- [ ] Use `text-blue-600` for metric numbers
- [ ] Use `from-blue-700 to-blue-800` for blue icons
- [ ] Use `from-green-600 to-green-700` for green icons
- [ ] Use `bg-[COLOR]-100 text-[COLOR]-800` for badges
- [ ] Use `!bg-[#2563eb]` for primary buttons
- [ ] Use `max-w-[1800px]` for main content
- [ ] Center header content
- [ ] Include `shadow-lg` on all icon containers

### **After Development**

- [ ] Verify all metric cards use CardContent only
- [ ] Verify all icons use darker shades
- [ ] Verify all badges use light backgrounds
- [ ] Verify all numbers are blue
- [ ] Verify all buttons use exact hex
- [ ] Verify spacing matches specifications
- [ ] Verify colors match Gold Standard

---

## 24. QUICK REFERENCE

### **Copy-Paste Templates**

#### **Metric Card Template**
```tsx
<Card>
  <CardContent className="pt-6 px-6 pb-6 relative">
    <div className="absolute top-4 right-4">
      <span className="px-2 py-1 text-xs font-semibold text-[COLOR]-800 bg-[COLOR]-100 rounded">STATUS</span>
    </div>
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-[COLOR]-700 to-[COLOR]-800 rounded-lg flex items-center justify-center shadow-lg">
        <i className="fas fa-[icon] text-white text-xl"></i>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600">Title</p>
      <h3 className="text-2xl font-bold text-blue-600">Value</h3>
      <p className="text-slate-600 text-sm">Description</p>
    </div>
  </CardContent>
</Card>
```

#### **Content Card Template**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
        <i className="fas fa-[icon] text-white"></i>
      </div>
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### **Primary Button Template**
```tsx
<Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
  <i className="fas fa-[icon] mr-2"></i>
  Button Text
</Button>
```

---

## 25. FINAL NOTES

### **Key Principles**

1. **Consistency:** Every element follows the exact same pattern
2. **Darker Shades:** Icons use darker gradients (700-800 for blue, 600-700 for green)
3. **Light Badges:** Badges use light backgrounds (100) with dark text (800)
4. **Blue Numbers:** ALL metric numbers use `text-blue-600`
5. **Exact Hex:** Primary buttons use exact hex `#2563eb`
6. **Proper Padding:** Metric cards use `pt-6 px-6 pb-6`
7. **Proper Spacing:** Metric grid uses `gap-4`
8. **Icon Shadows:** All icons include `shadow-lg`
9. **Centered Header:** Header content is centered
10. **Wide Container:** Main content uses `max-w-[1800px]`

### **This Blueprint is Authoritative**

This document contains EVERY detail needed to implement the Gold Standard. Any future developer or AI assistant should reference this document FIRST before making any changes. All specifications are based on the deployed site at https://benevolent-brioche-83fe74.netlify.app/modules/patrol and have been verified through extensive iteration.

**Last Verified:** 2025-12-06  
**Reference Site:** https://benevolent-brioche-83fe74.netlify.app/modules/patrol  
**Status:** ✅ COMPLETE AND VERIFIED

---

**END OF BLUEPRINT**

