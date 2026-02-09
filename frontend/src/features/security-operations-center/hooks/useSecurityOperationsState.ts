import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError, showSuccess, showInfo } from '../../../utils/toast';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import * as securityOpsService from '../services/securityOperationsCenterService';
import { auditTrailService } from '../services/auditTrailService';
import { useSecurityOperationsQueue } from './useSecurityOperationsQueue';
import { useSecurityOperationsHeartbeat } from './useSecurityOperationsHeartbeat';
import { useSecurityOperationsTelemetry } from './useSecurityOperationsTelemetry';
import type {
  CameraEntry,
  CameraMetrics,
  Recording,
  EvidenceItem,
  AnalyticsData,
  SecurityOperationsSettings,
  CreateCameraPayload,
  UpdateCameraPayload,
} from '../types/security-operations.types';

const initialCameras: CameraEntry[] = [];

const initialRecordings: Recording[] = [];

const initialEvidence: EvidenceItem[] = [];

const defaultMetrics: CameraMetrics = {
  total: 0,
  online: 0,
  offline: 0,
  maintenance: 0,
  recording: 0,
  avgUptime: '0%',
};

const defaultAnalytics: AnalyticsData = {
  motionEvents: 0,
  alertsTriggered: 0,
  averageResponseTime: 'N/A',
  peakActivity: 'N/A',
};

const defaultSettings: SecurityOperationsSettings = {
  recordingQuality: '4K',
  recordingDuration: '30 days',
  motionSensitivity: 'Medium',
  storageRetention: '90 days',
  autoDelete: true,
  notifyOnMotion: true,
  notifyOnOffline: true,
  nightVisionAuto: true,
};

export interface UseSecurityOperationsStateReturn {
  cameras: CameraEntry[];
  recordings: Recording[];
  evidence: EvidenceItem[];
  metrics: CameraMetrics;
  analytics: AnalyticsData;
  settings: SecurityOperationsSettings;
  loading: {
    cameras: boolean;
    recordings: boolean;
    evidence: boolean;
    metrics: boolean;
    analytics: boolean;
    settings: boolean;
    actions: boolean;
  };
  canManageCameras: boolean;
  canManageEvidence: boolean;
  canUpdateSettings: boolean;
  selectedCamera: CameraEntry | null;
  setSelectedCamera: (camera: CameraEntry | null) => void;
  selectedRecording: Recording | null;
  setSelectedRecording: (recording: Recording | null) => void;
  selectedEvidence: EvidenceItem | null;
  setSelectedEvidence: (item: EvidenceItem | null) => void;
  showEvidenceModal: boolean;
  setShowEvidenceModal: (show: boolean) => void;
  // Setters for WebSocket integration
  setCameras: Dispatch<SetStateAction<CameraEntry[]>>;
  setRecordings: Dispatch<SetStateAction<Recording[]>>;
  setEvidence: Dispatch<SetStateAction<EvidenceItem[]>>;
  setMetrics: Dispatch<SetStateAction<CameraMetrics>>;
  setAnalytics: Dispatch<SetStateAction<AnalyticsData>>;
  setSettings: Dispatch<SetStateAction<SecurityOperationsSettings>>;
  refreshCameras: () => Promise<void>;
  refreshRecordings: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  createCamera: (payload: CreateCameraPayload) => Promise<void>;
  updateCamera: (cameraId: string, payload: UpdateCameraPayload) => Promise<void>;
  deleteCamera: (cameraId: string) => Promise<void>;
  markEvidenceReviewed: (itemId: string) => Promise<void>;
  archiveEvidence: (itemId: string) => Promise<void>;
  updateEvidenceStatus: (itemId: string, status: 'pending' | 'reviewed' | 'archived') => Promise<void>;
  updateSettings: (newSettings: SecurityOperationsSettings) => Promise<void>;
  toggleRecording: (cameraId: string) => Promise<void>;
  toggleMotionDetection: (cameraId: string) => Promise<void>;
  reportCameraIssue: (cameraId: string) => Promise<void>;
  /** Stops recording on all cameras (e.g. emergency stop). Calls API for each recording camera then refreshes. */
  emergencyStopAllRecording: () => Promise<void>;
}

