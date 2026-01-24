# INCIDENT LOG MODULE - SECURITY & CRITICAL AUDIT

**Module**: Incident Log  
**Audit Date**: 2025-01-27  
**Phase**: Phase 1 - Security & Critical Audit  
**Auditor**: AI Assistant  

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. AUTHENTICATION BYPASS - `get_current_user` Dependency Issue

**Issue**: The `get_current_user` function in `backend/api/auth_endpoints.py` is a route handler, not a dependency function. It cannot be used with `Depends()` and provides no authentication.

- **Location**: `backend/api/incident_endpoints.py:5,36` and all endpoints
- **Risk**: **AUTHENTICATION BYPASS** - All endpoints using `Depends(get_current_user)` will fail or bypass authentication
- **Current Code**:
  ```python
  # backend/api/auth_endpoints.py:92-97
  @router.get("/me")
  async def get_current_user():  # This is a route handler, NOT a dependency!
      return {
          "user_id": 1,
          "username": "admin",
          "role": "admin"
      }
  ```
- **Expected**: A dependency function that validates JWT tokens and returns a User object
- **Fix**: Create a proper dependency function that validates Bearer tokens
- **Effort**: 4-6 hours

### 2. HARDCODED API URL - Environment Variable Missing

**Issue**: Frontend uses hardcoded `http://localhost:8000` for API calls, not environment-aware.

- **Location**: `frontend/src/pages/modules/IncidentLogModule.tsx:410`
- **Risk**: **Configuration Vulnerability** - Won't work in production, breaks if backend URL changes
- **Current Code**:
  ```typescript
  const response = await fetch('http://localhost:8000/incidents/ai-classify', {
  ```
- **Fix**: Use environment variable from `config/env.ts` or create one
- **Effort**: 30 minutes

### 3. SENSITIVE DATA IN CONSOLE LOGS - Password Logging

**Issue**: Backend authentication logs passwords in plain text.

- **Location**: `backend/api/auth_endpoints.py:33`
- **Risk**: **Information Disclosure** - Passwords logged in plain text
- **Current Code**:
  ```python
  logger.info(f"   Raw request.password: {repr(request.password)}")
  logger.info(f"   Received password: {repr(request.password)}")
  ```
- **Fix**: Remove password logging, only log that authentication attempt was made
- **Effort**: 15 minutes

### 4. NO AUTHORIZATION CHECKS - Missing RBAC

**Issue**: Backend endpoints accept `current_user` but don't verify user permissions for operations (e.g., can user delete incidents? Can user view all incidents?).

- **Location**: All endpoints in `backend/api/incident_endpoints.py`
- **Risk**: **Authorization Bypass** - Users may perform unauthorized operations
- **Current Behavior**: All authenticated users have same permissions
- **Fix**: Add role-based access control (RBAC) checks for:
  - DELETE operations (admin only?)
  - UPDATE operations (reporter/assignee/admin?)
  - VIEW operations (property-based filtering?)
- **Effort**: 8-12 hours

### 5. NO PROPERTY-LEVEL AUTHORIZATION

**Issue**: Users can access/modify incidents from any property, not just their own.

- **Location**: `backend/services/incident_service.py:15-62`
- **Risk**: **Data Access Control Bypass** - Users can view/modify incidents from other properties
- **Current Behavior**: Filter by property_id if provided, but no enforcement that user belongs to that property
- **Fix**: Add property membership check - users can only access incidents from properties they belong to
- **Effort**: 4-6 hours

### 6. ERROR MESSAGES LEAK SYSTEM INFORMATION

**Issue**: Backend error messages include full exception details.

- **Location**: `backend/api/incident_endpoints.py:49,75,105,127,148,167,188`
- **Risk**: **Information Disclosure** - Stack traces and internal errors exposed to clients
- **Current Code**:
  ```python
  raise HTTPException(status_code=500, detail=f"Failed to retrieve incidents: {str(e)}")
  ```
- **Fix**: Log full error server-side, return generic error messages to clients
- **Effort**: 2-3 hours

---

## 🟡 HIGH PRIORITY SECURITY ISSUES

### 7. MISSING INPUT VALIDATION - Client-Side Only

**Issue**: Frontend has basic validation (e.g., description must be 10+ chars), but no server-side validation of string lengths, formats, etc.

- **Location**: 
  - Frontend: `frontend/src/pages/modules/IncidentLogModule.tsx:400-402`
  - Backend: `backend/schemas.py:229-254` (Pydantic models exist but no length limits)
- **Risk**: **Input Validation Bypass** - Malicious users can bypass client validation
- **Fix**: Add Pydantic validators for:
  - Title max length (200 chars matches DB)
  - Description max length (reasonable limit)
  - Location structure validation
