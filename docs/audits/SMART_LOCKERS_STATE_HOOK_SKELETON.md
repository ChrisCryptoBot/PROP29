# Smart Lockers State Hook - Implementation Skeleton

**File:** `frontend/src/features/smart-lockers/hooks/useSmartLockersState.ts`

## Overview

This hook manages all business logic for the Smart Lockers module, following the Gold Standard pattern. It integrates RBAC (Role-Based Access Control) and Zod validation from the ground up.

---

## Key Design Decisions

### 1. RBAC Integration (Shift Left)
- **Pattern:** All CRUD operations check user roles BEFORE execution
- **Roles:** `ADMIN` and `SECURITY_OFFICER` have full access
- **Implementation:** Use `useAuth()` hook to get current user, check `user.roles` array
- **Failure Mode:** Return early with error toast if unauthorized

### 2. Zod Validation Integration
- **Pattern:** Validate all inputs using Zod schemas BEFORE API calls
- **Implementation:** Use `.safeParse()` for validation, `.parse()` for type inference
- **Error Handling:** Show validation errors to user via toast notifications
- **Location:** Validate in hook functions, NOT in components

### 3. State Management
- **Data State:** `lockers`, `reservations`, `metrics`, `settings`
- **UI State:** `loading` object (granular loading states), `error` states
- **Modal State:** Managed in context (separate concern)

---

## Hook Structure Skeleton

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError } from '../../../utils/toast';
import * as lockerService from '../services/lockerService';
import type {
  SmartLocker,
  LockerReservation,
  LockerMetrics,
  CreateLockerRequest,
  UpdateLockerRequest,
  CreateReservationRequest,
  UpdateReservationRequest,
} from '../types/locker.types';
import {
  createLockerSchema,
  updateLockerSchema,
  createReservationSchema,
  updateReservationSchema,
  lockerSettingsSchema,
} from '../types/locker.schema';
import { BATTERY_ALERT_THRESHOLD, SIGNAL_STRENGTH_ALERT_THRESHOLD } from '../utils/constants';

export interface UseSmartLockersStateReturn {
  // Data
  lockers: SmartLocker[];
  reservations: LockerReservation[];
  metrics: LockerMetrics | null;
  settings: { batteryAlertThreshold: number; signalStrengthAlertThreshold: number };
  
  // Loading states
  loading: {
    lockers: boolean;
    reservations: boolean;
    metrics: boolean;
    settings: boolean;
  };
  
  // RBAC flags (exposed for UI conditional rendering)
  canCreateLocker: boolean;
  canUpdateLocker: boolean;
  canDeleteLocker: boolean;
  canCreateReservation: boolean;
  canUpdateReservation: boolean;
  canDeleteReservation: boolean;
  canManageSettings: boolean;
  
  // Actions - Lockers
  refreshLockers: () => Promise<void>;
  createLocker: (data: CreateLockerRequest) => Promise<SmartLocker>;
  updateLocker: (id: string, data: UpdateLockerRequest) => Promise<SmartLocker>;
  deleteLocker: (id: string) => Promise<void>;
  
  // Actions - Reservations
  refreshReservations: () => Promise<void>;
  createReservation: (data: CreateReservationRequest) => Promise<LockerReservation>;
  updateReservation: (id: string, data: UpdateReservationRequest) => Promise<LockerReservation>;
  deleteReservation: (id: string) => Promise<void>;
  
  // Actions - Metrics
  refreshMetrics: () => Promise<void>;
  
  // Actions - Settings
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: { batteryAlertThreshold: number; signalStrengthAlertThreshold: number }) => Promise<void>;
  
  // Actions - Locker Operations
  remoteUnlockLocker: (id: string) => Promise<void>;
  requestMaintenance: (id: string, reason: string) => Promise<void>;
}

