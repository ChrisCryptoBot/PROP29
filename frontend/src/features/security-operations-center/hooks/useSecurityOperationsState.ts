import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError, showSuccess } from '../../../utils/toast';
import * as securityOpsService from '../services/securityOperationsCenterService';
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
}

export function useSecurityOperationsState(): UseSecurityOperationsStateReturn {
  const { user } = useAuth();

  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some((role) => ['ADMIN', 'SECURITY_OFFICER'].includes(role.toUpperCase()));
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
      const data = await securityOpsService.getCameras();
      setCameras(data);
    } catch (error) {
      logger.error('Failed to refresh cameras', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshCameras',
      });
    } finally {
      setLoading((prev) => ({ ...prev, cameras: false }));
    }
  }, []);

  const refreshRecordings = useCallback(async () => {
    setLoading((prev) => ({ ...prev, recordings: true }));
    try {
      const data = await securityOpsService.getRecordings();
      setRecordings(data);
    } catch (error) {
      logger.error('Failed to refresh recordings', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshRecordings',
      });
    } finally {
      setLoading((prev) => ({ ...prev, recordings: false }));
    }
  }, []);

  const refreshEvidence = useCallback(async () => {
    setLoading((prev) => ({ ...prev, evidence: true }));
    try {
      const data = await securityOpsService.getEvidence();
      setEvidence(data);
    } catch (error) {
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
    setLoading((prev) => ({ ...prev, analytics: true }));
    try {
      const data = await securityOpsService.getAnalytics();
      if (data) {
        setAnalytics(data);
      }
    } catch (error) {
      logger.error('Failed to refresh analytics', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'refreshAnalytics',
      });
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    setLoading((prev) => ({ ...prev, settings: true }));
    try {
      const data = await securityOpsService.getSettings();
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

  const markEvidenceReviewed = useCallback(async (itemId: string) => {
    if (!canManageEvidence) {
      showError('You do not have permission to review evidence');
      return;
    }

    const toastId = showLoading('Marking evidence as reviewed...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const ok = await securityOpsService.updateEvidenceStatus(itemId, 'reviewed');
      if (ok) {
        await refreshEvidence();
        dismissLoadingAndShowSuccess(toastId, 'Evidence marked as reviewed');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update evidence');
      logger.error('Failed to mark evidence reviewed', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'markEvidenceReviewed',
        itemId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageEvidence, refreshEvidence]);

  const archiveEvidence = useCallback(async (itemId: string) => {
    if (!canManageEvidence) {
      showError('You do not have permission to archive evidence');
      return;
    }

    const toastId = showLoading('Archiving evidence...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const ok = await securityOpsService.updateEvidenceStatus(itemId, 'archived');
      if (ok) {
        await refreshEvidence();
        dismissLoadingAndShowSuccess(toastId, 'Evidence archived');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to archive evidence');
      logger.error('Failed to archive evidence', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'archiveEvidence',
        itemId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageEvidence, refreshEvidence]);

  const updateEvidenceStatus = useCallback(
    async (itemId: string, status: 'pending' | 'reviewed' | 'archived') => {
      if (!canManageEvidence) {
        showError('You do not have permission to update evidence');
        return;
      }
      const toastId = showLoading('Updating evidence status...');
      setLoading((prev) => ({ ...prev, actions: true }));
      try {
        const ok = await securityOpsService.updateEvidenceStatus(itemId, status);
        if (ok) {
          await refreshEvidence();
          dismissLoadingAndShowSuccess(toastId, `Evidence status set to ${status}`);
        } else {
          throw new Error('Update failed');
        }
      } catch (error) {
        dismissLoadingAndShowError(toastId, 'Failed to update evidence status');
        logger.error('Failed to update evidence status', error instanceof Error ? error : new Error(String(error)), {
          module: 'SecurityOperations',
          action: 'updateEvidenceStatus',
          itemId,
        });
      } finally {
        setLoading((prev) => ({ ...prev, actions: false }));
      }
    },
    [canManageEvidence, refreshEvidence]
  );

  const updateSettings = useCallback(async (newSettings: SecurityOperationsSettings) => {
    if (!canUpdateSettings) {
      showError('You do not have permission to update settings');
      return;
    }

    const toastId = showLoading('Updating settings...');
    setLoading((prev) => ({ ...prev, settings: true }));
    try {
      const updated = await securityOpsService.updateSettings(newSettings);
      if (updated) {
        setSettings(updated);
        dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update settings');
      logger.error('Failed to update settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'updateSettings',
      });
    } finally {
      setLoading((prev) => ({ ...prev, settings: false }));
    }
  }, [canUpdateSettings]);

  const createCamera = useCallback(async (payload: CreateCameraPayload) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const toastId = showLoading('Provisioning camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const created = await securityOpsService.createCamera(payload);
      if (created) {
        setCameras((prev) => [created, ...prev]);
        dismissLoadingAndShowSuccess(toastId, 'Camera provisioned successfully');
      } else {
        throw new Error('Failed to provision camera');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to provision camera');
      logger.error('Failed to create camera', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'createCamera',
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras]);

  const updateCamera = useCallback(async (cameraId: string, payload: UpdateCameraPayload) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const toastId = showLoading('Updating camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const updated = await securityOpsService.updateCamera(cameraId, payload);
      if (updated) {
        setCameras((prev) => prev.map((camera) => (camera.id === cameraId ? updated : camera)));
        dismissLoadingAndShowSuccess(toastId, 'Camera updated successfully');
      } else {
        throw new Error('Failed to update camera');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update camera');
      logger.error('Failed to update camera', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'updateCamera',
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras]);

  const deleteCamera = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const toastId = showLoading('Removing camera...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const success = await securityOpsService.deleteCamera(cameraId);
      if (success) {
        setCameras((prev) => prev.filter((camera) => camera.id !== cameraId));
        dismissLoadingAndShowSuccess(toastId, 'Camera removed');
      } else {
        throw new Error('Failed to remove camera');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to remove camera');
      logger.error('Failed to delete camera', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'deleteCamera',
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras]);

  const toggleRecording = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    if (camera.status === 'offline') {
      showError(`Camera "${camera.name}" is offline. Restore connectivity before changing recording.`);
      return;
    }

    const nextRecording = !camera.isRecording;
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, isRecording: nextRecording } : c))
    );
    try {
      await updateCamera(cameraId, { isRecording: nextRecording });
      showSuccess('Recording status updated');
    } catch {
      setCameras((prev) =>
        prev.map((c) => (c.id === cameraId ? { ...c, isRecording: camera.isRecording } : c))
      );
    }
  }, [canManageCameras, cameras, updateCamera]);

  const toggleMotionDetection = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to manage cameras');
      return;
    }

    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    if (camera.status === 'offline') {
      showError(`Camera "${camera.name}" is offline. Restore connectivity before changing motion detection.`);
      return;
    }

    const nextMotion = !camera.motionDetectionEnabled;
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, motionDetectionEnabled: nextMotion } : c))
    );
    try {
      await updateCamera(cameraId, { motionDetectionEnabled: nextMotion });
      showSuccess('Motion detection updated');
    } catch {
      setCameras((prev) =>
        prev.map((c) =>
          c.id === cameraId ? { ...c, motionDetectionEnabled: camera.motionDetectionEnabled } : c
        )
      );
    }
  }, [canManageCameras, cameras, updateCamera]);

  const reportCameraIssue = useCallback(async (cameraId: string) => {
    if (!canManageCameras) {
      showError('You do not have permission to report issues');
      return;
    }

    const toastId = showLoading('Reporting issue...');
    setLoading((prev) => ({ ...prev, actions: true }));
    try {
      const ok = await securityOpsService.reportCameraIssue(cameraId);
      if (ok) {
        dismissLoadingAndShowSuccess(toastId, 'Issue reported to maintenance');
      } else {
        throw new Error('Report failed');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to report issue');
      logger.error('Failed to report issue', error instanceof Error ? error : new Error(String(error)), {
        module: 'SecurityOperations',
        action: 'reportCameraIssue',
        cameraId,
      });
    } finally {
      setLoading((prev) => ({ ...prev, actions: false }));
    }
  }, [canManageCameras]);

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
  };
}
