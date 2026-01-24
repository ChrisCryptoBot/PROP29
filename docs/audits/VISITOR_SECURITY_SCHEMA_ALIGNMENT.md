# VISITOR SECURITY MODULE - SCHEMA ALIGNMENT

**Date:** 2025-01-27  
**Module:** Visitor Security  
**Phase:** Phase 3 - Architecture Refactor (Step 1: Schema Alignment)  
**Status:** ✅ **COMPLETE**

---

## 📊 SCHEMA ALIGNMENT SUMMARY

### Alignment Status
✅ **ALIGNED** - The backend API schemas in `visitor_endpoints.py` align well with the frontend requirements.

### Key Findings
- ✅ Frontend `Visitor` interface matches backend `VisitorResponse` schema
- ✅ Frontend `VisitorCreate` matches backend `VisitorCreate` schema
- ✅ Frontend `Event` interface matches backend `EventResponse` schema
- ✅ Frontend `SecurityRequest` matches backend `SecurityRequestResponse` schema
- ✅ Enums align: `VisitorStatus`, `SecurityClearance`, `RiskLevel`, `VisitType`
- ✅ Property isolation: `property_id` added to all schemas

---

## 🔄 FIELD MAPPING

### Visitor Entity Mapping

| Frontend Field | Backend Field | Type | Status |
|----------------|---------------|------|--------|
| `id` | `id` | `string` | ✅ Match |
| `property_id` | `property_id` | `string` | ✅ Added |
| `first_name` | `first_name` | `string` | ✅ Match |
| `last_name` | `last_name` | `string` | ✅ Match |
| `email` | `email` | `string?` | ✅ Match |
| `phone` | `phone` | `string` | ✅ Match |
| `company` | `company` | `string?` | ✅ Match |
| `purpose` | `purpose` | `string` | ✅ Match |
| `host_name` | `host_name` | `string` | ✅ Match |
| `host_phone` | `host_phone` | `string?` | ✅ Match |
| `host_email` | `host_email` | `string?` | ✅ Match |
| `host_room` | `host_room` | `string?` | ✅ Match |
| `check_in_time` | `check_in_time` | `string?` | ✅ Match |
| `check_out_time` | `check_out_time` | `string?` | ✅ Match |
| `expected_duration` | `expected_duration` | `number` | ✅ Match |
| `status` | `status` | `VisitorStatus` | ✅ Match |
| `location` | `location` | `string` | ✅ Match |
| `badge_id` | `badge_id` | `string?` | ✅ Match |
| `qr_code` | `qr_code` | `string?` | ✅ Match |
| `photo_url` | `photo_url` | `string?` | ✅ Match |
| `vehicle_number` | `vehicle_number` | `string?` | ✅ Match |
| `notes` | `notes` | `string?` | ✅ Match |
| `created_at` | `created_at` | `string` | ✅ Match |
| `updated_at` | `updated_at` | `string` | ✅ Match |
| `security_clearance` | `security_clearance` | `SecurityClearance` | ✅ Match |
| `risk_level` | `risk_level` | `RiskLevel` | ✅ Match |
| `visit_type` | `visit_type` | `VisitType` | ✅ Match |
| `wifi_registered` | `wifi_registered` | `boolean` | ✅ Match |
| `event_id` | `event_id` | `string?` | ✅ Match |
| `event_name` | `event_name` | `string?` | ✅ Match |
| `event_badge_type` | `event_badge_type` | `EventBadgeType?` | ✅ Match |
| `access_points` | `access_points` | `string[]?` | ✅ Match |
| `badge_expires_at` | `badge_expires_at` | `string?` | ✅ Match |

**Note:** Frontend-only fields (`security_requests`, `emergency_contacts`) are stored in the visitor object but not sent to the backend. These are managed separately.

### Event Entity Mapping

