import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import { ModuleService } from '../../services/ModuleService';

// Interfaces based on existing backend structure
interface SoundAlert {
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

interface SoundZone {
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

interface SoundMetrics {
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

interface AudioVisualization {
  waveform: number[];
  spectrum: { frequency: number; amplitude: number }[];
  realTimeLevel: number;
  isRecording: boolean;
  timestamp: string;
}

const SoundMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [soundAlerts, setSoundAlerts] = useState<SoundAlert[]>([]);
  const [soundZones, setSoundZones] = useState<SoundZone[]>([]);
  const [metrics, setMetrics] = useState<SoundMetrics>({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedToday: 0,
    averageDecibelLevel: 0,
    peakDecibelLevel: 0,
    systemUptime: 0,
    falsePositiveRate: 0,
    responseTime: 0,
    zonesMonitored: 0,
    sensorsActive: 0
  });
  const [audioVisualization, setAudioVisualization] = useState<AudioVisualization>({
    waveform: [],
    spectrum: [],
    realTimeLevel: 0,
    isRecording: false,
    timestamp: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SoundAlert | null>(null);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'alerts', label: 'Sound Alerts' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  useEffect(() => {
    // Data will be loaded from API
    setLoading(false);
  }, []);

  // Gold Standard Badge Helper Functions
  const getSeverityBadgeClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-orange-800 bg-orange-100';
      case 'medium': return 'text-yellow-800 bg-yellow-100';
      case 'low': return 'text-blue-800 bg-blue-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'text-red-800 bg-red-100';
      case 'investigating': return 'text-blue-800 bg-blue-100';
      case 'resolved': return 'text-green-800 bg-green-100';
      case 'false_positive': return 'text-slate-800 bg-slate-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getZoneTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'public': return 'text-blue-800 bg-blue-100';
      case 'guest': return 'text-green-800 bg-green-100';
      case 'recreation': return 'text-yellow-800 bg-yellow-100';
      case 'private': return 'text-red-800 bg-red-100';
      case 'dining': return 'text-purple-800 bg-purple-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const handleAcknowledgeAlert = useCallback(async (alertId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Acknowledging sound alert...');
      // Use existing ModuleService method
      const moduleService = ModuleService.getInstance();
      await moduleService.acknowledgeSoundAlert(alertId);
      
      setSoundAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'investigating' } : alert
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Sound alert acknowledged successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to acknowledge sound alert');
      }
    }
  }, []);

  const handleResolveAlert = useCallback(async (alertId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving sound alert...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSoundAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
      setMetrics(prev => ({ 
        ...prev, 
        activeAlerts: prev.activeAlerts - 1, 
        resolvedToday: prev.resolvedToday + 1 
      }));
      
      dismissLoadingAndShowSuccess(toastId, 'Sound alert resolved successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve sound alert');
      }
    }
  }, []);

  const handleViewAlert = (alert: SoundAlert) => {
    setSelectedAlert(alert);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading sound monitoring data...</div>
        </div>
      );
    }

    switch (currentTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-red-800 bg-red-100">
                      Active
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.activeAlerts}
                    </h3>
                    <p className="text-slate-600 font-medium">Active Alerts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-volume-up text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      {metrics.averageDecibelLevel}dB
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.averageDecibelLevel}
                    </h3>
                    <p className="text-slate-600 font-medium">Avg. Decibel Level</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-map-marker-alt text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Zones
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.zonesMonitored}
                    </h3>
                    <p className="text-slate-600 font-medium">Zones Monitored</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-microchip text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                      Sensors
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.sensorsActive}
                    </h3>
                    <p className="text-slate-600 font-medium">Active Sensors</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sound Alerts */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-bell text-white text-lg" />
                  </div>
                  Recent Sound Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {soundAlerts.slice(0, 3).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-volume-up text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{alert.type}</h3>
                          <p className="text-sm text-slate-600">{alert.location}</p>
                          <p className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getSeverityBadgeClass(alert.severity))}>
                          {alert.severity}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(alert.status))}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-bolt text-white text-lg" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                    onClick={() => setActiveTab('monitoring')}
                  >
                    <i className="fas fa-play mr-2" />
                    Start Monitoring
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('alerts')}
                  >
                    <i className="fas fa-list mr-2" />
                    View Alerts
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <i className="fas fa-chart-bar mr-2" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('settings')}
                  >
                    <i className="fas fa-cogs mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-6">
            {/* Live Audio Visualization */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-waveform-lines mr-3 text-slate-600" />
                  Live Audio Monitoring
                  {audioVisualization.isRecording && (
                    <div className="ml-3 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Real-time Decibel Level */}
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Current Sound Level</h3>
                    <div className="text-4xl font-bold text-slate-900 mb-2">
                      {audioVisualization.realTimeLevel} dB
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-slate-600 to-slate-700 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((audioVisualization.realTimeLevel / 120) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-4">Live Waveform</h4>
                    <div className="flex items-end space-x-1 h-20">
                      {audioVisualization.waveform.map((amplitude, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-t from-slate-600 to-slate-700 rounded-sm transition-all duration-100"
                          style={{ 
                            height: `${amplitude * 100}%`,
                            width: '8px'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Frequency Spectrum */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-4">Frequency Spectrum</h4>
                    <div className="flex items-end space-x-2 h-20">
                      {audioVisualization.spectrum.map((data, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-t from-slate-600 to-slate-700 rounded-sm transition-all duration-100"
                          style={{ 
                            height: `${data.amplitude * 100}%`,
                            width: '12px'
                          }}
                          title={`${data.frequency}Hz: ${(data.amplitude * 100).toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sound Zones Status */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-map text-white text-lg" />
                  </div>
                  Sound Zones Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {soundZones.map((zone) => (
                    <div key={zone.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{zone.name}</h3>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getZoneTypeBadgeClass(zone.type))}>
                          {zone.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Current Level:</span>
                          <p className="font-medium">{zone.currentDecibelLevel} dB</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Threshold:</span>
                          <p className="font-medium">{zone.threshold} dB</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Sensors:</span>
                          <p className="font-medium">{zone.sensorCount} active</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Sound Level</span>
                          <span className="text-slate-600">{zone.currentDecibelLevel} / {zone.threshold} dB</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              zone.currentDecibelLevel > zone.threshold 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : zone.currentDecibelLevel > zone.threshold * 0.8
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${Math.min((zone.currentDecibelLevel / zone.threshold) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-exclamation-triangle text-white text-lg" />
                  </div>
                  Sound Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {soundAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-volume-up text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{alert.type}</h3>
                          <p className="text-sm text-slate-600">{alert.location}</p>
                          <p className="text-xs text-slate-500">
                            {alert.assignedTo && `Assigned to: ${alert.assignedTo}`}
                            {alert.responseTime && ` | Response: ${alert.responseTime}s`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getSeverityBadgeClass(alert.severity))}>
                          {alert.severity}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(alert.status))}>
                          {alert.status}
                        </span>
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeAlert(alert.id);
                            }}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === 'investigating' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveAlert(alert.id);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-chart-bar text-white text-lg" />
                  </div>
                  Sound Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-clock text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Response Time</h3>
                    <p className="text-slate-600">{metrics.responseTime} minutes</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-shield-alt text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">System Uptime</h3>
                    <p className="text-slate-600">{metrics.systemUptime}%</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-bullseye text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">False Positive Rate</h3>
                    <p className="text-slate-600">{metrics.falsePositiveRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <i className="fas fa-cogs text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Sound Monitoring Settings</h3>
            <p className="text-slate-600">Configure sound monitoring system settings and audio thresholds.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-volume-up text-white text-2xl" />
              </div>
              {audioVisualization.isRecording && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-microphone text-white text-xs" />
                </div>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Sound Monitoring
              </h1>
              <p className="text-slate-600 font-medium">
                Advanced audio surveillance and noise level monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SoundMonitoring;