export function useSecurityOperationsState(): UseSecurityOperationsStateReturn {
  const { user } = useAuth();
  const { trackAction, trackPerformance, trackError } = useSecurityOperationsTelemetry();

  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some((role) =>
      ['ADMIN', 'SECURITY_MANAGER', 'SECURITY_OFFICER'].includes(role.toUpperCase())
    );
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.roles.some((role) => role.toUpperCase() === 'ADMIN');
  }, [user]);

  const [cameras, setCameras] = useState<CameraEntry[]>(initialCameras);
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);
  const [metrics, setMetrics] = useState<CameraMetrics>(defaultMetrics);
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics);
  const [settings, setSettings] = useState<SecurityOperationsSettings>(defaultSettings);

  const [loading, setLoading] = useState({
    cameras: false,
    recordings: false,
    evidence: false,
    metrics: false,
    analytics: false,
    settings: false,
    actions: false,
  });

  const [selectedCamera, setSelectedCamera] = useState<CameraEntry | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const canManageCameras = hasManagementAccess;
  const canManageEvidence = hasManagementAccess;
  const canUpdateSettings = isAdmin;

  const refreshCameras = useCallback(async () => {
    setLoading((prev) => ({ ...prev, cameras: true }));
    try {
      const data = await retryWithBackoff(
        () => securityOpsService.getCameras(),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );

      // Don't replace with empty list if we had cameras (backend error or transient returned [])
      setCameras(prevCameras => {
        if (data.length === 0 && prevCameras.length > 0) {
          setTimeout(() => showError('Could not refresh camera list. Showing last known list.'), 0);
          return prevCameras;
        }
        return data.map(newCamera => {
          const prevCamera = prevCameras.find(c => c.id === newCamera.id);

          // If camera was online and now offline, cache last known state
          if (prevCamera && prevCamera.status === 'online' && newCamera.status === 'offline') {
            return {
              ...newCamera,
              lastKnownState: {
                timestamp: new Date().toISOString(),
                status: prevCamera.status,
                imageUrl: prevCamera.lastKnownImageUrl,
                isRecording: prevCamera.isRecording,
                motionDetectionEnabled: prevCamera.motionDetectionEnabled,
              }
            };
          }

          // If camera is still offline, preserve last known state
          if (newCamera.status === 'offline' && prevCamera?.lastKnownState) {
            return {
              ...newCamera,
              lastKnownState: prevCamera.lastKnownState
            };
          }

          return newCamera;
        });
      });
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to refresh cameras');
      showError(errorMessage);
      logger.error('Failed to refresh cameras', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshCameras',
      });
    } finally {
      setLoading((prev) => ({ ...prev, cameras: false }));
    }
  }, []);

  const refreshRecordings = useCallback(async () => {
    const startTime = Date.now();
    setLoading((prev) => ({ ...prev, recordings: true }));
    trackAction('refresh', 'recording');
    try {
      const data = await retryWithBackoff(
        () => securityOpsService.getRecordings(),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      setRecordings(data);
      const duration = Date.now() - startTime;
      trackPerformance('refreshRecordings', duration, { count: data.length });
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to refresh recordings');
      showError(errorMessage);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'refreshRecordings' });
      logger.error('Failed to refresh recordings', err, {
        module: 'SecurityOperations',
        action: 'refreshRecordings',
      });
    } finally {
      setLoading((prev) => ({ ...prev, recordings: false }));
    }
  }, [trackAction, trackPerformance, trackError]);

  const refreshEvidence = useCallback(async () => {
    setLoading((prev) => ({ ...prev, evidence: true }));
    try {
      const data = await retryWithBackoff(
        () => securityOpsService.getEvidence(),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      setEvidence(data);
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to refresh evidence');
      showError(errorMessage);
      logger.error('Failed to refresh evidence', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshEvidence',
      });
    } finally {
      setLoading((prev) => ({ ...prev, evidence: false }));
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    setLoading((prev) => ({ ...prev, metrics: true }));
    try {
      const data = await securityOpsService.getMetrics();
      if (data) {
        setMetrics(data);
        return;
      }
      const computed: CameraMetrics = {
        total: cameras.length,
        online: cameras.filter((camera) => camera.status === 'online').length,
        offline: cameras.filter((camera) => camera.status === 'offline').length,
        maintenance: cameras.filter((camera) => camera.status === 'maintenance').length,
        recording: cameras.filter((camera) => camera.isRecording).length,
        avgUptime: cameras.length > 0 ? `${Math.round((cameras.filter((camera) => camera.status === 'online').length / cameras.length) * 100)}%` : '0%',
      };
      setMetrics(computed);
    } catch (error) {
      logger.error('Failed to refresh metrics', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshMetrics',
      });
    } finally {
      setLoading((prev) => ({ ...prev, metrics: false }));
    }
  }, [cameras]);

  const refreshAnalytics = useCallback(async () => {
    const startTime = Date.now();
    setLoading((prev) => ({ ...prev, analytics: true }));
    trackAction('refresh', 'analytics');
    try {
      const data = await retryWithBackoff(
        () => securityOpsService.getAnalytics(),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (data) {
        setAnalytics(data);
        const duration = Date.now() - startTime;
        trackPerformance('refreshAnalytics', duration);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'refreshAnalytics' });
      logger.error('Failed to refresh analytics', err, {
        module: 'SecurityOperations',
        action: 'refreshAnalytics',
      });
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  }, [trackAction, trackPerformance, trackError]);

  const refreshSettings = useCallback(async () => {
    setLoading((prev) => ({ ...prev, settings: true }));
    try {
      const data = await retryWithBackoff(
        () => securityOpsService.getSettings(),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      logger.error('Failed to refresh settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshSettings',
      });
    } finally {
      setLoading((prev) => ({ ...prev, settings: false }));
    }
  }, []);

  const onQueueSynced = useCallback(() => {
    refreshCameras();
    refreshEvidence();
  }, [refreshCameras, refreshEvidence]);

  // Offline queue for failed operations (defined after refresh functions to avoid circular dependency)
  const { enqueue: enqueueOperation, pendingCount } = useSecurityOperationsQueue({
    onSynced: onQueueSynced,
  });

  // Heartbeat tracking for camera offline detection
  useSecurityOperationsHeartbeat({
    cameras,
    setCameras,
    heartbeatOfflineThresholdMinutes: 15,
  });

  const markEvidenceReviewed = useCallback(async (itemId: string) => {
    if (!canManageEvidence) {
      showError('You do not have permission to review evidence');
      return;
    }

    trackAction('mark_reviewed', 'evidence', { itemId });

    // Check if offline - queue operation
    if (!navigator.onLine) {
      enqueueOperation({
        type: 'EVIDENCE_STATUS_UPDATE',
        payload: { itemId, status: 'reviewed' },
      });
      // Optimistically update UI
      setEvidence((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'reviewed' } : item))
      );
      showInfo('Operation queued. Will execute when online.');
      return;
    }

    const toastId = showLoading('Marking evidence as reviewed...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const ok = await retryWithBackoff(
        () => securityOpsService.updateEvidenceStatus(itemId, 'reviewed'),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (ok) {
        auditTrailService.logEvidenceChange('review', itemId, { status: { from: 'pending', to: 'reviewed' } });
        await refreshEvidence();
        dismissLoadingAndShowSuccess(toastId, 'Evidence marked as reviewed');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      // Queue operation for retry
      enqueueOperation({
        type: 'EVIDENCE_STATUS_UPDATE',
        payload: { itemId, status: 'reviewed' },
      });
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to update evidence');
      dismissLoadingAndShowError(toastId, `${errorMessage}. Operation queued for retry.`);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'markEvidenceReviewed', itemId });
      logger.error('Failed to mark evidence reviewed', err, {
        module: 'SecurityOperations',
        action: 'markEvidenceReviewed',
        itemId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageEvidence, refreshEvidence, enqueueOperation, trackAction, trackError]);

  const archiveEvidence = useCallback(async (itemId: string) => {
    if (!canManageEvidence) {
      showError('You do not have permission to archive evidence');
      return;
    }

    // Check if offline - queue operation
    if (!navigator.onLine) {
      enqueueOperation({
        type: 'EVIDENCE_STATUS_UPDATE',
        payload: { itemId, status: 'archived' },
      });
      // Optimistically update UI
      setEvidence((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'archived' } : item))
      );
      showInfo('Operation queued. Will execute when online.');
      return;
    }

    const toastId = showLoading('Archiving evidence...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const ok = await retryWithBackoff(
        () => securityOpsService.updateEvidenceStatus(itemId, 'archived'),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (ok) {
        await refreshEvidence();
        dismissLoadingAndShowSuccess(toastId, 'Evidence archived');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      // Queue operation for retry
      enqueueOperation({
        type: 'EVIDENCE_STATUS_UPDATE',
        payload: { itemId, status: 'archived' },
      });
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to archive evidence');
      dismissLoadingAndShowError(toastId, `${errorMessage}. Operation queued for retry.`);
      logger.error('Failed to archive evidence', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'archiveEvidence',
        itemId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageEvidence, refreshEvidence, enqueueOperation]);

  const updateEvidenceStatus = useCallback(
    async (itemId: string, status: 'pending' | 'reviewed' | 'archived') => {
      if (!canManageEvidence) {
        showError('You do not have permission to update evidence');
        return;
      }

      // Check if offline - queue operation
      if (!navigator.onLine) {
        enqueueOperation({
          type: 'EVIDENCE_STATUS_UPDATE',
          payload: { itemId, status },
        });
        // Optimistically update UI
        setEvidence((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, status } : item))
        );
        showInfo('Operation queued. Will execute when online.');
        return;
      }

      const toastId = showLoading('Updating evidence status...');
      setLoading((prev) => ({ ...prev, actions: true }));
      try {
        const ok = await retryWithBackoff(
          () => securityOpsService.updateEvidenceStatus(itemId, status),
          { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
        );
        if (ok) {
          await refreshEvidence();
          dismissLoadingAndShowSuccess(toastId, `Evidence status set to ${status}`);
        } else {
          throw new Error('Update failed');
        }
      } catch (error) {
        // Queue operation for retry
        enqueueOperation({
          type: 'EVIDENCE_STATUS_UPDATE',
          payload: { itemId, status },
        });
        const errorMessage = ErrorHandlerService.handle(error, 'Failed to update evidence status');
        dismissLoadingAndShowError(toastId, `${errorMessage}. Operation queued for retry.`);
        logger.error('Failed to update evidence status', error instanceof Error ? error : new Error(String(error)), {
          module: 'SecurityOperations',
          action: 'updateEvidenceStatus',
          itemId,
        });
      } finally {
        setLoading((prev) => ({ ...prev, actions: false }));
      }
    },
    [canManageEvidence, refreshEvidence, enqueueOperation]
  );

  const updateSettings = useCallback(async (newSettings: SecurityOperationsSettings) => {
    if (!canUpdateSettings) {
      showError('You do not have permission to update settings');
      return;
    }

    trackAction('update', 'settings', { settings: newSettings });

    // Check if offline - queue operation
    if (!navigator.onLine) {
      enqueueOperation({
        type: 'SETTINGS_UPDATE',
        payload: { settings: newSettings },
      });
      // Optimistically update UI
      setSettings(newSettings);
      showInfo('Operation queued. Will execute when online.');
      return;
    }

    const toastId = showLoading('Updating settings...');
    setLoading((prev) => ({ ...prev, settings: true }));
    try {
      const updated = await retryWithBackoff(
        () => securityOpsService.updateSettings(newSettings),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (updated) {
        // Track settings changes
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        Object.keys(newSettings).forEach(key => {
          if ((settings as any)[key] !== (updated as any)[key]) {
            changes[key] = { from: (settings as any)[key], to: (updated as any)[key] };
          }
        });
        auditTrailService.logSettingsChange('update', changes);
        setSettings(updated);
        dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      // Queue operation for retry
      enqueueOperation({
        type: 'SETTINGS_UPDATE',
        payload: { settings: newSettings },
      });
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to update settings');
      dismissLoadingAndShowError(toastId, `${errorMessage}. Operation queued for retry.`);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'updateSettings' });
      logger.error('Failed to update settings', err, {
        module: 'SecurityOperations',
        action: 'updateSettings',
      });
    } finally {
      setLoading((prev) => ({ ...prev, settings: false }));
    }
  }, [canUpdateSettings, enqueueOperation, trackAction, trackError]);

  const createCamera = useCallback(async (payload: CreateCameraPayload) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const startTime = Date.now();
    const toastId = showLoading('Provisioning camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    trackAction('create', 'camera', { cameraName: payload.name, location: payload.location });
    try {
      const created = await retryWithBackoff(
        () => securityOpsService.createCamera(payload),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (created) {
        setCameras((prev) => [created, ...prev]);
        const duration = Date.now() - startTime;
        trackPerformance('createCamera', duration, { cameraId: created.id });
        dismissLoadingAndShowSuccess(toastId, 'Camera provisioned successfully');
      } else {
        throw new Error('Failed to provision camera');
      }
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to provision camera');
      dismissLoadingAndShowError(toastId, errorMessage);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'createCamera', payload });
      logger.error('Failed to create camera', err, {
        module: 'SecurityOperations',
        action: 'createCamera',
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras, trackAction, trackPerformance, trackError]);

  const updateCamera = useCallback(async (cameraId: string, payload: UpdateCameraPayload) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    // Find current camera for version tracking
    const currentCamera = cameras.find(c => c.id === cameraId);
    if (!currentCamera) {
      showError('Camera not found');
      return;
    }

    const startTime = Date.now();
    const toastId = showLoading('Updating camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    trackAction('update', 'camera', { cameraId, cameraName: currentCamera.name });
    
    try {
      // Add version info for optimistic locking
      const updatePayload = {
        ...payload,
        version: currentCamera.version || 1
      };

      const updated = await securityOpsService.updateCamera(cameraId, updatePayload);
      if (updated) {
        setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? updated : camera)));
        const duration = Date.now() - startTime;
        trackPerformance('updateCamera', duration, { cameraId });
        dismissLoadingAndShowSuccess(toastId, 'Camera updated successfully');
      } else {
        throw new Error('Failed to update camera');
      }
    } catch (error) {
      // Handle optimistic locking conflicts
      if (error instanceof Error && error.message.includes('conflict')) {
        dismissLoadingAndShowError(toastId, 'Camera was modified by another user. Refreshing...');
        await refreshCameras(); // Reload fresh data
      } else {
        dismissLoadingAndShowError(toastId, 'Failed to update camera');
      }
      
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'updateCamera', cameraId });
      logger.error('Failed to update camera', err, {
        module: 'SecurityOperations',
        action: 'updateCamera',
        cameraId,
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras, cameras, refreshCameras, trackAction, trackPerformance, trackError]);

  const deleteCamera = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const camera = cameras.find(c => c.id === cameraId);
    const startTime = Date.now();
    const toastId = showLoading('Removing camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    trackAction('delete', 'camera', { cameraId, cameraName: camera?.name });
    
    try {
      const success = await retryWithBackoff(
        () => securityOpsService.deleteCamera(cameraId),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (success) {
        auditTrailService.logCameraChange('delete', cameraId, undefined, { cameraName: camera?.name });
        setCameras((prev) => prev.filter((camera) => camera.id !== cameraId));
        const duration = Date.now() - startTime;
        trackPerformance('deleteCamera', duration, { cameraId });
        dismissLoadingAndShowSuccess(toastId, 'Camera removed');
      } else {
        throw new Error('Failed to remove camera');
      }
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to remove camera');
      dismissLoadingAndShowError(toastId, errorMessage);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'deleteCamera', cameraId });
      logger.error('Failed to delete camera', err, {
        module: 'SecurityOperations',
        action: 'deleteCamera',
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras, cameras, trackAction, trackPerformance, trackError]);

  const toggleRecording = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    // Offline guard: prevent toggling offline cameras
    if (camera.status === 'offline') {
      showError(`Camera "${camera.name}" is offline. Restore connectivity before changing recording.`);
      return;
    }

    const nextRecording = !camera.isRecording;
    trackAction('toggle_recording', 'camera', { cameraId, cameraName: camera.name, newState: nextRecording });

    // Check if network is offline - queue operation
    if (!navigator.onLine) {
      enqueueOperation({
        type: 'CAMERA_TOGGLE_RECORDING',
        payload: { cameraId, updatePayload: { isRecording: nextRecording } },
      });
      // Optimistically update UI
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isRecording: nextRecording } : c))
      );
      showInfo('Operation queued. Will execute when online.');
      return;
    }

    // Optimistic update
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, isRecording: nextRecording } : c))
    );
    try {
      await updateCamera(cameraId, { isRecording: nextRecording });
      showSuccess('Recording status updated');
    } catch {
      // Rollback on error
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isRecording: camera.isRecording } : c))
      );
    }
  }, [canManageCameras, cameras, updateCamera, enqueueOperation, trackAction]);

  const toggleMotionDetection = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    // Offline guard: prevent toggling offline cameras
    if (camera.status === 'offline') {
      showError(`Camera "${camera.name}" is offline. Restore connectivity before changing motion detection.`);
      return;
    }

    // Check if network is offline - queue operation
    if (!navigator.onLine) {
      const nextMotion = !camera.motionDetectionEnabled;
      enqueueOperation({
        type: 'CAMERA_TOGGLE_MOTION',
        payload: { cameraId, updatePayload: { motionDetectionEnabled: nextMotion } },
      });
      // Optimistically update UI
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, motionDetectionEnabled: nextMotion } : c))
      );
      showInfo('Operation queued. Will execute when online.');
      return;
    }

    const nextMotion = !camera.motionDetectionEnabled;
    // Optimistic update
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, motionDetectionEnabled: nextMotion } : c))
    );
    try {
      await updateCamera(cameraId, { motionDetectionEnabled: nextMotion });
      showSuccess('Motion detection updated');
    } catch {
      // Rollback on error
      setCameras((prev) =>
        prev.map((c) =>
          c.id === cameraId ? { ...c, motionDetectionEnabled: camera.motionDetectionEnabled } : c
        )
      );
    }
  }, [canManageCameras, cameras, updateCamera, enqueueOperation]);

  const reportCameraIssue = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to report issues');
      return;
    }

    const camera = cameras.find(c => c.id === cameraId);
    const startTime = Date.now();
    const toastId = showLoading('Reporting issue...');
    setLoading((prev) => ({ ...prev, actions: true }));
    trackAction('report_issue', 'camera', { cameraId, cameraName: camera?.name });
    
    try {
      const ok = await retryWithBackoff(
        () => securityOpsService.reportCameraIssue(cameraId),
        { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
      );
      if (ok) {
        const duration = Date.now() - startTime;
        trackPerformance('reportCameraIssue', duration, { cameraId });
        dismissLoadingAndShowSuccess(toastId, 'Issue reported to maintenance');
      } else {
        throw new Error('Report failed');
      }
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'Failed to report issue');
      dismissLoadingAndShowError(toastId, errorMessage);
      const err = error instanceof Error ? error : new Error(String(error));
      trackError(err, { action: 'reportCameraIssue', cameraId });
      logger.error('Failed to report issue', err, {
        module: 'SecurityOperations',
        action: 'reportCameraIssue',
        cameraId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras, cameras, trackAction, trackPerformance, trackError]);

  const emergencyStopAllRecording = useCallback(async () => {
    const recordingCameras = cameras.filter((c) => c.isRecording);
    if (recordingCameras.length === 0) {
      showInfo('No cameras are currently recording');
      return;
    }
    setLoading((prev) => ({ ...prev, actions: true }));
    const toastId = showLoading(`Stopping recording on ${recordingCameras.length} camera(s)...`);
    try {
      await Promise.all(
        recordingCameras.map((c) =>
          securityOpsService.updateCamera(c.id, { isRecording: false })
        )
      );
      await refreshCameras();
      dismissLoadingAndShowSuccess(toastId, `Recording stopped on ${recordingCameras.length} camera(s).`);
      trackAction('emergency_stop', 'camera', { count: recordingCameras.length });
    } catch (error) {
      const msg = ErrorHandlerService.handle(error, 'Emergency stop failed');
      dismissLoadingAndShowError(toastId, msg);
      await refreshCameras(); // still refresh to reflect partial state
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [cameras, refreshCameras, trackAction]);

  useEffect(() => {
    refreshCameras();
    refreshRecordings();
    refreshEvidence();
    refreshMetrics();
    refreshAnalytics();
    refreshSettings();
  }, []);

  useEffect(() => {
    const statusInterval = window.setInterval(() => {
      refreshCameras();
    }, 30000);

    const metricsInterval = window.setInterval(() => {
      refreshMetrics();
    }, 300000);

    return () => {
      window.clearInterval(statusInterval);
      window.clearInterval(metricsInterval);
    };
  }, [refreshCameras, refreshMetrics]);

  return {
    cameras,
    recordings,
    evidence,
    metrics,
    analytics,
    settings,
    loading,
    canManageCameras,
    canManageEvidence,
    canUpdateSettings,
    selectedCamera,
    setSelectedCamera,
    selectedRecording,
    setSelectedRecording,
    selectedEvidence,
    setSelectedEvidence,
    showEvidenceModal,
    setShowEvidenceModal,
    // Setters for WebSocket integration
    setCameras,
    setRecordings,
    setEvidence,
    setMetrics,
    setAnalytics,
    setSettings,
    refreshCameras,
    refreshRecordings,
    refreshEvidence,
    refreshMetrics,
    refreshAnalytics,
    refreshSettings,
    createCamera,
    updateCamera,
    deleteCamera,
    markEvidenceReviewed,
    archiveEvidence,
    updateEvidenceStatus,
    updateSettings,
    toggleRecording,
    toggleMotionDetection,
    reportCameraIssue,
    emergencyStopAllRecording,
  };
}
