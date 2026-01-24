// IoT Environmental Monitoring types

export type SensorType = 'temperature' | 'humidity' | 'air_quality' | 'light' | 'noise' | 'pressure';
export type SensorStatus = 'normal' | 'warning' | 'critical';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface EnvironmentalData {
  id: string;
  sensor_id: string;
  sensor_type: SensorType;
  camera_id?: string;
  camera_name?: string;
  value?: number;
  unit?: string;
  light_level?: number;
  noise_level?: number;
  location: string;
  timestamp: string;
  status: SensorStatus;
  threshold_min?: number;
  threshold_max?: number;
}

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
}

export interface SensorFormData {
  sensor_id: string;
  sensor_type: SensorType;
  location: string;
  threshold_min: string;
  threshold_max: string;
}

export interface IoTEnvironmentalSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  refreshInterval: string;
  enableNotifications: boolean;
  criticalAlertsOnly: boolean;
  autoAcknowledge: boolean;
  dataRetention: string;
  alertSoundEnabled: boolean;
  emailNotifications: boolean;
}
