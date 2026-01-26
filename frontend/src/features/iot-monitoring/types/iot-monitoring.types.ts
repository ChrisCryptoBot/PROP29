/**
 * Unified IoT Monitoring Types
 * Combines Environmental and Sound Monitoring types
 */

// Sensor Types
export type EnvironmentalSensorType = 'temperature' | 'humidity' | 'air_quality' | 'light' | 'pressure';
export type SoundSensorType = 'audio' | 'noise';
export type SensorType = EnvironmentalSensorType | SoundSensorType;

export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'false_positive';
export type SensorCategory = 'environmental' | 'sound';

// Environmental Sensor Data
export interface EnvironmentalSensor {
  id: string;
  sensor_id: string;
  sensor_type: EnvironmentalSensorType;
  camera_id?: string;
  camera_name?: string;
  value?: number;
  unit?: string;
  light_level?: number;
  location: string;
  timestamp: string;
  status: SensorStatus;
  threshold_min?: number;
  threshold_max?: number;
  category: 'environmental';
}

// Sound Sensor Data
export interface SoundSensor {
  id: string;
  sensor_id: string;
  sensor_type: SoundSensorType;
  location: string;
  zone_id?: string;
  zone_name?: string;
  current_decibel_level: number;
  threshold: number;
  timestamp: string;
  status: SensorStatus;
  category: 'sound';
}

export type UnifiedSensor = EnvironmentalSensor | SoundSensor;

// Sound Zone
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

// Unified Alert
export interface EnvironmentalAlert {
  id: string;
  sensor_id: string;
  camera_id?: string;
  camera_name?: string;
  alert_type: 'temperature' | 'humidity' | 'air_quality' | 'fire' | 'flood';
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  status: AlertStatus;
  location: string;
  light_level?: number;
  noise_level?: number;
  category: 'environmental';
}

export interface SoundAlert {
  id: string;
  type: string;
  location: string;
  timestamp: string;
  decibelLevel: number;
  status: AlertStatus;
  severity: AlertSeverity;
  frequency: number;
  duration: number;
  description?: string;
  assignedTo?: string;
  responseTime?: number;
  zone_id?: string;
  category: 'sound';
}

export type UnifiedAlert = EnvironmentalAlert | SoundAlert;

// Metrics
export interface EnvironmentalMetrics {
  total_sensors: number;
  active_sensors: number;
  alerts_count: number;
  critical_alerts: number;
  category: 'environmental';
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
  category: 'sound';
}

export interface UnifiedMetrics {
  environmental: EnvironmentalMetrics;
  sound: SoundMetrics;
  totalSensors: number;
  totalActiveSensors: number;
  totalAlerts: number;
  totalCriticalAlerts: number;
}

// Audio Visualization
export interface AudioVisualization {
  waveform: number[];
  spectrum: { frequency: number; amplitude: number }[];
  realTimeLevel: number;
  isRecording: boolean;
  timestamp: string;
}

// Settings
export interface EnvironmentalSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  refreshInterval: string;
  enableNotifications: boolean;
  criticalAlertsOnly: boolean;
  autoAcknowledge: boolean;
  dataRetention: string;
  alertSoundEnabled: boolean;
  emailNotifications: boolean;
}

export interface SoundMonitoringSettings {
  alertThreshold: number;
  notificationEnabled: boolean;
  autoAcknowledge: boolean;
  zones: SoundZone[];
}

export interface UnifiedSettings {
  environmental: EnvironmentalSettings;
  sound: SoundMonitoringSettings;
}

// Form Data
export interface SensorFormData {
  sensor_id: string;
  sensor_type: SensorType;
  location: string;
  threshold_min?: string;
  threshold_max?: string;
  threshold?: number; // For sound sensors
  category: SensorCategory;
}

// Filters
export interface SoundMonitoringFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export interface EnvironmentalFilters {
  sensor_type?: EnvironmentalSensorType;
  status?: SensorStatus;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export type TabId = 'overview' | 'environmental' | 'sound' | 'alerts' | 'analytics' | 'settings';
