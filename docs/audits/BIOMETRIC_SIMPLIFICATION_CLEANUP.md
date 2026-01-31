# Biometric Simplification — Safe Cleanup Plan

**Goal:** Remove automated facial recognition (training, match %, confidence) and keep **reference photo + structured attributes + human-in-the-loop**. Patrol/agents filter by criteria (e.g. race, height range), review candidates, then confirm in person.

---

## Elsewhere: Simplify to Assist Patrol, Not Replace

Before or alongside the biometric cleanup, consider these so the system **assists** patrol (shortlists, suggestions, alerts) instead of **replacing** human decisions:

| Area | Today (replace risk) | Simplify to (assist) |
|------|----------------------|----------------------|
| **Incident log — approval** | Auto-approval rules (trust score → auto-approve). Settings: `auto_approval_enabled`, `auto_approval_threshold`, AutoApprovalSettingsModal. | Remove or disable auto-approval. Use trust score only to **flag** “suggested for quick review” or “recommend manager review.” Human always approves/rejects. |
| **Incident log — assignment** | “Auto-assign incidents,” “Auto-assign hardware incidents,” “Auto-assign converted incidents.” | **Suggest** assignee or queue; officer/dispatcher **assigns**. No automatic assignment without human action. |
| **Incident log — AI classification** | Backend can apply AI type/severity when confidence ≥ threshold. | **Suggest** type/severity and show to user; user **confirms or overrides**. Never auto-apply classification; store AI suggestion and confidence for audit only. |
| **Incident log — Predictions** | “Consider for auto-approval eligibility,” confidence % on predictions. | Rephrase to “Suggested for quick review.” Confidence = “model suggestion,” not “system decision.” |
| **Patrol — AI/officer** | Backend stubs: recommend officer, AI schedule suggestions, AI suggest templates. | Keep as **suggestions only**: “Suggested officer,” “Suggested route/time.” Patrol lead **assigns**; no auto-assign. |
| **Patrol — biometric verification** | Setting `biometricVerification` (unclear if FR). | Clarify as “Verify identity in person (e.g. ID check)” or remove if it meant automated FR. |
| **Access control — emergency** | “Automatically restore standard mode after timeout.” | Prefer “Alert after timeout” so human confirms restore; or keep auto-restore but make it very explicit and configurable (assist = remind, not hide). |
| **Guest safety** | `response_team_assignment: "automatic"`, `auto_escalation`. | **Suggest** response team / escalation; dispatcher **assigns** or **escalates.** No full auto-assign or auto-escalate without human action. |
| **Digital handover** | `autoAssignTasks`, `requireApproval`. | **Suggest** assignee; require human to confirm assignment. |

**Principle:** Any “auto-approve,” “auto-assign,” “auto-escalate,” or “system confidence → apply” should become **suggest/flag/alert**, with the **human as the single decider** (approve, assign, escalate, classify). Thresholds and scores are then **assist** (sort order, “review recommended”) not **replace** (system does it).

---

## Summary of Changes (Biometric)

| Area | Remove / Deprecate | Keep | Add (optional) |
|------|--------------------|------|----------------|
| **Banned Individuals** | Training, accuracy %, confidence threshold, "facial recognition check" API, Biometrics tab as "FR system" | Reference photo (`photo_url`), list + filters, detection history (as manual confirmations) | Filter by height range, race/ethnicity, build, age range for "boil down" |
| **Access Control** | — | Biometric as *credential type* (door hardware) | — |
| **Patrol / Visitor** | `biometric_verification` if it meant "FR match" | — | Patrol lookup by criteria → shortlist → human confirm |
| **Incident / Other** | `similarity` only where it meant face match | Pattern recognition (incident analytics) | — |

---

## 1. Frontend — Banned Individuals Feature

### 1.1 Remove or repurpose: Biometrics tab (`FacialRecognitionTab`)

**Option A — Remove tab:**  
- **Files:**  
  - `frontend/src/features/banned-individuals/BannedIndividualsOrchestrator.tsx` — remove `FacialRecognitionTab` import and tab `{ id: 'facial-recognition', label: 'Biometrics' }` and its `case` in `renderTabContent`.  
  - `frontend/src/features/visitor-security/components/tabs/BannedIndividualsTab.tsx` — remove `FacialRecognitionTab` import and sub-tab `{ id: 'facial-recognition', label: 'Biometrics' }` and its `case`.  
