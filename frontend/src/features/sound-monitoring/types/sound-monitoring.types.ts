/**
 * Sound Monitoring Types
 * Type definitions for Sound Monitoring feature
 */

export interface SoundAlert {
  id: number;
  type: string;
  location: string;
  timestamp: string;
  decibelLevel: number;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  duration: number;
  description?: string;
  assignedTo?: string;
  responseTime?: number;
}

export interface SoundZone {
  id: string;
  name: string;
  location: string;
  type: 'public' | 'guest' | 'recreation' | 'private' | 'dining';
  status: 'active' | 'inactive' | 'maintenance';
  currentDecibelLevel: number;
  threshold: number;
  lastAlert?: string;
  sensorCount: number;
  coverage: number;
}

export interface SoundMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedToday: number;
  averageDecibelLevel: number;
  peakDecibelLevel: number;
  systemUptime: number;
  falsePositiveRate: number;
  responseTime: number;
  zonesMonitored: number;
  sensorsActive: number;
}

export interface AudioVisualization {
  waveform: number[];
  spectrum: { frequency: number; amplitude: number }[];
  realTimeLevel: number;
  isRecording: boolean;
  timestamp: string;
}

export interface SoundMonitoringSettings {
  alertThreshold: number;
  notificationEnabled: boolean;
  autoAcknowledge: boolean;
  zones: SoundZone[];
  // Additional settings can be added here
}

export interface SoundMonitoringFilters {
  status?: SoundAlert['status'];
  severity?: SoundAlert['severity'];
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export type TabId = 'overview' | 'monitoring' | 'alerts' | 'analytics' | 'settings';
