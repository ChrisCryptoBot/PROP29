import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { DeviceHealthStatus } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface HardwareDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    deviceId?: string;
    selectedDevice?: DeviceHealthStatus;
}

export const HardwareDeviceModal: React.FC<HardwareDeviceModalProps> = ({
    isOpen,
    onClose,
    deviceId,
    selectedDevice
}) => {
    const { 
        incidents,
        hardwareDevices, 
        loading,
        refreshHardwareDevices,
        getHardwareDeviceStatus 
    } = useIncidentLogContext();

    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'incidents' | 'maintenance'>('overview');
    const [deviceStatus, setDeviceStatus] = useState<DeviceHealthStatus | null>(null);
    const [healthHistory, setHealthHistory] = useState<Array<{ date: string; health_score: number; issues: number }>>([]);

    // Determine which device to display
    const displayDevice = selectedDevice || 
        (deviceId ? hardwareDevices.find(d => d.device_id === deviceId) : null) ||
        deviceStatus;

    // Get device-related incidents
    const deviceIncidents = useMemo(() => {
        if (!displayDevice) return [];
        return incidents.filter(incident => 
            incident.source_device_id === displayDevice.device_id ||
            (incident.source === 'device' && incident.source_metadata?.device_id === displayDevice.device_id)
        );
    }, [incidents, displayDevice]);

    // Load device status and history
    useEffect(() => {
        const loadDeviceData = async () => {
            if (deviceId && !selectedDevice) {
                const status = await getHardwareDeviceStatus(deviceId);
                setDeviceStatus(status);
            }

            // Generate mock health history (in production, this would come from API)
            if (displayDevice) {
                const history = [];
                const currentDate = new Date();
                
                for (let i = 30; i >= 0; i--) {
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - i);
                    
                    const baseScore = displayDevice.health_score;
                    const variance = Math.random() * 20 - 10;
                    const score = Math.max(0, Math.min(100, baseScore + variance));
                    
                    history.push({
                        date: date.toISOString().split('T')[0],
                        health_score: Math.round(score),
                        issues: displayDevice.issues.filter(issue => 
                            issue.severity === 'error' || issue.severity === 'critical'
                        ).length
                    });
                }
                
                setHealthHistory(history);
            }
        };

        if (isOpen) {
            loadDeviceData();
        }
    }, [isOpen, deviceId, selectedDevice, displayDevice, getHardwareDeviceStatus]);

    if (!displayDevice) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Hardware Device" size="lg">
                <div className="p-8">
                    <div className="text-center">
                        <i className="fas fa-microchip text-4xl text-slate-400 mb-4" />
                        <h3 className="text-lg text-white mb-2">Device Not Found</h3>
                        <p className="text-slate-400">The requested hardware device could not be found.</p>
                    </div>
                </div>
            </Modal>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'text-green-300 bg-green-500/20 border-green-500/30';
            case 'offline': return 'text-red-300 bg-red-500/20 border-red-500/30';
            case 'degraded': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
            case 'maintenance': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
        }
    };

    const getDeviceTypeIcon = (type: string) => {
        switch (type) {
            case 'camera': return 'fa-video';
            case 'sensor': return 'fa-thermometer-half';
            case 'access_control': return 'fa-key';
            case 'alarm': return 'fa-bell';
            case 'environmental': return 'fa-leaf';
            default: return 'fa-microchip';
        }
    };

    const getIssueSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-300 bg-red-500/20 border-red-500/30';
            case 'error': return 'text-orange-300 bg-orange-500/20 border-orange-500/30';
            case 'warning': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
            case 'info': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Device: ${displayDevice.device_name}`}
            size="xl"
            footer={(
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-4">
                        <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border", getStatusColor(displayDevice.status))}>
                            <i className={cn("fas mr-1", 
                                displayDevice.status === 'online' ? 'fa-wifi' :
                                displayDevice.status === 'offline' ? 'fa-wifi-slash' :
                                displayDevice.status === 'degraded' ? 'fa-exclamation-triangle' :
                                'fa-tools'
                            )} />
                            {displayDevice.status}
                        </span>
                        <span className="text-sm text-slate-400">
                            Health: <span className={cn("font-bold", 
                                displayDevice.health_score >= 80 ? "text-green-400" :
                                displayDevice.health_score >= 60 ? "text-yellow-400" :
                                "text-red-400"
                            )}>{displayDevice.health_score}%</span>
                        </span>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="subtle" onClick={onClose}>
                            Close
                        </Button>
                        <Button 
                            variant="glass" 
                            onClick={() => refreshHardwareDevices()}
                            disabled={loading.hardwareDevices}
                        >
                            <i className={cn("fas fa-sync-alt mr-2", loading.hardwareDevices && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>
            )}
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 p-1 bg-white/5 rounded-lg border border-white/5">
                    {[
                        { key: 'overview', label: 'Overview', icon: 'fa-info-circle' },
                        { key: 'history', label: 'Health History', icon: 'fa-chart-line' },
                        { key: 'incidents', label: 'Incidents', icon: 'fa-exclamation-triangle' },
                        { key: 'maintenance', label: 'Maintenance', icon: 'fa-tools' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                                activeTab === tab.key
                                    ? "text-white bg-white/10 shadow-lg"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <i className={cn("fas mr-2", tab.icon)} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Device Information */}
                        <Card className="glass-card border border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center text-white">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                        <i className={cn("fas text-white", getDeviceTypeIcon(displayDevice.device_type))} />
                                    </div>
                                    Device Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Device ID:</span>
                                            <span className="text-white font-mono text-sm">{displayDevice.device_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Type:</span>
                                            <span className="text-white capitalize">{displayDevice.device_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Status:</span>
                                            <span className={cn("px-2 py-1 text-xs font-bold uppercase rounded", getStatusColor(displayDevice.status))}>
                                                {displayDevice.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Health Score:</span>
                                            <span className={cn("font-bold", 
                                                displayDevice.health_score >= 80 ? "text-green-400" :
                                                displayDevice.health_score >= 60 ? "text-yellow-400" :
                                                "text-red-400"
                                            )}>{displayDevice.health_score}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Last Heartbeat:</span>
                                            <span className="text-white">{new Date(displayDevice.last_heartbeat).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Incidents (24h):</span>
                                            <span className="text-white font-bold">{displayDevice.incident_count_24h}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Active Issues:</span>
                                            <span className="text-white font-bold">{displayDevice.issues.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Uptime:</span>
                                            <span className="text-green-400">99.2%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current Issues */}
                        {displayDevice.issues.length > 0 && (
                            <Card className="glass-card border border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">Current Issues ({displayDevice.issues.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {displayDevice.issues.map((issue, index) => (
                                            <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className={cn("px-2 py-1 text-xs font-bold uppercase rounded", getIssueSeverityColor(issue.severity))}>
                                                                {issue.severity}
                                                            </span>
                                                            <span className="text-xs text-slate-400 capitalize">
                                                                {issue.issue_type.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white">{issue.message}</p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Detected: {new Date(issue.detected_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                                                        <i className="fas fa-tools" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Health History Tab */}
                {activeTab === 'history' && (
                    <Card className="glass-card border border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white">Health Score History (30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {healthHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <i className="fas fa-chart-line text-4xl mb-4" />
                                    <p>No historical data available</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={healthHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                borderColor: 'rgba(255,255,255,0.1)', 
                                                color: '#f8fafc' 
                                            }}
                                        />
                                        <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="health_score" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: '#3b82f6' }} 
                                            activeDot={{ r: 6, fill: '#60a5fa' }}
                                            name="Health Score"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="issues" 
                                            stroke="#ef4444" 
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: '#ef4444' }} 
                                            activeDot={{ r: 6, fill: '#f87171' }}
                                            name="Issues Count"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Incidents Tab */}
                {activeTab === 'incidents' && (
                    <Card className="glass-card border border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white">Device Incidents ({deviceIncidents.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deviceIncidents.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <i className="fas fa-shield-check text-4xl mb-4" />
                                    <p>No incidents reported from this device</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {deviceIncidents.slice(-10).reverse().map((incident) => (
                                        <div key={incident.incident_id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h5 className="text-sm font-bold text-white">{incident.title}</h5>
                                                    <p className="text-xs text-slate-400 mt-1">{incident.description}</p>
                                                    <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                                                        <span><i className="fas fa-clock mr-1" />{new Date(incident.created_at).toLocaleString()}</span>
                                                        <span><i className="fas fa-map-marker-alt mr-1" />
                                                            {typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        incident.severity === 'critical' ? "text-red-300 bg-red-500/20" :
                                                        incident.severity === 'high' ? "text-orange-300 bg-orange-500/20" :
                                                        incident.severity === 'medium' ? "text-yellow-300 bg-yellow-500/20" :
                                                        "text-blue-300 bg-blue-500/20"
                                                    )}>
                                                        {incident.severity?.toUpperCase()}
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        incident.status === 'resolved' ? "text-green-300 bg-green-500/20" :
                                                        incident.status === 'open' ? "text-red-300 bg-red-500/20" :
                                                        "text-yellow-300 bg-yellow-500/20"
                                                    )}>
                                                        {incident.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Maintenance Tab */}
                {activeTab === 'maintenance' && (
                    <Card className="glass-card border border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white">Maintenance & Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <i className="fas fa-info-circle text-blue-400" />
                                        <p className="text-sm text-blue-200">
                                            Device maintenance and configuration features will be available in a future update.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white">Device Actions</h4>
                                        <div className="space-y-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-green-500/30 text-green-300 hover:bg-green-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-power-off mr-2" />
                                                Restart Device
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-cog mr-2" />
                                                Configure Settings
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-upload mr-2" />
                                                Update Firmware
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white">Maintenance</h4>
                                        <div className="space-y-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-calendar mr-2" />
                                                Schedule Maintenance
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-slate-500/30 text-slate-300 hover:bg-slate-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-download mr-2" />
                                                Download Logs
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-red-500/30 text-red-300 hover:bg-red-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-trash mr-2" />
                                                Remove Device
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Modal>
    );
};

export default HardwareDeviceModal;