- **Effort**: 2-3 hours

### 8. NO RATE LIMITING ON API ENDPOINTS

**Issue**: API endpoints have no rate limiting, allowing DoS attacks.

- **Location**: All endpoints in `backend/api/incident_endpoints.py`
- **Risk**: **DoS Attack** - Attackers can spam endpoints
- **Fix**: Add rate limiting middleware (e.g., using `slowapi`)
- **Effort**: 2-3 hours

### 9. NO CSRF PROTECTION

**Issue**: No CSRF tokens on state-changing operations (POST, PUT, DELETE).

- **Location**: All endpoints in `backend/api/incident_endpoints.py`
- **Risk**: **CSRF Attack** - Attackers can perform actions on behalf of authenticated users
- **Fix**: Add CSRF token validation or use SameSite cookies
- **Effort**: 4-6 hours

### 10. SQL INJECTION RISK - String Formatting in Queries

**Issue**: While SQLAlchemy ORM is used (which is parameterized), the query parameters are passed as strings without validation against enum values.

- **Location**: `backend/services/incident_service.py:26-31`
- **Risk**: **SQL Injection** (Low) - String parameters not validated against enum
- **Current Code**:
  ```python
  if status:
      query = query.filter(Incident.status == status)  # status is string, not enum
  ```
- **Fix**: Validate status/severity against IncidentStatus/IncidentSeverity enums
- **Effort**: 1-2 hours

### 11. CORS CONFIGURATION TOO PERMISSIVE

**Issue**: CORS allows all origins (`allow_origins=["*"]`).

- **Location**: `backend/main.py:49`
- **Risk**: **CORS Misconfiguration** - Any origin can make requests
- **Current Code**:
  ```python
  allow_origins=["*"],  # Allow all origins for debugging
  ```
- **Fix**: Restrict to specific frontend origins in production
- **Effort**: 30 minutes

### 12. NO FILE UPLOAD VALIDATION

**Issue**: Frontend has evidence upload functionality, but no validation of file type, size, or content.

- **Location**: `frontend/src/pages/modules/IncidentLogModule.tsx:446-479`
- **Risk**: **Malicious File Upload** - Users can upload any file type/size
- **Current Behavior**: Creates object URL from file, no validation
- **Fix**: Add file type whitelist, size limits, content validation
- **Effort**: 3-4 hours

### 13. AUTH TOKEN IN LOCALSTORAGE

**Issue**: Authentication tokens stored in localStorage, vulnerable to XSS.

- **Location**: `frontend/src/pages/modules/IncidentLogModule.tsx:414`
- **Risk**: **XSS Attack** - If XSS occurs, tokens can be stolen
- **Current Code**:
  ```typescript
  'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
  ```
- **Fix**: Consider httpOnly cookies or secure storage (though localStorage is common in SPAs)
- **Effort**: 4-6 hours (requires backend cookie changes)

### 14. NO INPUT SANITIZATION - XSS Risk

**Issue**: User input (title, description) is stored and displayed without sanitization.

- **Location**: 
  - Frontend: Forms in `IncidentLogModule.tsx`
  - Backend: Stores as-is in database
- **Risk**: **XSS Attack** - Malicious scripts can be injected in incident descriptions
- **Fix**: Sanitize HTML on display (frontend) and/or storage (backend)
- **Effort**: 3-4 hours

---

## 🟢 SECURITY IMPROVEMENTS (Non-blocking)

### 15. HARDCODED SECRET KEY

**Issue**: Development secret key hardcoded in `main.py`.

- **Location**: `backend/main.py:11`
- **Risk**: **Secret Exposure** (Low in dev, Critical in prod)
- **Current Code**:
  ```python
  os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production-1234567890abcdef")
  ```
- **Fix**: Ensure production uses environment variable, never hardcoded
- **Effort**: Already using setdefault - ensure production env is set

### 16. NO PASSWORD COMPLEXITY REQUIREMENTS

**Issue**: Password validation only checks length (8 chars), no complexity requirements.

- **Location**: `backend/schemas.py:177`
- **Risk**: **Weak Passwords** - Users can use simple passwords
- **Current Code**:
  ```python
  password: str = Field(..., min_length=8)
  ```
- **Fix**: Add password complexity validator (uppercase, lowercase, numbers, special chars)
- **Effort**: 1 hour

### 17. MOCK AUTHENTICATION IN PRODUCTION CODE

**Issue**: Authentication uses hardcoded credentials for development.

