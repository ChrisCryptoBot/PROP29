/**
 * Security Operations Center WebSocket Integration Component
 * Encapsulates WebSocket logic and updates context state
 */

import React from 'react';
import { useSecurityOperationsWebSocket } from '../hooks/useSecurityOperationsWebSocket';
import { useSecurityOperationsContext } from '../context/SecurityOperationsContext';
import { logger } from '../../../services/logger';

export const SecurityOperationsWebSocketIntegration: React.FC = () => {
  const {
    setCameras,
    setRecordings,
    setEvidence,
    setMetrics,
    setAnalytics,
  } = useSecurityOperationsContext();

  useSecurityOperationsWebSocket({
    onCameraUpdated: (camera) => {
      logger.info('Camera updated via WebSocket, updating context', {
        module: 'SecurityOperationsWebSocketIntegration',
        cameraId: camera.id,
      });
    },
    onCameraStatusChanged: (data) => {
      logger.info('Camera status changed via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
        cameraId: data.cameraId,
        status: data.status,
      });
    },
    onRecordingCreated: (recording) => {
      logger.info('Recording created via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
        recordingId: recording.id,
      });
    },
    onEvidenceUpdated: (evidence) => {
      logger.info('Evidence updated via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
        evidenceId: evidence.id,
      });
    },
    onAlertTriggered: (data) => {
      logger.warn('Alert triggered via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
        cameraId: data.cameraId,
        alertType: data.alertType,
      });
    },
    onMetricsUpdated: (metrics) => {
      logger.info('Metrics updated via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
      });
    },
    onAnalyticsUpdated: (analytics) => {
      logger.info('Analytics updated via WebSocket', {
        module: 'SecurityOperationsWebSocketIntegration',
      });
    },
    setCameras,
    setRecordings,
    setEvidence,
    setMetrics,
    setAnalytics,
  });

  return null; // This component doesn't render anything
};
