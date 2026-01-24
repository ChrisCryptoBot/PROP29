import apiService from '../../../services/ApiService';
import { logger } from '../../../services/logger';
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
}

const mapCamera = (camera: CameraApiResponse): CameraEntry => ({
  id: camera.camera_id,
  name: camera.name,
  location: typeof camera.location === 'string' ? camera.location : (camera.location.label as string) || 'Unknown',
  ipAddress: camera.ip_address,
  streamUrl: camera.stream_url,
  status: camera.status,
  isRecording: camera.is_recording,
  motionDetectionEnabled: camera.motion_detection_enabled,
  hardwareStatus: camera.hardware_status,
  lastKnownImageUrl: camera.last_known_image_url || undefined,
});

export async function getCameras(): Promise<CameraEntry[]> {
  try {
    const response = await apiService.get<CameraApiResponse[]>('/security-operations/cameras');
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
    const response = await apiService.post<CameraApiResponse>('/security-operations/cameras', {
      name: payload.name,
      location: payload.location,
      ip_address: payload.ipAddress,
      stream_url: payload.streamUrl,
      credentials: payload.credentials,
    });
    return response.data ? mapCamera(response.data) : null;
  } catch (error) {
    logger.error('Failed to create camera', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'createCamera',
    });
    return null;
  }
}

export async function updateCamera(cameraId: string, payload: UpdateCameraPayload): Promise<CameraEntry | null> {
  try {
    const response = await apiService.put<CameraApiResponse>(`/security-operations/cameras/${cameraId}`, {
      name: payload.name,
      location: payload.location,
      ip_address: payload.ipAddress,
      stream_url: payload.streamUrl,
      credentials: payload.credentials,
      status: payload.status,
      is_recording: payload.isRecording,
      motion_detection_enabled: payload.motionDetectionEnabled,
    });
    return response.data ? mapCamera(response.data) : null;
  } catch (error) {
    logger.error('Failed to update camera', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateCamera',
    });
    return null;
  }
}

export async function deleteCamera(cameraId: string): Promise<boolean> {
  try {
    const response = await apiService.delete<void>(`/security-operations/cameras/${cameraId}`);
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
    const response = await apiService.get<{ data?: Recording[] }>('/security-operations/recordings');
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
    const response = await apiService.get<{ data?: EvidenceItem[] }>('/security-operations/evidence');
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
    const response = await apiService.get<{
      total: number;
      online: number;
      offline: number;
      maintenance: number;
      recording: number;
      avg_uptime: string;
    }>('/security-operations/metrics');
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
    const response = await apiService.get<{ data?: AnalyticsData }>('/security-operations/analytics');
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
    const response = await apiService.get<{ data?: SecurityOperationsSettings }>('/security-operations/settings');
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
    const response = await apiService.put<{ data?: SecurityOperationsSettings }>(
      '/security-operations/settings',
      settings
    );
    const data = (response.data as { data?: SecurityOperationsSettings } | undefined)?.data;
    return data ?? null;
  } catch (error) {
    logger.error('Failed to update settings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateSettings',
    });
    return null;
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
    const response = await apiService.patch<{ id: string; status: string }>(
      `/security-operations/evidence/${itemId}`,
      { status }
    );
    return !!response.data;
  } catch (error) {
    logger.error('Failed to update evidence status', error instanceof Error ? error : new Error(String(error)), {
      module: 'SecurityOperationsService',
      action: 'updateEvidenceStatus',
      itemId,
    });
    return false;
  }
}