- **Location**: `backend/api/auth_endpoints.py:41-42`
- **Risk**: **Weak Authentication** - Development auth code in production
- **Current Code**:
  ```python
  valid_emails = ["admin@proper29.com", "admin@proper.com", "admin"]
  valid_password = "admin123"
  ```
- **Fix**: Use proper database-backed authentication in production
- **Effort**: 8-12 hours (full auth system)

### 18. NO AUDIT LOGGING

**Issue**: No logging of who performed what actions (create, update, delete incidents).

- **Location**: All endpoints in `backend/api/incident_endpoints.py`
- **Risk**: **No Accountability** - Can't track who made changes
- **Fix**: Add audit logging for all state-changing operations
- **Effort**: 4-6 hours

### 19. NO REQUEST IDENTIFIER IN ERROR LOGS

**Issue**: Error logs don't include request IDs for tracing.

- **Location**: All error logging in `backend/api/incident_endpoints.py`
- **Risk**: **Debugging Difficulty** - Hard to trace errors to specific requests
- **Fix**: Add request ID middleware and include in logs
- **Effort**: 2-3 hours

### 20. NO API VERSIONING

**Issue**: API endpoints have no versioning scheme.

- **Location**: `backend/api/incident_endpoints.py`
- **Risk**: **Breaking Changes** - Future changes may break clients
- **Fix**: Add API versioning (e.g., `/api/v1/incidents`)
- **Effort**: 2-3 hours

---

## ✅ SECURITY COMPLIANCE CHECKLIST

### Authentication & Authorization
- [ ] ❌ All API calls include proper auth headers (BACKEND ISSUE - get_current_user broken)
- [ ] ❌ Role-based access control (RBAC) enforcement (NO RBAC CHECKS)
- [ ] ❌ Protected routes have auth guards (AUTH BROKEN)
- [ ] ❌ User permissions checked before sensitive operations (NO PERMISSION CHECKS)
- [ ] ❌ No authorization bypass vulnerabilities (PROPERTY-LEVEL ACCESS NOT ENFORCED)

### Input Validation
- [x] ✅ CLIENT-SIDE: Form inputs have validation (Basic validation exists)
- [ ] ❌ SERVER-SIDE: Backend validates all inputs (Pydantic models but no length limits)
- [ ] ⚠️ SQL injection prevention (SQLAlchemy ORM used, but enum validation missing)
- [ ] ❌ XSS prevention (No sanitization)
- [ ] ❌ File upload validation (No validation)

### Data Security
- [ ] ❌ No sensitive data in client-side code (Hardcoded API URL, passwords in logs)
- [ ] ❌ No sensitive data in console.logs (Passwords logged in backend)
- [ ] ❌ No sensitive data in error messages (Full error details exposed)
- [x] ✅ HTTPS usage for API calls (Assumed in production)
- [ ] ⚠️ Secure cookie flags (Not applicable - using localStorage)

### CSRF Protection
- [ ] ❌ CSRF tokens on state-changing operations (NO CSRF PROTECTION)
- [ ] ❌ Proper SameSite cookie settings (Using localStorage, not cookies)
- [x] ✅ POST/PUT/DELETE endpoints exist (But not protected)

### Secret Management
- [ ] ⚠️ All API keys use environment variables (Hardcoded API URL in frontend)
- [ ] ❌ No hardcoded credentials (Hardcoded password in backend auth)
- [x] ✅ .env files not committed (Assumed)
- [x] ✅ Secrets not exposed in build artifacts (Assumed)

### Error Handling Security
- [ ] ❌ Error messages don't leak system information (Full exceptions exposed)
- [ ] ⚠️ Stack traces not shown in production (Not checked - assume they are)
- [x] ✅ Proper error logging (server-side only) (Logging exists)
- [x] ✅ Sensitive operations fail securely (Errors handled)

### Dependency Security
- [x] ✅ Third-party libraries listed (requirements.txt exists)
- [ ] ⚠️ Known vulnerable dependencies (Not checked - should run `pip-audit` or similar)
- [ ] ⚠️ Outdated security-critical packages (Not checked)

---

## 📋 DETAILED FINDINGS BY CATEGORY

### A. AUTHENTICATION & AUTHORIZATION

#### Backend Endpoints

**✅ GOOD:**
- All endpoints use `Depends(get_current_user)` pattern
- User ID is passed to service layer

**❌ CRITICAL ISSUES:**
1. **`get_current_user` is not a dependency function** - It's a route handler that returns a dict, not a User object. This will cause runtime errors or authentication bypass.
2. **No token validation** - No JWT verification, token expiration checks
3. **No user lookup** - Returns hardcoded user dict, doesn't query database
4. **No RBAC checks** - All users have same permissions
5. **No property-level authorization** - Users can access incidents from any property