| Frontend Field | Backend Field | Type | Status |
|----------------|---------------|------|--------|
| `id` | `id` | `string` | ✅ Match |
| `property_id` | `property_id` | `string` | ✅ Added |
| `name` | `name` | `string` | ✅ Match |
| `type` | `type` | `string` | ✅ Match |
| `start_date` | `start_date` | `string` | ✅ Match |
| `end_date` | `end_date` | `string` | ✅ Match |
| `location` | `location` | `string` | ✅ Match |
| `expected_attendees` | `expected_attendees` | `number` | ✅ Match |
| `badge_types` | `badge_types` | `EventBadgeType[]` | ✅ Match |
| `qr_code_enabled` | `qr_code_enabled` | `boolean` | ✅ Match |
| `access_points` | `access_points` | `string[]` | ✅ Match |

### SecurityRequest Entity Mapping

| Frontend Field | Backend Field | Type | Status |
|----------------|---------------|------|--------|
| `id` | `id` | `string` | ✅ Match |
| `type` | `type` | `SecurityRequestType` | ✅ Match |
| `description` | `description` | `string` | ✅ Match |
| `status` | `status` | `string` | ✅ Match |
| `priority` | `priority` | `string` | ✅ Match |
| `created_at` | `created_at` | `string` | ✅ Match |
| `location` | `location` | `string?` | ✅ Match |
| `assigned_to` | `assigned_to` | `string?` | ✅ Match |
| `response` | `response` | `string?` | ✅ Match |

---

## ⚠️ IMPORTANT NOTES

### Database Model vs API Schema
- **Database Model** (`models.py`): Uses `visitor_id`, `host_user_id`, `purpose_of_visit`, etc.
- **API Schema** (`visitor_endpoints.py`): Uses `id`, `host_name`, `purpose`, etc.
- **Decision:** We use the API schema (`visitor_endpoints.py`) which aligns with frontend requirements.
- **Future:** Full service integration will require mapping between API schema and database model in the service layer.

### Frontend-Only Fields
- `security_requests` (array): Stored in visitor object, managed separately via API
- `emergency_contacts` (array): Frontend-only, not sent to backend
- These fields are preserved in the frontend `Visitor` interface for UI display

### Property Isolation
- ✅ `property_id` added to all create/response schemas
- ✅ Property-level filtering enforced in all GET endpoints
- ✅ Property access checks enforced in all POST/PUT/DELETE endpoints

---

## 📁 FILES CREATED

### Type Definitions
- ✅ `frontend/src/features/visitor-security/types/visitor-security.types.ts`
  - All enums: `VisitorStatus`, `SecurityClearance`, `RiskLevel`, `VisitType`, `SecurityRequestType`, `EventBadgeType`
  - All interfaces: `Visitor`, `VisitorCreate`, `VisitorUpdate`, `Event`, `EventCreate`, `SecurityRequest`, etc.
  - All filters: `VisitorFilters`, `EventFilters`, `SecurityRequestFilters`
  - Metrics: `VisitorMetrics`

### Service Layer
- ✅ `frontend/src/features/visitor-security/services/VisitorService.ts`
  - All API methods: `getVisitors`, `getVisitor`, `createVisitor`, `checkInVisitor`, `checkOutVisitor`, etc.
  - Event methods: `getEvents`, `createEvent`, `deleteEvent`, `registerEventAttendee`
  - Security request methods: `getSecurityRequests`, `createSecurityRequest`
  - QR code method: `getVisitorQRCode`

---

## ✅ SCHEMA ALIGNMENT CHECKLIST

- ✅ Frontend types match backend API schemas
- ✅ All enums aligned with backend enums
- ✅ Property isolation added to all schemas
- ✅ Type definitions file created
- ✅ Service layer created with all API methods
- ✅ Filters and queries supported
- ✅ Frontend-only fields documented

---

## 🎯 NEXT STEPS

### Step 2: State Extraction
1. Create `useVisitorState` hook
2. Create `VisitorContext` provider
3. Extract all state from monolithic component

### Step 3: Component Decomposition
1. Extract shared components (`VisitorListItem`, `StatusBadge`, etc.)
2. Implement missing modals (`RegisterVisitorModal`, `CreateEventModal`)
3. Separate 7 tabs into standalone components

### Step 4: Integration
1. Wire components to context
2. Replace setTimeout mocks with service calls
3. Test all workflows end-to-end

---

**Schema Alignment Complete**  
**Service Layer:** ✅ **CREATED**  
**Next Step:** State Extraction (Context & Hooks)