- **Optional:** Delete `frontend/src/features/banned-individuals/components/tabs/FacialRecognitionTab.tsx` (or keep for later "Reference photos & retention" settings only).

**Option B — Repurpose tab:**  
- Rename to e.g. **"Reference photos"** or **"Photo & data retention"**.  
- Remove: Training status, Detection accuracy %, Real-time monitoring, Confidence threshold slider, "Trigger training" button.  
- Keep (or add): Retention for reference photos, note that matching is manual (filter + compare photo in person).

### 1.2 Types and state (`banned-individuals`)

**Files:**  
- `frontend/src/features/banned-individuals/types/banned-individuals.types.ts`  
  - **Keep:** `BannedIndividual.photoUrl`, `facialRecognitionData?` (can store opaque reference data if backend keeps it).  
  - **Remove or repurpose:** `FacialRecognitionStats` (accuracy, trainingStatus) if no longer used; or keep only `retentionDays`-style fields.  
  - **Keep:** `DetectionAlert` and `confidence` only if you still record **manual** confirmations (e.g. "Officer X confirmed match"); optionally rename to something like "confirmed by" instead of implying system confidence.  
  - **Metrics:** In `BannedIndividualsMetrics`, rename or drop `facialRecognitionAccuracy`; e.g. replace with "Records with photo" count.

- `frontend/src/features/banned-individuals/hooks/useBannedIndividualsState.ts`  
  - Remove or stub: `facialRecognitionStats` (trainingStatus, accuracy), `handleTriggerTraining`, `getFacialRecognitionStatus`, `updateFacialRecognitionConfig`, `triggerFacialRecognitionTraining`.  
  - Remove subscriptions/calls for `facial_recognition_hardware_status` and any "FR match" alerts driven by confidence threshold.  
  - Keep: Photo upload (as reference photo only), settings for retention / alerts if repurposed (e.g. "Alert when new photo added" not "when FR match").

### 1.3 UI copy and display

**Files:**  
- `frontend/src/features/banned-individuals/components/tabs/OverviewTab.tsx`  
  - Remove or replace metric "Facial Recognition" / "Facial Recognition X%". Replace with e.g. "Records with photo" or remove.

- `frontend/src/features/banned-individuals/components/tabs/DetectionsTab.tsx`  
  - If detections become **manual confirmations only:** keep list but change label "X% confidence" to something like "Confirmed by [agent]" or remove confidence and show "Confirmed at [location]".

- `frontend/src/features/banned-individuals/components/tabs/SettingsTab.tsx`  
  - "Facial Recognition Alerts" → repurpose to "Detection alerts" (e.g. when a manual confirmation is recorded) or remove.  
  - "Biometric Data Purge" → rename to "Reference photo retention" or "Photo & data retention".

- `frontend/src/features/banned-individuals/components/modals/PhotoUploadModal.tsx`  
  - Copy: "biometric image" / "facial recognition" → "reference photo" (e.g. "Upload a clear reference photo for in-person verification"). Remove "training_model_active" style copy.

- `frontend/src/features/banned-individuals/components/modals/CreateIndividualModal.tsx`  
  - "Biometric Photo" → "Reference photo".  
  - Helper text: "Upload a clear, front-facing photo for staff to compare during in-person checks" (no "facial recognition").

- `frontend/src/features/banned-individuals/components/modals/DetailsModal.tsx`  
  - "X% Confidence" → remove or replace with "Confirmed by" / manual confirmation info.

### 1.4 Banned Individuals service (frontend)

**File:** `frontend/src/services/BannedIndividualsService.ts`  
- **Remove or stub:**  
  - `getFacialRecognitionStatus()`  
  - `updateFacialRecognitionConfig()`  
  - `triggerFacialRecognitionTraining()`  
- **Keep:**  
  - Create/update individual with `photo_url` and optionally `facialRecognitionData` (if backend keeps it for reference only).  
- **Optional:** Add `searchBannedIndividuals(filters)` that accepts e.g. `heightMin, heightMax, raceOrEthnicity, ageRange, build` for "boil down" (once backend supports it).

### 1.5 Advanced filters (boil-down)

**File:** `frontend/src/features/banned-individuals/components/modals/AdvancedFiltersModal.tsx`  
- **Keep:** Ban type, nationality.  
- **Add (when backend supports):** Height range, race/ethnicity, age range, build (slim/medium/heavy), distinguishing features (free text).  
- Backend must expose filter params and return filtered list; frontend just passes criteria.

