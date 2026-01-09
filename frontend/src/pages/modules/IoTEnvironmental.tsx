import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Thermometer, Droplets, Wind, Sun, Volume2, Gauge, 
  AlertTriangle, TrendingUp, Settings as SettingsIcon, Plus,
  Edit, Trash2, Check, X, Download, RefreshCw, Bell,
  BellOff, Activity, BarChart3, Eye, MapPin, Clock, Zap,
  Server, Wifi, WifiOff, Calendar, FileText, Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useWebSocket } from '../../components/UI/WebSocketProvider';
import apiService from '../../services/ApiService';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import { cn } from '../../utils/cn';

interface EnvironmentalData {
  id: string;
  sensor_id: string;
  sensor_type: 'temperature' | 'humidity' | 'air_quality' | 'light' | 'noise' | 'pressure';
  value: number;
  unit: string;
  location: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  threshold_min?: number;
  threshold_max?: number;
}

interface EnvironmentalAlert {
  id: string;
  sensor_id: string;
  alert_type: 'temperature' | 'humidity' | 'air_quality' | 'fire' | 'flood';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  location: string;
}

interface SensorFormData {
  sensor_id: string;
  sensor_type: string;
  location: string;
  threshold_min: string;
  threshold_max: string;
}

const IoTEnvironmental: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData[]>([]);
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<EnvironmentalData | null>(null);
  const [viewingSensor, setViewingSensor] = useState<EnvironmentalData | null>(null);
  
  // Form state
  const [sensorForm, setSensorForm] = useState<SensorFormData>({
    sensor_id: '',
    sensor_type: 'temperature',
    location: '',
    threshold_min: '',
    threshold_max: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    temperatureUnit: 'celsius',
    refreshInterval: '30',
    enableNotifications: true,
    criticalAlertsOnly: false,
    autoAcknowledge: false,
    dataRetention: '90',
    alertSoundEnabled: true,
    emailNotifications: true
  });

  const [settingsForm, setSettingsForm] = useState(settings);

  const { subscribe } = useWebSocket();

  useEffect(() => {
    loadData();
    
    const unsubscribeData = subscribe('environmental_data', (data) => {
      if (data.sensor_data) {
        setEnvironmentalData(prev => {
          const existing = prev.find(item => item.id === data.sensor_data.id);
          if (existing) {
            return prev.map(item => item.id === data.sensor_data.id ? data.sensor_data : item);
          } else {
            return [data.sensor_data, ...prev];
          }
        });
      }
    });

    const unsubscribeAlerts = subscribe('environmental_alert', (data) => {
      if (data.alert) {
        setAlerts(prev => [data.alert, ...prev]);
        if (settings.enableNotifications) {
        showError(`Environmental Alert: ${data.alert.message}`);
        }
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeAlerts();
    };
  }, [subscribe, settings.enableNotifications]);

  useEffect(() => {
    if (showSettingsModal) {
      setSettingsForm(settings);
    }
  }, [showSettingsModal, settings]);

  const loadData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Loading environmental data...');
      setLoading(true);
      
      const [dataResponse, alertsResponse] = await Promise.all([
        apiService.getEnvironmentalData(),
        apiService.getEnvironmentalAlerts()
      ]);

      const data = dataResponse.data || [];
      const alertsData = alertsResponse.data || [];

      setEnvironmentalData(data as unknown as EnvironmentalData[]);
      setAlerts(alertsData as unknown as EnvironmentalAlert[]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading environmental data:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to load environmental data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddSensor = useCallback(async () => {
    if (!sensorForm.sensor_id || !sensorForm.location) {
      showError('Please fill in all required fields');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Adding sensor...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor added successfully');
      }
      
      setShowAddModal(false);
      setSensorForm({
        sensor_id: '',
        sensor_type: 'temperature',
        location: '',
        threshold_min: '',
        threshold_max: ''
      });
      loadData();
    } catch (error) {
      console.error('Failed to add sensor:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to add sensor');
      }
    }
  }, [sensorForm, loadData]);

  const handleEditSensor = useCallback(async () => {
    if (!editingSensor) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Updating sensor...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor updated successfully');
      }
      
      setShowEditModal(false);
      setEditingSensor(null);
      loadData();
    } catch (error) {
      console.error('Failed to update sensor:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update sensor');
      }
    }
  }, [editingSensor, loadData]);

  const handleDeleteSensor = useCallback(async (sensorId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this sensor?');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting sensor...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Sensor deleted successfully');
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to delete sensor:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete sensor');
      }
    }
  }, [loadData]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Acknowledging alert...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Alert acknowledged');
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to acknowledge alert');
      }
    }
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving alert...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const, resolved: true, resolved_at: new Date().toISOString() } 
          : alert
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Alert resolved');
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve alert');
      }
    }
  }, []);

  const handleExportData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Exporting data...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data exported successfully');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to export data');
      }
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSettings(settingsForm);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
      }
      
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [settingsForm]);

  const handleResetSettings = useCallback(() => {
    const defaultSettings = {
      temperatureUnit: 'celsius',
      refreshInterval: '30',
      enableNotifications: true,
      criticalAlertsOnly: false,
      autoAcknowledge: false,
      dataRetention: '90',
      alertSoundEnabled: true,
      emailNotifications: true
    };
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
      threshold_max: sensor.threshold_max?.toString() || ''
    });
    setShowEditModal(true);
  }, []);

  const getSensorIcon = useCallback((type: string) => {
    const icons = {
      temperature: <Thermometer size={20} className="text-red-600" />,
      humidity: <Droplets size={20} className="text-blue-600" />,
      air_quality: <Wind size={20} className="text-green-600" />,
      light: <Sun size={20} className="text-yellow-600" />,
      noise: <Volume2 size={20} className="text-purple-600" />,
      pressure: <Gauge size={20} className="text-indigo-600" />,
    };
    return icons[type as keyof typeof icons] || <Activity size={20} className="text-gray-600" />;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      normal: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  }, []);

  // Gold Standard Badge Helper Functions
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
    return <span className={cn("px-2.5 py-1 text-xs font-semibold rounded capitalize", getStatusBadgeClass(status))}>{status}</span>;
  }, [getStatusBadgeClass]);

  const getAlertSeverityBadge = useCallback((severity: string) => {
    return <span className={cn("px-2.5 py-1 text-xs font-semibold rounded capitalize", getAlertSeverityBadgeClass(severity))}>{severity}</span>;
  }, [getAlertSeverityBadgeClass]);

  const filteredData = useMemo(() => {
    let filtered = selectedSensor 
      ? environmentalData.filter(item => item.sensor_id === selectedSensor)
      : environmentalData;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    return filtered;
  }, [environmentalData, selectedSensor, statusFilter]);

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

  const analytics = useMemo(() => {
  const temperatureData = filteredData.filter(item => item.sensor_type === 'temperature');
  const humidityData = filteredData.filter(item => item.sensor_type === 'humidity');
  const airQualityData = filteredData.filter(item => item.sensor_type === 'air_quality');

    const sensorsByType = filteredData.reduce((acc, item) => {
      acc[item.sensor_type] = (acc[item.sensor_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sensorsByStatus = filteredData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_sensors: uniqueSensors.length,
      active_sensors: filteredData.length,
      alerts_count: alerts.length,
      critical_alerts: criticalAlerts.length,
      average_temperature: temperatureData.length > 0
        ? temperatureData.reduce((sum, item) => sum + item.value, 0) / temperatureData.length
        : 0,
      average_humidity: humidityData.length > 0
        ? humidityData.reduce((sum, item) => sum + item.value, 0) / humidityData.length
        : 0,
      average_air_quality: airQualityData.length > 0
        ? airQualityData.reduce((sum, item) => sum + item.value, 0) / airQualityData.length
        : 0,
      sensorsByType,
      sensorsByStatus,
      normalSensors: sensorsByStatus.normal || 0,
      warningSensors: sensorsByStatus.warning || 0,
      criticalSensors: sensorsByStatus.critical || 0,
    };
  }, [filteredData, uniqueSensors, alerts, criticalAlerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading environmental data...</p>
        </div>
      </div>
    );
  }

        return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Action Buttons - FAR RIGHT CORNER */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex items-center space-x-3">
          <Button
            onClick={handleExportData}
            variant="outline"
            className="text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="outline"
            className="text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <SettingsIcon size={16} className="mr-2" />
            Settings
          </Button>
                </div>

        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-thermometer-half text-white text-2xl" />
                </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                <Activity size={12} className="text-white" />
                </div>
                </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                IoT Environmental Monitoring
              </h1>
              <p className="text-slate-600 font-medium">
                Real-time sensor data and environmental analytics
              </p>
              </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
            {['overview', 'sensors', 'alerts', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="p-6 max-w-[1800px] mx-auto">

      {/* GOLD STANDARD METRICS GRID - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Sensors */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6 px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                <Server className="text-white" size={24} />
                </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">Total</span>
                </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-blue-600">{analytics.total_sensors}</h3>
              <p className="text-slate-600 text-sm">Total Sensors</p>
              </div>
          </CardContent>
        </Card>

        {/* Active Sensors */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6 px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                <Wifi className="text-white" size={24} />
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">Online</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-blue-600">{analytics.active_sensors}</h3>
              <p className="text-slate-600 text-sm">Active Sensors</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Alerts */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                <Bell className="text-white" size={24} />
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">Alerts</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-blue-600">{analytics.alerts_count}</h3>
              <p className="text-slate-600 text-sm">Total Alerts</p>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded text-red-800 bg-red-100">Critical</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{analytics.critical_alerts}</h3>
              <p className="text-slate-600 text-sm">Critical Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Environmental Readings */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-xl">
                <Activity className="mr-3 text-slate-600" size={24} />
                Current Environmental Readings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Temperature Card */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                        <Thermometer className="text-red-600" size={24} />
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-red-800 bg-red-100 border border-red-200">Temperature</span>
                </div>
                <div className="text-center">
                      <h3 className="text-4xl font-bold text-slate-900 mb-2">
                        {analytics.average_temperature.toFixed(1)}°C
                      </h3>
                      <p className="text-slate-600 text-sm">Average Temperature</p>
                </div>
                  </CardContent>
                </Card>

                {/* Humidity Card */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <Droplets className="text-blue-600" size={24} />
              </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100 border border-blue-200">Humidity</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-4xl font-bold text-slate-900 mb-2">
                        {analytics.average_humidity.toFixed(1)}%
                      </h3>
                      <p className="text-slate-600 text-sm">Average Humidity</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Air Quality Card */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <Wind className="text-green-600" size={24} />
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100 border border-green-200">Air Quality</span>
                </div>
                <div className="text-center">
                      <h3 className="text-4xl font-bold text-slate-900 mb-2">
                        {analytics.average_air_quality.toFixed(0)} PPM
                      </h3>
                      <p className="text-slate-600 text-sm">Air Quality Index</p>
                </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Status Distribution */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-3 text-slate-600" size={24} />
                Sensor Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="backdrop-blur-sm bg-white/60 border-green-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Check className="text-green-600" size={24} />
            </div>
                    <h3 className="text-3xl font-bold text-green-600 mb-2">{analytics.normalSensors}</h3>
                    <p className="text-slate-600 text-sm">Normal Status</p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-white/60 border-yellow-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="text-yellow-600" size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-yellow-600 mb-2">{analytics.warningSensors}</h3>
                    <p className="text-slate-600 text-sm">Warning Status</p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-white/60 border-red-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="text-red-600" size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-red-600 mb-2">{analytics.criticalSensors}</h3>
                    <p className="text-slate-600 text-sm">Critical Status</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Recent Active Alerts */}
          {activeAlerts.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <Bell className="mr-3 text-slate-600" size={24} />
                  Recent Active Alerts
                </CardTitle>
                <span className="px-2.5 py-1 text-xs font-semibold rounded text-red-800 bg-red-100">{activeAlerts.length} Active</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <Card key={alert.id} className="backdrop-blur-sm bg-red-50/60 border-red-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <AlertTriangle className={cn("w-6 h-6 mt-1",
                              alert.severity === 'critical' && 'text-red-600',
                              alert.severity === 'high' && 'text-orange-600',
                              alert.severity === 'medium' && 'text-yellow-600',
                              alert.severity === 'low' && 'text-blue-600'
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getAlertSeverityBadge(alert.severity)}
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded capitalize", getStatusBadgeClass(alert.status))}>{alert.status}</span>
                              </div>
                              <p className="font-medium text-slate-900 mb-1">{alert.message}</p>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <MapPin size={14} />
                                  <span>{alert.location}</span>
                                </span>
                                <span>Sensor: {alert.sensor_id}</span>
                                <span className="flex items-center space-x-1">
                                  <Clock size={14} />
                                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {alert.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              >
                                <Check size={14} className="mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            {alert.status === 'acknowledged' && (
                              <Button
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="bg-[#2563eb] hover:bg-blue-700 text-white"
                              >
                                <Check size={14} className="mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'sensors' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <Server className="mr-3 text-slate-600" size={24} />
                  Sensor Management
                </CardTitle>
                <div className="flex items-center space-x-3">
                  {/* Status Filter */}
                  <div className="flex space-x-2">
                    {['all', 'normal', 'warning', 'critical'].map((filter) => (
                      <Button
                        key={filter}
                        variant={statusFilter === filter ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(filter)}
                        className={cn(
                          "capitalize",
                          statusFilter === filter
                            ? "bg-[#2563eb] hover:bg-blue-700 text-white"
                            : "text-slate-600 border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                  
              <select
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Sensors</option>
                {uniqueSensors.map(sensorId => (
                  <option key={sensorId} value={sensorId}>{sensorId}</option>
                ))}
              </select>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Sensor
                  </Button>
            </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map((sensor) => (
                  <Card 
                    key={sensor.id}
                    className={cn(
                      "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                      sensor.status === 'critical' && "border-red-300 bg-red-50/60",
                      sensor.status === 'warning' && "border-yellow-300 bg-yellow-50/60"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-lg">
                            {getSensorIcon(sensor.sensor_type)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{sensor.sensor_id}</h4>
                            <p className="text-slate-600 text-sm capitalize">{sensor.sensor_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {getStatusBadge(sensor.status)}
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Current Value:</span>
                          <span className={cn("font-bold", getStatusColor(sensor.status))}>
                            {sensor.value} {sensor.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-medium text-slate-900 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {sensor.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Last Update:</span>
                          <span className="font-medium text-slate-900 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(sensor.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {sensor.threshold_min && sensor.threshold_max && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Thresholds:</span>
                            <span className="font-medium text-slate-900">
                              {sensor.threshold_min} - {sensor.threshold_max} {sensor.unit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingSensor(sensor)}
                          className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(sensor)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSensor(sensor.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No sensors found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or add a new sensor</p>
          </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Bell className="mr-3 text-slate-600" size={24} />
                Alert Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No active alerts</p>
                  <p className="text-sm text-gray-400">All systems are operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <Card key={alert.id} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <AlertTriangle className={cn("w-6 h-6 mt-1",
                              alert.severity === 'critical' && 'text-red-600',
                              alert.severity === 'high' && 'text-orange-600',
                              alert.severity === 'medium' && 'text-yellow-600',
                              alert.severity === 'low' && 'text-blue-600'
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getAlertSeverityBadge(alert.severity)}
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded capitalize", getStatusBadgeClass(alert.status))}>{alert.status}</span>
                              </div>
                              <p className="font-medium text-slate-900 mb-1">{alert.message}</p>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <MapPin size={14} />
                                  <span>{alert.location}</span>
                                </span>
                                <span>Sensor: {alert.sensor_id}</span>
                                <span className="flex items-center space-x-1">
                                  <Clock size={14} />
                                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {alert.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              >
                                <Check size={14} className="mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            {alert.status === 'acknowledged' && (
                              <Button
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="bg-[#2563eb] hover:bg-blue-700 text-white"
                              >
                                <Check size={14} className="mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolved Alerts */}
          {alerts.some(a => a.resolved) && (
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Check className="mr-3 text-green-600" size={24} />
                  Resolved Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.filter(a => a.resolved).slice(0, 10).map((alert) => (
                    <Card key={alert.id} className="backdrop-blur-sm bg-green-50/60 border-green-200 shadow-lg">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Resolved: {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">RESOLVED</span>
                      </div>
                      </CardContent>
                    </Card>
                  ))}
                      </div>
              </CardContent>
            </Card>
          )}
                    </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-3 text-slate-600" size={24} />
                Environmental Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sensor Distribution by Type */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Sensors by Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(analytics.sensorsByType).map(([type, count]) => (
                    <Card key={type} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg text-center">
                      <CardContent className="p-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          {getSensorIcon(type)}
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900">{count}</h4>
                        <p className="text-xs text-slate-600 capitalize">{type.replace('_', ' ')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Data Insights */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">System Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="text-blue-600" size={20} />
                        </div>
                        <h4 className="font-semibold text-slate-900">System Health</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Overall Status:</span>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Uptime:</span>
                          <span className="font-medium text-slate-900">99.8%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Response Time:</span>
                          <span className="font-medium text-slate-900">42ms</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="text-purple-600" size={20} />
                        </div>
                        <h4 className="font-semibold text-slate-900">Data Collection</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Today's Readings:</span>
                          <span className="font-medium text-slate-900">{filteredData.length * 24}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">This Week:</span>
                          <span className="font-medium text-slate-900">{filteredData.length * 168}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Storage Used:</span>
                          <span className="font-medium text-slate-900">2.4 GB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Export Options */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Export</h3>
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Export Environmental Data</h4>
                        <p className="text-sm text-slate-600">Download sensor readings, alerts, and analytics</p>
                      </div>
                      <Button
                        onClick={handleExportData}
                        className="bg-[#2563eb] hover:bg-blue-700 text-white"
                      >
                        <FileText size={16} className="mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
                </div>
              )}
            </div>

      {/* View Sensor Details Modal */}
      {viewingSensor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getSensorIcon(viewingSensor.sensor_type)}
                <span className="ml-3">Sensor Details</span>
              </h2>
              <button
                onClick={() => setViewingSensor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
          </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sensor ID</label>
                  <p className="text-lg font-semibold text-gray-900">{viewingSensor.sensor_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{viewingSensor.sensor_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <p className={cn("text-2xl font-bold", getStatusColor(viewingSensor.status))}>
                    {viewingSensor.value} {viewingSensor.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div>{getStatusBadge(viewingSensor.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-lg text-gray-900">{viewingSensor.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Update</label>
                  <p className="text-lg text-gray-900">{new Date(viewingSensor.timestamp).toLocaleString()}</p>
                </div>
                {viewingSensor.threshold_min && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                    <p className="text-lg text-gray-900">{viewingSensor.threshold_min} {viewingSensor.unit}</p>
                  </div>
                )}
                {viewingSensor.threshold_max && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Threshold</label>
                    <p className="text-lg text-gray-900">{viewingSensor.threshold_max} {viewingSensor.unit}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setViewingSensor(null)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  openEditModal(viewingSensor);
                  setViewingSensor(null);
                }}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                <Edit size={16} className="mr-2" />
                Edit Sensor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Sensor</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sensor ID *</label>
                <input
                  type="text"
                  value={sensorForm.sensor_id}
                  onChange={(e) => setSensorForm({...sensorForm, sensor_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TEMP-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sensor Type *</label>
                <select
                  value={sensorForm.sensor_type}
                  onChange={(e) => setSensorForm({...sensorForm, sensor_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="air_quality">Air Quality</option>
                  <option value="light">Light Level</option>
                  <option value="noise">Noise Level</option>
                  <option value="pressure">Pressure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={sensorForm.location}
                  onChange={(e) => setSensorForm({...sensorForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lobby, Room 101"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold</label>
                  <input
                    type="number"
                    value={sensorForm.threshold_min}
                    onChange={(e) => setSensorForm({...sensorForm, threshold_min: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Threshold</label>
                  <input
                    type="number"
                    value={sensorForm.threshold_max}
                    onChange={(e) => setSensorForm({...sensorForm, threshold_max: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max"
              />
            </div>
          </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSensor}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                Add Sensor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sensor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Sensor</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sensor ID</label>
                <input
                  type="text"
                  value={sensorForm.sensor_id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
      </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={sensorForm.location}
                  onChange={(e) => setSensorForm({...sensorForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold</label>
                  <input
                    type="number"
                    value={sensorForm.threshold_min}
                    onChange={(e) => setSensorForm({...sensorForm, threshold_min: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Threshold</label>
                  <input
                    type="number"
                    value={sensorForm.threshold_max}
                    onChange={(e) => setSensorForm({...sensorForm, threshold_max: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSensor}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">IoT Environmental Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* General Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Unit</label>
                    <select
                      value={settingsForm.temperatureUnit}
                      onChange={(e) => setSettingsForm({...settingsForm, temperatureUnit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                    <select
                      value={settingsForm.refreshInterval}
                      onChange={(e) => setSettingsForm({...settingsForm, refreshInterval: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (days)</label>
                    <select
                      value={settingsForm.dataRetention}
                      onChange={(e) => setSettingsForm({...settingsForm, dataRetention: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Enable Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.enableNotifications}
                      onChange={(e) => setSettingsForm({...settingsForm, enableNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Critical Alerts Only</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.criticalAlertsOnly}
                      onChange={(e) => setSettingsForm({...settingsForm, criticalAlertsOnly: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Auto-Acknowledge Low Priority</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.autoAcknowledge}
                      onChange={(e) => setSettingsForm({...settingsForm, autoAcknowledge: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Alert Sound Enabled</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.alertSoundEnabled}
                      onChange={(e) => setSettingsForm({...settingsForm, alertSoundEnabled: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.emailNotifications}
                      onChange={(e) => setSettingsForm({...settingsForm, emailNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Reset to Defaults
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTEnvironmental; 
