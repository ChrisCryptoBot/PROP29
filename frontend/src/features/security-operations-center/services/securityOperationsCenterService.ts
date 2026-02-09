import apiService from '../../../services/ApiService';
import { getBackendOrigin } from '../../../config/env';
import { logger } from '../../../services/logger';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
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

interface CameraApiResponse {
  camera_id: string;
  name: string;
  location: string | Record<string, unknown>;
  ip_address: string;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance';
  hardware_status?: Record<string, unknown>;
  is_recording: boolean;
  motion_detection_enabled: boolean;
  last_known_image_url?: string | null;
  last_heartbeat?: string | null;
  last_status_change?: string | null;
  version?: number;
  updated_at?: string | null;
}

/** Longer timeout for SOC endpoints; backend can be slow when many requests hit at once on load. */
const SOC_REQUEST_TIMEOUT_MS = 25000;

/** Resolve stream URL to an absolute backend URL so HLS requests hit the API server (avoids dev proxy 404). */
function resolveStreamUrl(streamUrl: string): string {
  if (!streamUrl) return streamUrl;
  if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) return streamUrl;
  const origin = getBackendOrigin();
  const path = streamUrl.startsWith('/') ? streamUrl : `/${streamUrl}`;
  return `${origin}${path}`;
}

/** Resolve poster/last-image URL to backend origin so <img>/poster work when frontend and API differ. */
function resolvePosterUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = getBackendOrigin();
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${path}`;
}

const mapCamera = (camera: CameraApiResponse): CameraEntry => ({
  id: camera.camera_id,
  name: camera.name,
  location: typeof camera.location === 'string' ? camera.location : (camera.location.label as string) || 'Unknown',
  ipAddress: camera.ip_address,
  streamUrl: resolveStreamUrl(camera.stream_url),
  status: camera.status,
  isRecording: camera.is_recording,
  motionDetectionEnabled: camera.motion_detection_enabled,
  hardwareStatus: camera.hardware_status,
  lastKnownImageUrl: resolvePosterUrl(camera.last_known_image_url) ?? undefined,
  lastHeartbeat: camera.last_heartbeat ?? undefined,
  lastStatusChange: camera.last_status_change ?? undefined,
  version: camera.version ?? 1,
  lastUpdated: camera.updated_at ?? undefined,
});

export async function getCameras(): Promise<CameraEntry[]> {
  try {
    const response = await retryWithBackoff(
      () => apiService.get<CameraApiResponse[]>('/security-operations/cameras', { timeout: SOC_REQUEST_TIMEOUT_MS }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    return response.data ? response.data.map(mapCamera) : [];
  } catch (error) {
    logger.error('Failed to fetch cameras', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getCameras',
    });
    return [];
  }
}

export async function createCamera(payload: CreateCameraPayload): Promise<CameraEntry | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.post<CameraApiResponse>('/security-operations/cameras', {
        name: payload.name,
        location: payload.location,
        ip_address: payload.ipAddress,
        stream_url: payload.streamUrl,
        credentials: payload.credentials,
      }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    return response.data ? mapCamera(response.data) : null;
  } catch (error) {
    logger.error('Failed to create camera', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'createCamera',
    });
    return null;
  }
}

export async function updateCamera(cameraId: string, payload: UpdateCameraPayload & { version?: number }): Promise<CameraEntry | null> {
  try {
    const requestBody: any = {
      name: payload.name,
      location: payload.location,
      ip_address: payload.ipAddress,
      stream_url: payload.streamUrl,
      credentials: payload.credentials,
      status: payload.status,
      is_recording: payload.isRecording,
      motion_detection_enabled: payload.motionDetectionEnabled,
    };
    
    // Include version for optimistic locking if provided
    if (payload.version !== undefined) {
      requestBody.version = payload.version;
    }

    const response = await retryWithBackoff(
      () => apiService.put<CameraApiResponse>(`/security-operations/cameras/${cameraId}`, requestBody),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    if (!response.success && typeof response.statusCode === 'number' && response.statusCode >= 400 && response.statusCode < 500) {
      const e = new Error(response.error || 'Request failed') as Error & { statusCode: number };
      e.statusCode = response.statusCode;
      throw e;
    }
    return response.data ? mapCamera(response.data) : null;
  } catch (error) {
    if (error && typeof (error as any).statusCode === 'number' && (error as any).statusCode >= 400 && (error as any).statusCode < 500) {
      throw error;
    }
    logger.error('Failed to update camera', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateCamera',
      cameraId,
    });
    return null;
  }
}

export async function deleteCamera(cameraId: string): Promise<boolean> {
  try {
    // Backend returns 204 No Content; success is inferred from 2xx response.
    const response = await retryWithBackoff(
      () => apiService.delete<void>(`/security-operations/cameras/${cameraId}`),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    return response.success === true;
  } catch (error) {
    logger.error('Failed to delete camera', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'deleteCamera',
    });
    return false;
  }
}

export async function getRecordings(): Promise<Recording[]> {
  try {
    const response = await retryWithBackoff(
      () => apiService.get<{ data?: Recording[] }>('/security-operations/recordings', { timeout: SOC_REQUEST_TIMEOUT_MS }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    const list = (response.data as { data?: Recording[] } | undefined)?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error('Failed to fetch recordings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getRecordings',
    });
    return [];
  }
}

export async function getEvidence(): Promise<EvidenceItem[]> {
  try {
    const response = await retryWithBackoff(
      () => apiService.get<{ data?: EvidenceItem[] }>('/security-operations/evidence', { timeout: SOC_REQUEST_TIMEOUT_MS }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    const list = (response.data as { data?: EvidenceItem[] } | undefined)?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    logger.error('Failed to fetch evidence', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getEvidence',
    });
    return [];
  }
}

export async function getMetrics(): Promise<CameraMetrics | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.get<{
        total: number;
        online: number;
        offline: number;
        maintenance: number;
        recording: number;
        avg_uptime: string;
      }>('/security-operations/metrics', { timeout: SOC_REQUEST_TIMEOUT_MS }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    if (!response.data) return null;
    return {
      total: response.data.total,
      online: response.data.online,
      offline: response.data.offline,
      maintenance: response.data.maintenance,
      recording: response.data.recording,
      avgUptime: response.data.avg_uptime,
    };
  } catch (error) {
    logger.error('Failed to fetch camera metrics', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getMetrics',
    });
    return null;
  }
}

export async function getAnalytics(): Promise<AnalyticsData | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.get<{ data?: AnalyticsData }>('/security-operations/analytics', { timeout: SOC_REQUEST_TIMEOUT_MS }),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    const data = (response.data as { data?: AnalyticsData } | undefined)?.data;
    return data ?? null;
  } catch (error) {
    logger.error('Failed to fetch analytics', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getAnalytics',
    });
    return null;
  }
}

export async function getSettings(): Promise<SecurityOperationsSettings | null> {
  try {
    const response = await apiService.get<{ data?: SecurityOperationsSettings }>('/security-operations/settings', { timeout: SOC_REQUEST_TIMEOUT_MS });
    const data = (response.data as { data?: SecurityOperationsSettings } | undefined)?.data;
    return data ?? null;
  } catch (error) {
    logger.error('Failed to fetch settings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getSettings',
    });
    return null;
  }
}

export async function updateSettings(settings: SecurityOperationsSettings): Promise<SecurityOperationsSettings | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.put<{ data?: SecurityOperationsSettings }>(
        '/security-operations/settings',
        settings
      ),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    if (!response.success && typeof response.statusCode === 'number' && response.statusCode >= 400 && response.statusCode < 500) {
      const e = new Error(response.error || 'Request failed') as Error & { statusCode: number };
      e.statusCode = response.statusCode;
      throw e;
    }
    const data = (response.data as { data?: SecurityOperationsSettings } | undefined)?.data;
    return data ?? null;
  } catch (error) {
    if (error && typeof (error as any).statusCode === 'number' && (error as any).statusCode >= 400 && (error as any).statusCode < 500) {
      throw error;
    }
    logger.error('Failed to update settings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateSettings',
    });
    return null;
  }
}

// Valid PTZ actions per backend contract
export const VALID_PTZ_ACTIONS = [
  'pan_left',
  'pan_right',
  'tilt_up',
  'tilt_down',
  'zoom_in',
  'zoom_out',
  'home',
] as const;

export type PTZAction = typeof VALID_PTZ_ACTIONS[number];

export async function controlCameraPTZ(cameraId: string, action: string): Promise<boolean> {
  // Validate action against backend contract
  if (!VALID_PTZ_ACTIONS.includes(action as PTZAction)) {
    logger.error('Invalid PTZ action', new Error(`Invalid PTZ action: ${action}`), {
      module: 'SecurityOperationsService',
      action: 'controlCameraPTZ',
      cameraId,
      ptzAction: action,
      validActions: VALID_PTZ_ACTIONS,
    });
    return false;
  }

  try {
    const response = await retryWithBackoff(
      () => apiService.post<{ ok: boolean }>(`/security-operations/cameras/${cameraId}/ptz`, { action }),
      { maxRetries: 2, baseDelay: 500, maxDelay: 2000 }
    );
    return response.data?.ok ?? false;
  } catch (error) {
    logger.error('Failed to control PTZ', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'controlCameraPTZ',
      cameraId,
      ptzAction: action,
    });
    return false;
  }
}

/** Send a heartbeat so the camera is shown as "Online". Call once or periodically. */
export async function sendCameraHeartbeat(cameraId: string): Promise<boolean> {
  try {
    const response = await apiService.post<{ ok: boolean; camera_id: string; timestamp?: string }>(
      `/security-operations/cameras/${cameraId}/heartbeat`,
      {},
      { timeout: 25000 }
    );
    return response.data?.ok === true;
  } catch (error) {
    logger.error('Failed to send camera heartbeat', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'sendCameraHeartbeat',
      cameraId,
    });
    return false;
  }
}

export async function reportCameraIssue(cameraId: string, details?: { reason?: string }): Promise<boolean> {
  try {
    const response = await apiService.post<{ ok: boolean }>(
      `/security-operations/cameras/${cameraId}/report-issue`,
      details || {}
    );
    return response.data?.ok === true;
  } catch (error) {
    logger.error('Failed to report camera issue', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'reportCameraIssue',
      cameraId,
    });
    return false;
  }
}

export async function updateEvidenceStatus(
  itemId: string,
  status: 'pending' | 'reviewed' | 'archived'
): Promise<boolean> {
  try {
    const response = await retryWithBackoff(
      () => apiService.patch<{ id: string; status: string }>(
        `/security-operations/evidence/${itemId}`,
        { status }
      ),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    if (!response.success && typeof response.statusCode === 'number' && response.statusCode >= 400 && response.statusCode < 500) {
      const e = new Error(response.error || 'Request failed') as Error & { statusCode: number };
      e.statusCode = response.statusCode;
      throw e;
    }
    return !!response.data;
  } catch (error) {
    if (error && typeof (error as any).statusCode === 'number' && (error as any).statusCode >= 400 && (error as any).statusCode < 500) {
      throw error;
    }
    logger.error('Failed to update evidence status', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateEvidenceStatus',
      itemId,
    });
    return false;
  }
}

// Export job types
export interface ExportJob {
  export_id: string;
  recording_id: string;
  format: string;
  quality: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  user_id?: string;
  progress: number;
  file_path?: string;
  file_size?: number;
  error_message?: string;
  download_url?: string;
}

export interface BatchExportJob {
  batch_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_count: number;
  completed_count: number;
  failed_count: number;
  download_url?: string;
  created_at: string;
}

/**
 * Export a single recording
 */
export async function exportRecording(
  recordingId: string,
  format: 'mp4' | 'avi' | 'mov' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'high'
): Promise<ExportJob | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.post<ExportJob>(
        `/security-operations/recordings/${recordingId}/export`,
        { format, quality }
      ),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    return response.data || null;
  } catch (error) {
    logger.error('Failed to export recording', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'exportRecording',
      recordingId,
    });
    return null;
  }
}

/**
 * Export multiple recordings as a batch
 */
export async function exportRecordingsBatch(
  recordingIds: string[],
  format: 'mp4' | 'avi' | 'mov' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'high'
): Promise<BatchExportJob | null> {
  try {
    const response = await retryWithBackoff(
      () => apiService.post<BatchExportJob>(
        '/security-operations/recordings/export-batch',
        { recording_ids: recordingIds, format, quality }
      ),
      { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
    );
    return response.data || null;
  } catch (error) {
    logger.error('Failed to export recordings batch', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'exportRecordingsBatch',
      recordingIds,
    });
    return null;
  }
}

/**
 * Get export job status
 */
export async function getExportStatus(exportId: string): Promise<ExportJob | null> {
  try {
    const response = await apiService.get<ExportJob>(`/security-operations/exports/${exportId}`);
    return response.data || null;
  } catch (error) {
    logger.error('Failed to get export status', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getExportStatus',
      exportId,
    });
    return null;
  }
}

/**
 * List user's export jobs
 */
export async function listUserExports(): Promise<ExportJob[]> {
  try {
    const response = await apiService.get<{ data: ExportJob[] }>('/security-operations/exports');
    return response.data?.data || [];
  } catch (error) {
    logger.error('Failed to list user exports', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'listUserExports',
    });
    return [];
  }
}

/**
 * Download export file
 */
export function getExportDownloadUrl(exportId: string): string {
  return `/api/security-operations/exports/${exportId}`;
}

/**
 * Download batch export file
 */
export function getBatchExportDownloadUrl(batchId: string): string {
  return `/api/security-operations/exports/batch/${batchId}`;
}

/**
 * Get audit trail entries from backend
 */
export async function getAuditTrail(
  entity?: string,
  entityId?: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; total: number } | null> {
  try {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (entityId) params.append('entity_id', entityId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiService.get<{ data: any[]; total: number }>(
      `/security-operations/audit-trail?${params.toString()}`
    );
    return response.data || null;
  } catch (error) {
    logger.error('Failed to get audit trail', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'getAuditTrail',
    });
    return null;
  }
}