---

## 2. Frontend — Other Modules (minimal)

- **Access Control:** Keep "biometric" as a **credential type** for doors (card/biometric/pin). No change to BiometricConfigModal logic unless you want to rename "Facial recognition" to "Biometric (e.g. fingerprint)" to avoid implying face matching.  
- **Patrol:** `biometricVerification` in settings — clarify in copy: "Verify identity (e.g. ID check)" or remove if it was only for FR.  
- **Visitor security:** Types `event_type: 'face_recognition'` and `confidence_score` — remove or repurpose to "manual_verification" with no score.  
- **Incident log:** `similarity` in types — keep only where it means **incident pattern** similarity, not face match.  
- **Tests:** `frontend/src/pages/__tests__/BannedIndividuals.test.tsx` — remove or update assertions for "Facial Recognition", "96.8%", "Facial Recognition Management", "facial recognition intelligence".

---

## 3. Backend — Banned Individuals

### 3.1 API routes to remove or stub

**File:** `backend/api/banned_individuals_endpoints.py` (and any duplicate in `backend/routes/banned_individuals_routes.py`)  
- **Remove or return 410/501:**  
  - `GET /facial-recognition-status`  
  - `PUT /facial-recognition/config`  
  - `POST /facial-recognition/train`  
- **Remove or repurpose:**  
  - `POST /facial-recognition` (or `/facial-recognition/check`) that takes a photo and returns match %. Replace with a **filtered list** endpoint: e.g. `GET /banned-individuals/search?height_min=&height_max=&ethnicity=&age_min=&age_max=` returning candidates for human review (no confidence score).

### 3.2 Service layer

**File:** `backend/services/banned_individuals_service.py`  
- **Remove or stub:**  
  - `facial_recognition_check(photo_data)`  
  - `get_facial_recognition_status()`  
  - `update_facial_recognition_config()`  
  - `trigger_facial_recognition_training()`  
- **Keep:**  
  - CRUD for banned individuals with `photo_url` and `facial_recognition_data` (nullable; can keep for future or drop column later).  
  - `record_detection(banned_id, location, ...)` — repurpose to "manual confirmation" (optionally add `confirmed_by_user_id`, remove or ignore `confidence`).

### 3.3 Model and schema

**File:** `backend/models.py` — `BannedIndividual`  
- **Keep:** `photo_url`, `facial_recognition_data` (optional; can deprecate later).  
- **Optional (for boil-down):** Add columns e.g. `height_cm`, `ethnicity`, `build`, `distinguishing_notes` (or a JSON `physical_description`). Requires migration.

**File:** `backend/schemas.py`  
- **BannedIndividualCreate/Response:** Keep `photo_url`, `facial_recognition_data` optional.  
- Add optional filter fields for search (e.g. in a `BannedIndividualSearch` schema): `height_min`, `height_max`, `ethnicity`, `age_min`, `age_max`.

### 3.4 Tests

**Files:**  
- `backend/tests/test_services.py` — Remove or rewrite `test_facial_recognition_check` and any tests for `get_facial_recognition_status` / `trigger_facial_recognition_training`.  
- `backend/tests/test_api_endpoints.py` — Remove or adjust tests for facial-recognition endpoints.

---

## 4. Safe Execution Order

1. **Backend:** Stub or remove FR endpoints and service methods (no DB drop yet). Add optional filter params to list endpoint if you want boil-down.
2. **Frontend — Banned Individuals:** Remove or repurpose Biometrics tab; remove training/accuracy/confidence from state and UI; update copy to "reference photo" and manual verification.
3. **Frontend — Services:** Remove calls to `getFacialRecognitionStatus`, `updateFacialRecognitionConfig`, `triggerFacialRecognitionTraining`; remove or replace `facial_recognition_check` with search-by-criteria.
4. **Tests:** Update or remove Banned Individuals and backend FR tests.
5. **Optional:** Add DB fields and API for height/ethnicity/age/build; extend Advanced Filters and add patrol "lookup by criteria" flow.

---

## 5. What Not to Touch (without separate plan)

- **Access Control** biometric as credential type (door hardware).  
- **Incident** pattern recognition (non-face).  
- **Guest safety / Package AI** string similarity (names, etc.).  
- **Smart lockers / System admin** mentions of "Biometric" as feature name only (rename in copy if desired).

---

*Document generated for biometric simplification: reference photo + filter + human verification only.*
