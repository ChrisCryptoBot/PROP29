/**
 * Security Operations Center WebSocket Hook
 * Handles real-time updates for cameras, recordings, evidence, and alerts.
 * Uses a ref for options to avoid subscribe/unsubscribe churn from inline callbacks.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import { reconcileCameraArray } from '../services/stateReconciliationService';
import type { CameraEntry, Recording, EvidenceItem, CameraMetrics, AnalyticsData } from '../types/security-operations.types';
import type { Dispatch, SetStateAction } from 'react';

export interface UseSecurityOperationsWebSocketOptions {
  onCameraUpdated?: (camera: CameraEntry) => void;
  onCameraStatusChanged?: (data: { cameraId: string; status: 'online' | 'offline' | 'maintenance' }) => void;
  onRecordingCreated?: (recording: Recording) => void;
  onEvidenceUpdated?: (evidence: EvidenceItem) => void;
  onAlertTriggered?: (data: { cameraId: string; alertType: string; message: string }) => void;
  onMetricsUpdated?: (metrics: CameraMetrics) => void;
  onAnalyticsUpdated?: (analytics: AnalyticsData) => void;
  setCameras?: Dispatch<SetStateAction<CameraEntry[]>>;
  setRecordings?: Dispatch<SetStateAction<Recording[]>>;
  setEvidence?: Dispatch<SetStateAction<EvidenceItem[]>>;
  setMetrics?: Dispatch<SetStateAction<CameraMetrics>>;
  setAnalytics?: Dispatch<SetStateAction<AnalyticsData>>;
}

export function useSecurityOperationsWebSocket(options: UseSecurityOperationsWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected, skipping security-operations subscriptions', {
        module: 'SecurityOperationsWebSocket'
      });
      return;
    }

    logger.info('Subscribing to security-operations WebSocket channels', {
      module: 'SecurityOperationsWebSocket'
    });

    const unsubscribeCameraUpdated = subscribe('security-operations.camera.updated', (data: any) => {
      const o = optsRef.current;
      if (!data?.camera || !o.setCameras) return;
      
      const cameraId = data.camera.id || data.camera.camera_id;
      const wsCamera = { ...data.camera, id: cameraId };
      
      if (o.onCameraUpdated) {
        logger.info('Camera updated via WebSocket', {
          module: 'SecurityOperationsWebSocket',
          cameraId
        });
        o.onCameraUpdated(wsCamera as CameraEntry);
      }
      
      // Use reconciliation service to resolve conflicts
      o.setCameras((prev) => {
        return reconcileCameraArray(prev, wsCamera);
      });
    });

    const unsubscribeCameraStatusChanged = subscribe('security-operations.camera.status-changed', (data: any) => {
      const o = optsRef.current;
      if (data?.cameraId && data?.status && o.onCameraStatusChanged) {
        logger.info('Camera status changed via WebSocket', {
          module: 'SecurityOperationsWebSocket',
          cameraId: data.cameraId,
          status: data.status
        });
        o.onCameraStatusChanged(data);
      }
      if (data?.cameraId && data?.status && o.setCameras) {
        o.setCameras((prev) =>
          prev.map((camera) =>
            camera.id === data.cameraId ? { ...camera, status: data.status } : camera
          )
        );
      }
    });

    const unsubscribeRecordingCreated = subscribe('security-operations.recording.created', (data: any) => {
      const o = optsRef.current;
      if (data?.recording && o.onRecordingCreated) {
        logger.info('Recording created via WebSocket', {
          module: 'SecurityOperationsWebSocket',
          recordingId: data.recording.id
        });
        o.onRecordingCreated(data.recording);
      }
      if (data?.recording && o.setRecordings) {
        o.setRecordings((prev) => [data.recording, ...prev]);
      }
    });

    const unsubscribeEvidenceUpdated = subscribe('security-operations.evidence.updated', (data: any) => {
      const o = optsRef.current;
      if (data?.evidence && o.onEvidenceUpdated) {
        logger.info('Evidence updated via WebSocket', {
          module: 'SecurityOperationsWebSocket',
          evidenceId: data.evidence.id
        });
        o.onEvidenceUpdated(data.evidence);
      }
      if (data?.evidence && o.setEvidence) {
        o.setEvidence((prev) => {
          const evidenceId = data.evidence.id;
          return prev.map((evidence) => (evidence.id === evidenceId ? { ...evidence, ...data.evidence } : evidence));
        });
      }
    });

    const unsubscribeAlertTriggered = subscribe('security-operations.alert.triggered', (data: any) => {
      if (data?.cameraId && optsRef.current.onAlertTriggered) {
        logger.warn('Alert triggered via WebSocket', {
          module: 'SecurityOperationsWebSocket',
          cameraId: data.cameraId,
          alertType: data.alertType
        });
        optsRef.current.onAlertTriggered(data);
      }
    });

    const unsubscribeMetricsUpdated = subscribe('security-operations.metrics.updated', (data: any) => {
      const o = optsRef.current;
      if (data?.metrics && o.onMetricsUpdated) o.onMetricsUpdated(data.metrics);
      if (data?.metrics && o.setMetrics) o.setMetrics(data.metrics);
    });

    const unsubscribeAnalyticsUpdated = subscribe('security-operations.analytics.updated', (data: any) => {
      const o = optsRef.current;
      if (data?.analytics && o.onAnalyticsUpdated) o.onAnalyticsUpdated(data.analytics);
      if (data?.analytics && o.setAnalytics) o.setAnalytics(data.analytics);
    });

    return () => {
      logger.info('Unsubscribing from security-operations WebSocket channels', {
        module: 'SecurityOperationsWebSocket'
      });
      unsubscribeCameraUpdated();
      unsubscribeCameraStatusChanged();
      unsubscribeRecordingCreated();
      unsubscribeEvidenceUpdated();
      unsubscribeAlertTriggered();
      unsubscribeMetricsUpdated();
      unsubscribeAnalyticsUpdated();
    };
  }, [isConnected, subscribe]);
}
