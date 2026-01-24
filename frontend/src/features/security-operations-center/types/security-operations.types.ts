// Security Operations Center - Types

export type TabId = 'live' | 'recordings' | 'evidence' | 'analytics' | 'settings' | 'provisioning';

export interface CameraEntry {
  id: string;
  name: string;
  location: string;
  ipAddress: string;
  streamUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  resolution?: string;
  uptime?: string;
  previewType?: 'online' | 'offline' | 'maintenance';
  actionsDisabled?: boolean;
  isRecording?: boolean;
  motionDetectionEnabled?: boolean;
  fps?: string;
  storage?: string;
  hardwareStatus?: Record<string, unknown>;
  lastKnownImageUrl?: string;
}

export interface CameraMetrics {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  recording: number;
  avgUptime: string;
}

export interface Recording {
  id: string;
  cameraId: number;
  cameraName: string;
  date: string;
  time: string;
  duration: string;
  size: string;
  thumbnail?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  camera: string;
  time: string;
  date: string;
  type: 'video' | 'photo';
  size: string;
  incidentId?: string;
  chainOfCustody: Array<{ timestamp: string; handler: string; action: string }>;
  tags: string[];
  status: 'pending' | 'reviewed' | 'archived';
}

export interface AnalyticsData {
  motionEvents: number;
  alertsTriggered: number;
  averageResponseTime: string;
  peakActivity: string;
}

export interface SecurityOperationsSettings {
  recordingQuality: string;
  recordingDuration: string;
  motionSensitivity: string;
  storageRetention: string;
  autoDelete: boolean;
  notifyOnMotion: boolean;
  notifyOnOffline: boolean;
  nightVisionAuto: boolean;
}

export interface CreateCameraPayload {
  name: string;
  location: string;
  ipAddress: string;
  streamUrl: string;
  credentials?: {
    username?: string;
    password?: string;
  };
}

export interface UpdateCameraPayload {
  name?: string;
  location?: string;
  ipAddress?: string;
  streamUrl?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
  status?: CameraEntry['status'];
  isRecording?: boolean;
  motionDetectionEnabled?: boolean;
}