**🔧 REQUIRED FIXES:**
```python
# Need to create proper dependency:
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Verify JWT token and return current user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Query database for user
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        finally:
            db.close()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### Frontend

**⚠️ ISSUES:**
1. Token stored in localStorage (XSS risk)
2. No token refresh logic
3. No redirect to login on 401
4. Hardcoded API URL

### B. INPUT VALIDATION

#### Client-Side Validation

**✅ EXISTS:**
- Description minimum length (10 chars) - Line 400
- Required field checks in forms

**❌ MISSING:**
- Maximum length validation
- Special character sanitization
- HTML/script tag detection

#### Server-Side Validation

**✅ EXISTS:**
- Pydantic models with type checking
- Enum types for incident_type, severity, status

**❌ MISSING:**
- String length limits (title max 200 matches DB, but not enforced in schema)
- Description max length
- Location structure validation (currently `Dict[str, Any]` - too permissive)
- Enum validation in query parameters (status, severity passed as strings, not validated)

**🔧 REQUIRED FIXES:**
```python
# Add validators to schemas:
from pydantic import validator, Field

class IncidentCreate(IncidentBase):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=10000)
    
    @validator('location')
    def validate_location(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Location must be a dictionary')
        # Add specific structure validation
        return v
```

### C. DATA SECURITY

**❌ CRITICAL:**
1. **Passwords logged in plain text** - `backend/api/auth_endpoints.py:33,57`
2. **Full error details exposed** - All endpoints return `str(e)` in error messages
3. **Hardcoded API URL** - `frontend/src/pages/modules/IncidentLogModule.tsx:410`

**🔧 FIXES:**
1. Remove password logging
2. Return generic errors: `detail="An error occurred. Please try again."`
3. Use environment variable for API URL

### D. CSRF PROTECTION

**❌ MISSING:**
- No CSRF tokens
- Not using SameSite cookies (using localStorage instead)

**🔧 FIX:**
- Add CSRF token to state-changing requests
- OR use SameSite=Strict cookies for auth tokens

### E. ERROR HANDLING

**❌ ISSUES:**
1. Full exception details in HTTP responses
2. No request IDs for tracing
3. Generic 500 errors don't help debugging

**🔧 FIX:**
```python
except Exception as e:
    logger.error(f"Failed to create incident: {e}", exc_info=True, extra={"request_id": request_id})
    raise HTTPException(
        status_code=500, 
        detail="Failed to create incident. Please try again."
    )
```

### F. DEPENDENCY SECURITY

**⚠️ NOT VERIFIED:**
- Should run `pip-audit` or `safety check` on `requirements.txt`
- Should check for outdated packages
- Current packages appear reasonable but need verification

---

## 🎯 PRIORITY FIXES (Top 5)

1. **Fix `get_current_user` dependency** (Critical) - 4-6 hours
   - Current code will fail or bypass auth
   - Must be fixed before production

2. **Add RBAC checks** (Critical) - 8-12 hours
   - No permission checks currently
   - Users can perform any operation

3. **Fix error message leakage** (High) - 2-3 hours
   - Full exceptions exposed to clients
   - Easy fix, high security impact

4. **Add property-level authorization** (High) - 4-6 hours
   - Users can access incidents from any property
   - Important for multi-tenant security

5. **Remove password logging** (High) - 15 minutes
   - Quick fix, passwords in logs
   - Critical for compliance

---

## 📊 SECURITY METRICS

| Category | Status | Issues Found |
|----------|--------|--------------|
| Authentication | ❌ Critical | 1 critical (get_current_user broken) |
| Authorization | ❌ Critical | 2 critical (no RBAC, no property checks) |
| Input Validation | ⚠️ Partial | 4 high priority issues |
| Data Security | ❌ Critical | 3 critical issues |
| CSRF Protection | ❌ Missing | 1 high priority |
| Error Handling | ❌ Issues | 2 high priority |
| Secret Management | ⚠️ Partial | 1 high priority |
| Dependency Security | ⚠️ Not Verified | Needs audit |

**Total Critical Issues**: 6  
**Total High Priority Issues**: 9  
**Total Low Priority Issues**: 5  

---

## ✅ MODULE COMPLETE

**STOP: Do not proceed to Phase 2 until all 🔴 Critical Issues are resolved.**

**Next Steps:**
1. Fix `get_current_user` dependency function (CRITICAL)
2. Add RBAC checks to all endpoints (CRITICAL)
3. Fix error message leakage (HIGH)
4. Add property-level authorization (HIGH)
5. Remove password logging (HIGH - quick fix)

After fixes are complete and verified, proceed to Phase 2: Functionality & Flow Audit.
