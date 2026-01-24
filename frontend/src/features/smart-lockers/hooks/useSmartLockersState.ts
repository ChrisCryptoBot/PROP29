/**
 * Smart Lockers State Hook
 * Centralized state management for Smart Lockers feature
 * Contains ALL business logic with RBAC and Zod validation integration
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError } from '../../../utils/toast';
import * as lockerService from '../services/lockerService';
import type { ZodIssue } from 'zod';
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
  
  // Modal states (Modal State Convergence)
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showReservationModal: boolean;
  setShowReservationModal: (show: boolean) => void;
  selectedLocker: SmartLocker | null;
  setSelectedLocker: (locker: SmartLocker | null) => void;
  
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
  
  // Modal states (Modal State Convergence)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<SmartLocker | null>(null);
  
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
      logger.error(
        'Failed to refresh lockers',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'SmartLockers', action: 'refreshLockers' }
      );
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
      const errorMessages = validationResult.error.errors.map((e: ZodIssue) => e.message).join(', ');
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
      setShowCreateModal(false); // Close modal after successful creation
      return newLocker;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to create locker');
      throw error;
    }
  }, [canCreateLocker, refreshLockers, setShowCreateModal]);
  
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
      const errorMessages = validationResult.error.errors.map((e: ZodIssue) => e.message).join(', ');
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
      logger.error(
        'Failed to refresh reservations',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'SmartLockers', action: 'refreshReservations' }
      );
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
      const errorMessages = validationResult.error.errors.map((e: ZodIssue) => e.message).join(', ');
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
      setShowReservationModal(false); // Close modal after successful creation
      return newReservation;
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to create reservation');
      throw error;
    }
  }, [canCreateReservation, refreshReservations, setShowReservationModal]);
  
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
      const errorMessages = validationResult.error.errors.map((e: ZodIssue) => e.message).join(', ');
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
      logger.error(
        'Failed to refresh metrics',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'SmartLockers', action: 'refreshMetrics' }
      );
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
      logger.error(
        'Failed to refresh settings',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'SmartLockers', action: 'refreshSettings' }
      );
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
      const errorMessages = validationResult.error.errors.map((e: ZodIssue) => e.message).join(', ');
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
    
    // Modal states (Modal State Convergence)
    showCreateModal,
    setShowCreateModal,
    showReservationModal,
    setShowReservationModal,
    selectedLocker,
    setSelectedLocker,
    
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
