import { useState, useEffect, useCallback, useMemo, createElement } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import apiService from '../../../services/ApiService';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import type {
  EnvironmentalAlert,
  EnvironmentalData,
  IoTEnvironmentalSettings,
  SensorFormData,
} from '../types/iot-environmental.types';

export interface UseIoTEnvironmentalStateReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  environmentalData: EnvironmentalData[];
  alerts: EnvironmentalAlert[];
  loading: boolean;
  canManageSensors: boolean;
  canUpdateSettings: boolean;
  selectedSensor: string;
  setSelectedSensor: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  showAddModal: boolean;
  setShowAddModal: (value: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (value: boolean) => void;
  editingSensor: EnvironmentalData | null;
  setEditingSensor: (value: EnvironmentalData | null) => void;
  viewingSensor: EnvironmentalData | null;
  setViewingSensor: (value: EnvironmentalData | null) => void;
  sensorForm: SensorFormData;
  setSensorForm: (value: SensorFormData) => void;
  settings: IoTEnvironmentalSettings;
  settingsForm: IoTEnvironmentalSettings;
  setSettingsForm: (value: IoTEnvironmentalSettings) => void;
  loadData: () => Promise<void>;
  handleAddSensor: () => Promise<void>;
  handleEditSensor: () => Promise<void>;
  handleDeleteSensor: (sensorId: string) => Promise<void>;
  handleAcknowledgeAlert: (alertId: string) => Promise<void>;
  handleResolveAlert: (alertId: string) => Promise<void>;
  handleExportData: () => Promise<void>;
  handleSaveSettings: () => Promise<void>;
  handleResetSettings: () => void;
  openEditModal: (sensor: EnvironmentalData) => void;
  getStatusColor: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  getAlertSeverityBadgeClass: (severity: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
  getAlertSeverityBadge: (severity: string) => JSX.Element;
  filteredData: EnvironmentalData[];
  uniqueSensors: string[];
  activeAlerts: EnvironmentalAlert[];
  criticalAlerts: EnvironmentalAlert[];
  analytics: {
    total_sensors: number;
    active_sensors: number;
    alerts_count: number;
    critical_alerts: number;
    average_temperature: number;
    average_humidity: number;
    average_air_quality: number;
    sensorsByType: Record<string, number>;
    sensorsByStatus: Record<string, number>;
    normalSensors: number;
    warningSensors: number;
    criticalSensors: number;
  };
}

const defaultSettings: IoTEnvironmentalSettings = {
  temperatureUnit: 'celsius',
  refreshInterval: '30',
  enableNotifications: true,
  criticalAlertsOnly: false,
  autoAcknowledge: false,
  dataRetention: '90',
  alertSoundEnabled: true,
  emailNotifications: true,
};

const emptySensorForm: SensorFormData = {
  sensor_id: '',
  sensor_type: 'temperature',
  location: '',
  threshold_min: '',
  threshold_max: '',
};

export function useIoTEnvironmentalState(): UseIoTEnvironmentalStateReturn {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData[]>([]);
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<EnvironmentalData | null>(null);
  const [viewingSensor, setViewingSensor] = useState<EnvironmentalData | null>(null);
  const [sensorForm, setSensorForm] = useState<SensorFormData>(emptySensorForm);
  const [settings, setSettings] = useState<IoTEnvironmentalSettings>(defaultSettings);
  const [settingsForm, setSettingsForm] = useState<IoTEnvironmentalSettings>(defaultSettings);
  const [analytics, setAnalytics] = useState({
    total_sensors: 0,
    active_sensors: 0,
    alerts_count: 0,
    critical_alerts: 0,
    average_temperature: 0,
    average_humidity: 0,
    average_air_quality: 0,
    sensorsByType: {} as Record<string, number>,
    sensorsByStatus: {} as Record<string, number>,
    normalSensors: 0,
    warningSensors: 0,
    criticalSensors: 0,
  });

  const { subscribe } = useWebSocket();

  const canManageSensors = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role =>
      ['ADMIN', 'SECURITY_MANAGER'].includes(role.toUpperCase())
    );
  }, [user]);

  const canUpdateSettings = canManageSensors;

  const normalizeLocation = useCallback((location: unknown): string => {
    if (!location) return 'Unknown';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && 'label' in (location as Record<string, unknown>)) {
      const label = (location as Record<string, unknown>).label;
      return typeof label === 'string' ? label : 'Unknown';
    }
    return 'Unknown';
  }, []);

  const mapSensorData = useCallback((item: any): EnvironmentalData => ({
    id: item.data_id || item.id,
    sensor_id: item.sensor_id,
    sensor_type: item.sensor_type,
    camera_id: item.camera_id ?? undefined,
    camera_name: item.camera_name ?? undefined,
    value: item.value,
    unit: item.unit,
    light_level: item.light_level ?? undefined,
    noise_level: item.noise_level ?? undefined,
    location: normalizeLocation(item.location),
    timestamp: item.timestamp,
    status: item.status || 'normal',
    threshold_min: item.threshold_min ?? undefined,
    threshold_max: item.threshold_max ?? undefined,
  }), [normalizeLocation]);

  const mapAlert = useCallback((item: any): EnvironmentalAlert => ({
    id: item.alert_id || item.id,
    sensor_id: item.sensor_id,
    camera_id: item.camera_id ?? undefined,
    camera_name: item.camera_name ?? undefined,
    alert_type: item.alert_type,
    severity: item.severity,
    message: item.message,
    timestamp: item.created_at || item.timestamp,
    resolved_at: item.resolved_at,
    resolved: Boolean(item.resolved),
    status: item.status,
    location: normalizeLocation(item.location),
    light_level: item.light_level ?? undefined,
    noise_level: item.noise_level ?? undefined,
  }), [normalizeLocation]);

  const loadData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Loading environmental data...');
      setLoading(true);

      const [dataResponse, alertsResponse, analyticsResponse] = await Promise.all([
        apiService.getEnvironmentalData(),
        apiService.getEnvironmentalAlerts(),
        apiService.getEnvironmentalAnalytics(),
      ]);

      const data = (dataResponse.data || []).map(mapSensorData);
      const alertsData = (alertsResponse.data || []).map(mapAlert);

      setEnvironmentalData(data);
      setAlerts(alertsData);
      if (analyticsResponse.data) {
        setAnalytics(analyticsResponse.data as typeof analytics);
      }

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data loaded successfully');
      }
    } catch (error) {
      logger.error('Error loading environmental data', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'loadEnvironmentalData' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to load environmental data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const unsubscribeData = subscribe('environmental_data', (data: unknown) => {
      if (data && typeof data === 'object' && 'sensor_data' in data) {
        const payload = data as { sensor_data: EnvironmentalData };
        const sensor = payload.sensor_data;
        if (sensor && typeof sensor === 'object' && 'id' in sensor) {
          setEnvironmentalData(prev => {
            const existing = prev.find(item => item.id === sensor.id);
            if (existing) {
              return prev.map(item => item.id === sensor.id ? sensor as EnvironmentalData : item);
            }
            return [sensor as EnvironmentalData, ...prev];
          });
        }
      }
    });

    const unsubscribeAlerts = subscribe('environmental_alert', (data: unknown) => {
      if (data && typeof data === 'object' && 'alert' in data) {
        const payload = data as { alert: EnvironmentalAlert };
        const alert = mapAlert(payload.alert);
        if (alert && typeof alert === 'object' && 'message' in alert) {
          setAlerts(prev => [alert, ...prev]);
          if (settings.enableNotifications) {
            showError(`Environmental Alert: ${alert.message}`);
          }
        }
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeAlerts();
    };
  }, [loadData, settings.enableNotifications, subscribe]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await apiService.getEnvironmentalSettings();
      if (response.data) {
        setSettings(response.data as IoTEnvironmentalSettings);
        setSettingsForm(response.data as IoTEnvironmentalSettings);
      }
    } catch (error) {
      logger.error('Failed to load environmental settings', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'loadSettings' });
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleAddSensor = useCallback(async () => {
    if (!canManageSensors) {
      showError('You do not have permission to add sensors');
      return;
    }
    if (!sensorForm.sensor_id || !sensorForm.location) {
      showError('Please fill in all required fields');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Adding sensor...');
      const payload = {
        sensor_id: sensorForm.sensor_id,
        sensor_type: sensorForm.sensor_type,
        location: sensorForm.location,
        threshold_min: sensorForm.threshold_min ? Number(sensorForm.threshold_min) : undefined,
        threshold_max: sensorForm.threshold_max ? Number(sensorForm.threshold_max) : undefined,
      };
      const response = await apiService.createEnvironmentalSensor(payload);
      if (!response.data) {
        throw new Error(response.error || 'Failed to add sensor');
      }

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor added successfully');
      }

      setShowAddModal(false);
      setSensorForm(emptySensorForm);
      loadData();
    } catch (error) {
      logger.error('Failed to add sensor', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleAddSensor' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to add sensor');
      }
    }
  }, [canManageSensors, loadData, sensorForm]);

  const handleEditSensor = useCallback(async () => {
    if (!canManageSensors) {
      showError('You do not have permission to update sensors');
      return;
    }
    if (!editingSensor) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Updating sensor...');
      const payload = {
        sensor_id: sensorForm.sensor_id,
        sensor_type: sensorForm.sensor_type,
        location: sensorForm.location,
        threshold_min: sensorForm.threshold_min ? Number(sensorForm.threshold_min) : undefined,
        threshold_max: sensorForm.threshold_max ? Number(sensorForm.threshold_max) : undefined,
      };
      const response = await apiService.updateEnvironmentalSensor(sensorForm.sensor_id, payload);
      if (!response.data) {
        throw new Error(response.error || 'Failed to update sensor');
      }

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor updated successfully');
      }

      setShowEditModal(false);
      setEditingSensor(null);
      loadData();
    } catch (error) {
      logger.error('Failed to update sensor', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleUpdateSensor' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update sensor');
      }
    }
  }, [canManageSensors, editingSensor, loadData]);

  const handleDeleteSensor = useCallback(async (sensorId: string) => {
    if (!canManageSensors) {
      showError('You do not have permission to delete sensors');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to delete this sensor?');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting sensor...');
      const response = await apiService.deleteEnvironmentalSensor(sensorId);
      if (response.error) {
        throw new Error(response.error);
      }

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor deleted successfully');
      }

      loadData();
    } catch (error) {
      logger.error('Failed to delete sensor', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleDeleteSensor' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete sensor');
      }
    }
  }, [canManageSensors, loadData]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Acknowledging alert...');
      const response = await apiService.updateEnvironmentalAlert(alertId, { status: 'acknowledged', resolved: false });
      if (!response.data) {
        throw new Error(response.error || 'Failed to acknowledge alert');
      }

      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Alert acknowledged');
      }
    } catch (error) {
      logger.error('Failed to acknowledge alert', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleAcknowledgeAlert' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to acknowledge alert');
      }
    }
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving alert...');
      const response = await apiService.updateEnvironmentalAlert(alertId, { status: 'resolved', resolved: true });
      if (!response.data) {
        throw new Error(response.error || 'Failed to resolve alert');
      }

      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'resolved' as const, resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Alert resolved');
      }
    } catch (error) {
      logger.error('Failed to resolve alert', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleResolveAlert' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve alert');
      }
    }
  }, []);

  const handleExportData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Exporting data...');
      const response = await apiService.getEnvironmentalAnalytics();
      if (response.error) {
        throw new Error(response.error);
      }

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data exported successfully');
      }
    } catch (error) {
      logger.error('Failed to export data', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleExportData' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to export data');
      }
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (!canUpdateSettings) {
      showError('You do not have permission to update settings');
      return;
    }
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      const response = await apiService.updateEnvironmentalSettings(settingsForm);
      if (!response.data) {
        throw new Error(response.error || 'Failed to save settings');
      }
      setSettings(response.data as IoTEnvironmentalSettings);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
      }

    } catch (error) {
      logger.error('Failed to save settings', error instanceof Error ? error : new Error(String(error)), { module: 'IoTEnvironmental', action: 'handleSaveSettings' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [canUpdateSettings, settingsForm]);

  const handleResetSettings = useCallback(() => {
    setSettingsForm(defaultSettings);
    showSuccess('Settings reset to defaults');
  }, []);

  const openEditModal = useCallback((sensor: EnvironmentalData) => {
    setEditingSensor(sensor);
    setSensorForm({
      sensor_id: sensor.sensor_id,
      sensor_type: sensor.sensor_type,
      location: sensor.location,
      threshold_min: sensor.threshold_min?.toString() || '',
      threshold_max: sensor.threshold_max?.toString() || '',
    });
    setShowEditModal(true);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      normal: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  }, []);

  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'normal': return 'text-green-800 bg-green-100';
      case 'warning': return 'text-yellow-800 bg-yellow-100';
      case 'critical': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  }, []);

  const getAlertSeverityBadgeClass = useCallback((severity: string): string => {
    switch (severity) {
      case 'low': return 'text-blue-800 bg-blue-100';
      case 'medium': return 'text-yellow-800 bg-yellow-100';
      case 'high': return 'text-orange-800 bg-orange-100';
      case 'critical': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    return createElement(
      'span',
      { className: `px-2.5 py-1 text-xs font-semibold rounded capitalize ${getStatusBadgeClass(status)}` },
      status
    );
  }, [getStatusBadgeClass]);

  const getAlertSeverityBadge = useCallback((severity: string) => {
    return createElement(
      'span',
      { className: `px-2.5 py-1 text-xs font-semibold rounded capitalize ${getAlertSeverityBadgeClass(severity)}` },
      severity
    );
  }, [getAlertSeverityBadgeClass]);

  const filteredData = useMemo(() => {
    let filtered = selectedSensor
      ? environmentalData.filter(item => item.sensor_id === selectedSensor)
      : environmentalData;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'id') {
        return a.sensor_id.localeCompare(b.sensor_id);
      }
      if (sortBy === 'value') {
        return (Number(b.value) || 0) - (Number(a.value) || 0);
      }
      if (sortBy === 'status') {
        const priority = { critical: 0, warning: 1, normal: 2 };
        return (priority[a.status as keyof typeof priority] ?? 3) - (priority[b.status as keyof typeof priority] ?? 3);
      }
      return 0;
    });
  }, [environmentalData, selectedSensor, statusFilter, sortBy]);

  const uniqueSensors = useMemo(() =>
    Array.from(new Set(environmentalData.map(item => item.sensor_id))),
    [environmentalData]
  );

  const activeAlerts = useMemo(() =>
    alerts.filter(alert => !alert.resolved),
    [alerts]
  );

  const criticalAlerts = useMemo(() =>
    activeAlerts.filter(alert => alert.severity === 'critical'),
    [activeAlerts]
  );

  return {
    activeTab,
    setActiveTab,
    environmentalData,
    alerts,
    loading,
    canManageSensors,
    canUpdateSettings,
    selectedSensor,
    setSelectedSensor,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    editingSensor,
    setEditingSensor,
    viewingSensor,
    setViewingSensor,
    sensorForm,
    setSensorForm,
    settings,
    settingsForm,
    setSettingsForm,
    loadData,
    handleAddSensor,
    handleEditSensor,
    handleDeleteSensor,
    handleAcknowledgeAlert,
    handleResolveAlert,
    handleExportData,
    handleSaveSettings,
    handleResetSettings,
    openEditModal,
    getStatusColor,
    getStatusBadgeClass,
    getAlertSeverityBadgeClass,
    getStatusBadge,
    getAlertSeverityBadge,
    filteredData,
    uniqueSensors,
    activeAlerts,
    criticalAlerts,
    analytics,
  };
}