export function useSmartLockersState(): UseSmartLockersStateReturn {
  const { user } = useAuth();
  
  // ============================================
  // RBAC HELPER FUNCTIONS
  // ============================================
  
  /**
   * Check if user has management access (ADMIN or SECURITY_OFFICER)
   */
  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => 
      ['ADMIN', 'SECURITY_OFFICER'].includes(role.toUpperCase())
    );
  }, [user]);
  
  /**
   * Check if user has admin access
   */
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => role.toUpperCase() === 'ADMIN');
  }, [user]);
  
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  
  const [lockers, setLockers] = useState<SmartLocker[]>([]);
  const [reservations, setReservations] = useState<LockerReservation[]>([]);
  const [metrics, setMetrics] = useState<LockerMetrics | null>(null);
  const [settings, setSettings] = useState({
    batteryAlertThreshold: BATTERY_ALERT_THRESHOLD,
    signalStrengthAlertThreshold: SIGNAL_STRENGTH_ALERT_THRESHOLD,
  });
  
  const [loading, setLoading] = useState({
    lockers: false,
    reservations: false,
    metrics: false,
    settings: false,
  });
  
  // ============================================
  // RBAC FLAGS (for UI conditional rendering)
  // ============================================
  
  const canCreateLocker = hasManagementAccess;
  const canUpdateLocker = hasManagementAccess;
  const canDeleteLocker = isAdmin; // Only admins can delete
  const canCreateReservation = hasManagementAccess;
  const canUpdateReservation = hasManagementAccess;
  const canDeleteReservation = hasManagementAccess;
  const canManageSettings = isAdmin; // Only admins can manage settings
  
  // ============================================
  // LOCKER ACTIONS (with RBAC + Zod)
  // ============================================
  
  /**
   * Refresh lockers list
   */
  const refreshLockers = useCallback(async () => {
    setLoading(prev => ({ ...prev, lockers: true }));
    try {
      const data = await lockerService.getLockers();
      setLockers(data);
    } catch (error) {
      logger.error('Failed to refresh lockers', error, { module: 'SmartLockers', action: 'refreshLockers' });
      showError('Failed to load lockers');
    } finally {
      setLoading(prev => ({ ...prev, lockers: false }));
    }
  }, []);
  
  /**
   * Create locker with RBAC check + Zod validation
   */
  const createLocker = useCallback(async (data: CreateLockerRequest): Promise<SmartLocker> => {
    // RBAC CHECK
    if (!canCreateLocker) {
      showError('You do not have permission to create lockers');
      throw new Error('Unauthorized');
    }
    
    // ZOD VALIDATION
    const validationResult = createLockerSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      showError(`Validation failed: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // API CALL
    const toastId = showLoading('Creating locker...');
    try {
      const validatedData = validationResult.data;
      const newLocker = await lockerService.createLocker(validatedData);
      await refreshLockers(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Locker created successfully');
      return newLocker;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to create locker');
      throw error;
    }
  }, [canCreateLocker, refreshLockers]);
  
  /**
   * Update locker with RBAC check + Zod validation
   */
  const updateLocker = useCallback(async (id: string, data: UpdateLockerRequest): Promise<SmartLocker> => {
    // RBAC CHECK
    if (!canUpdateLocker) {
      showError('You do not have permission to update lockers');
      throw new Error('Unauthorized');
    }
    
    // ZOD VALIDATION
    const validationResult = updateLockerSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      showError(`Validation failed: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // API CALL
    const toastId = showLoading('Updating locker...');
    try {
      const validatedData = validationResult.data;
      const updatedLocker = await lockerService.updateLocker(id, validatedData);
      await refreshLockers(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Locker updated successfully');
      return updatedLocker;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update locker');
      throw error;
    }
  }, [canUpdateLocker, refreshLockers]);
  
  /**
   * Delete locker with RBAC check
   */
  const deleteLocker = useCallback(async (id: string): Promise<void> => {
    // RBAC CHECK
    if (!canDeleteLocker) {
      showError('You do not have permission to delete lockers');
      throw new Error('Unauthorized');
    }
    
    // CONFIRMATION
    const confirmed = window.confirm('Are you sure you want to delete this locker? This action cannot be undone.');
    if (!confirmed) return;
    
    // API CALL
    const toastId = showLoading('Deleting locker...');
    try {
      await lockerService.deleteLocker(id);
      await refreshLockers(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Locker deleted successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to delete locker');
      throw error;
    }
  }, [canDeleteLocker, refreshLockers]);
  
  // ============================================
  // RESERVATION ACTIONS (with RBAC + Zod)
  // ============================================
  
  /**
   * Refresh reservations list
   */
  const refreshReservations = useCallback(async () => {
    setLoading(prev => ({ ...prev, reservations: true }));
    try {
      const data = await lockerService.getReservations();
      setReservations(data);
    } catch (error) {
      logger.error('Failed to refresh reservations', error, { module: 'SmartLockers', action: 'refreshReservations' });
      showError('Failed to load reservations');
    } finally {
      setLoading(prev => ({ ...prev, reservations: false }));
    }
  }, []);
  
  /**
   * Create reservation with RBAC check + Zod validation
   */
  const createReservation = useCallback(async (data: CreateReservationRequest): Promise<LockerReservation> => {
    // RBAC CHECK
    if (!canCreateReservation) {
      showError('You do not have permission to create reservations');
      throw new Error('Unauthorized');
    }
    
    // ZOD VALIDATION
    const validationResult = createReservationSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      showError(`Validation failed: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // API CALL
    const toastId = showLoading('Creating reservation...');
    try {
      const validatedData = validationResult.data;
      const newReservation = await lockerService.createReservation(validatedData);
      await refreshReservations(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Reservation created successfully');
      return newReservation;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to create reservation');
      throw error;
    }
  }, [canCreateReservation, refreshReservations]);
  
  /**
   * Update reservation with RBAC check + Zod validation
   */
  const updateReservation = useCallback(async (id: string, data: UpdateReservationRequest): Promise<LockerReservation> => {
    // RBAC CHECK
    if (!canUpdateReservation) {
      showError('You do not have permission to update reservations');
      throw new Error('Unauthorized');
    }
    
    // ZOD VALIDATION
    const validationResult = updateReservationSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      showError(`Validation failed: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // API CALL
    const toastId = showLoading('Updating reservation...');
    try {
      const validatedData = validationResult.data;
      const updatedReservation = await lockerService.updateReservation(id, validatedData);
      await refreshReservations(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Reservation updated successfully');
      return updatedReservation;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update reservation');
      throw error;
    }
  }, [canUpdateReservation, refreshReservations]);
  
  /**
   * Delete reservation with RBAC check
   */
  const deleteReservation = useCallback(async (id: string): Promise<void> => {
    // RBAC CHECK
    if (!canDeleteReservation) {
      showError('You do not have permission to delete reservations');
      throw new Error('Unauthorized');
    }
    
    // CONFIRMATION
    const confirmed = window.confirm('Are you sure you want to delete this reservation?');
    if (!confirmed) return;
    
    // API CALL
    const toastId = showLoading('Deleting reservation...');
    try {
      await lockerService.deleteReservation(id);
      await refreshReservations(); // Refresh list
      dismissLoadingAndShowSuccess(toastId, 'Reservation deleted successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to delete reservation');
      throw error;
    }
  }, [canDeleteReservation, refreshReservations]);
  
  // ============================================
  // METRICS ACTIONS
  // ============================================
  
  const refreshMetrics = useCallback(async () => {
    setLoading(prev => ({ ...prev, metrics: true }));
    try {
      const data = await lockerService.getLockerMetrics();
      setMetrics(data);
    } catch (error) {
      logger.error('Failed to refresh metrics', error, { module: 'SmartLockers', action: 'refreshMetrics' });
      showError('Failed to load metrics');
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  }, []);
  
  // ============================================
  // SETTINGS ACTIONS (with RBAC)
  // ============================================
  
  /**
   * Refresh settings
   */
  const refreshSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      // TODO: Implement API endpoint for settings
      // For now, use defaults from constants
      setSettings({
        batteryAlertThreshold: BATTERY_ALERT_THRESHOLD,
        signalStrengthAlertThreshold: SIGNAL_STRENGTH_ALERT_THRESHOLD,
      });
    } catch (error) {
      logger.error('Failed to refresh settings', error, { module: 'SmartLockers', action: 'refreshSettings' });
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);
  
  /**
   * Update settings with RBAC check + Zod validation
   */
  const updateSettings = useCallback(async (newSettings: { batteryAlertThreshold: number; signalStrengthAlertThreshold: number }): Promise<void> => {
    // RBAC CHECK
    if (!canManageSettings) {
      showError('You do not have permission to manage settings');
      throw new Error('Unauthorized');
    }
    
    // ZOD VALIDATION
    const validationResult = lockerSettingsSchema.safeParse(newSettings);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      showError(`Validation failed: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // API CALL
    const toastId = showLoading('Saving settings...');
    try {
      const validatedData = validationResult.data;
      // TODO: Implement API endpoint for settings
      // await lockerService.updateSettings(validatedData);
      setSettings(validatedData);
      dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to save settings');
      throw error;
    }
  }, [canManageSettings]);
  
  // ============================================
  // LOCKER OPERATIONS (Remote Unlock, Maintenance)
  // ============================================
  
  /**
   * Remote unlock locker (for LockerDetailsModal)
   */
  const remoteUnlockLocker = useCallback(async (id: string): Promise<void> => {
    // RBAC CHECK
    if (!hasManagementAccess) {
      showError('You do not have permission to unlock lockers');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Unlocking locker...');
    try {
      // TODO: Implement API endpoint for remote unlock
      // await lockerService.remoteUnlockLocker(id);
      await refreshLockers();
      dismissLoadingAndShowSuccess(toastId, 'Locker unlocked successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to unlock locker');
      throw error;
    }
  }, [hasManagementAccess, refreshLockers]);
  
  /**
   * Request maintenance for locker (for LockerDetailsModal)
   */
  const requestMaintenance = useCallback(async (id: string, reason: string): Promise<void> => {
    // RBAC CHECK
    if (!hasManagementAccess) {
      showError('You do not have permission to request maintenance');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Requesting maintenance...');
    try {
      // TODO: Implement API endpoint for maintenance request
      // await lockerService.requestMaintenance(id, reason);
      await refreshLockers();
      dismissLoadingAndShowSuccess(toastId, 'Maintenance requested successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to request maintenance');
      throw error;
    }
  }, [hasManagementAccess, refreshLockers]);
  
  // ============================================
  // INITIAL DATA LOAD
  // ============================================
  
  useEffect(() => {
    refreshLockers();
    refreshReservations();
    refreshMetrics();
    refreshSettings();
  }, [refreshLockers, refreshReservations, refreshMetrics, refreshSettings]);
  
  // ============================================
  // RETURN INTERFACE
  // ============================================
  
  return {
    // Data
    lockers,
    reservations,
    metrics,
    settings,
    
    // Loading
    loading,
    
    // RBAC Flags
    canCreateLocker,
    canUpdateLocker,
    canDeleteLocker,
    canCreateReservation,
    canUpdateReservation,
    canDeleteReservation,
    canManageSettings,
    
    // Actions
    refreshLockers,
    createLocker,
    updateLocker,
    deleteLocker,
    refreshReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    refreshMetrics,
    refreshSettings,
    updateSettings,
    remoteUnlockLocker,
    requestMaintenance,
  };
}
```

---

## Key Implementation Details

### RBAC Pattern
```typescript
// Check at function level (not just UI)
if (!canCreateLocker) {
  showError('You do not have permission to create lockers');
  throw new Error('Unauthorized');
}
```

### Zod Validation Pattern
```typescript
// Validate before API call
const validationResult = createLockerSchema.safeParse(data);
if (!validationResult.success) {
  const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
  showError(`Validation failed: ${errorMessages}`);
  throw new Error(`Validation failed: ${errorMessages}`);
}

// Use validated data
const validatedData = validationResult.data;
await lockerService.createLocker(validatedData);
```

### Settings Integration
- Settings state exposed: `settings: { batteryAlertThreshold, signalStrengthAlertThreshold }`
- Handler exposed: `updateSettings(settings) => Promise<void>`
- RBAC check: Only `ADMIN` can manage settings
- Zod validation: Uses `lockerSettingsSchema`

### Locker Operations
- `remoteUnlockLocker(id)`: For LockerDetailsModal "Remote Unlock" button
- `requestMaintenance(id, reason)`: For LockerDetailsModal "Request Maintenance" button
- Both check RBAC (requires `hasManagementAccess`)
- Both refresh lockers list after completion

---

## Next Steps

1. **Review this skeleton** for RBAC logic and Zod validation patterns
2. **Install Zod** (see command below)
3. **Implement full hook** based on this skeleton
4. **Create context** that wraps this hook
5. **Create components** that consume the context

---

## Zod Installation Command

```bash
cd frontend && npm install zod
```

Or add to `frontend/package.json` dependencies:
```json
"zod": "^3.22.4"
```
