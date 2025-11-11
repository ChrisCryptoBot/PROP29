import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';

// Interfaces
interface EmergencyAlert {
  id: string;
  alertType: string;
  location: {
    building: string;
    floor: string;
    room?: string;
    coordinates?: { lat: number; lng: number };
  };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'active' | 'responding' | 'resolved' | 'escalated';
  assignedTo?: string;
  responseTime?: number;
  priority: 'immediate' | 'urgent' | 'normal';
  timestamp: string;
  emergencyServicesContacted: boolean;
  escalationLevel: number;
  affectedAreas: string[];
  estimatedCasualties?: number;
  evacuationRequired: boolean;
}

interface SecurityAlert {
  id: string;
  alertType: string;
  location: {
    building: string;
    floor: string;
    room?: string;
    coordinates?: { lat: number; lng: number };
  };
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
  assignedTo?: string;
  responseTime?: number;
  timestamp: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  suspectDescription?: string;
  weaponsInvolved: boolean;
  crowdSize?: number;
}

interface MedicalEmergency {
  id: string;
  emergencyType: 'cardiac' | 'injury' | 'medical' | 'trauma' | 'other';
  location: {
    building: string;
    floor: string;
    room?: string;
    coordinates?: { lat: number; lng: number };
  };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'active' | 'responding' | 'resolved' | 'transported';
  assignedTo?: string;
  responseTime?: number;
  timestamp: string;
  patientAge?: number;
  patientCondition: string;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  vitalSigns?: {
    pulse?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
  };
  ambulanceRequired: boolean;
  hospitalDestination?: string;
}

interface ResponseTeam {
  id: string;
  name: string;
  type: 'security' | 'medical' | 'fire' | 'evacuation' | 'technical';
  status: 'available' | 'deployed' | 'busy' | 'offline';
  location: string;
  members: number;
  equipment: string[];
  specializations: string[];
  contactInfo: {
    phone: string;
    radio: string;
    email: string;
  };
  currentAssignment?: string;
  estimatedArrival?: number;
}

interface EmergencyMetrics {
  activeAlerts: number;
  resolvedToday: number;
  averageResponseTime: number;
  emergencyServicesCalled: number;
  evacuationsInitiated: number;
  lockdownsActive: number;
  medicalEmergencies: number;
  securityIncidents: number;
  systemUptime: number;
  alertAccuracy: number;
}

// Mock data using existing backend schema structure
const mockEmergencyAlerts: EmergencyAlert[] = [
  { 
    id: '1',
    alertType: 'Fire Alarm',
    location: {
      building: 'Main Building',
      floor: '3',
      room: '312'
    },
    severity: 'CRITICAL', 
    description: 'Fire alarm triggered - smoke detected in room 312',
    status: 'responding',
    assignedTo: 'Emergency Response Team',
    responseTime: 45,
    priority: 'immediate',
    timestamp: '2024-01-15T10:30:00Z',
    emergencyServicesContacted: true,
    escalationLevel: 3,
    affectedAreas: ['East Wing', 'Floor 3'],
    estimatedCasualties: 0,
    evacuationRequired: true
  },
  {
    id: '2',
    alertType: 'Gas Leak',
    location: {
      building: 'Kitchen Building',
      floor: '1',
      room: 'Kitchen'
    },
    severity: 'HIGH', 
    description: 'Gas leak detected in main kitchen area',
    status: 'active',
    assignedTo: 'Fire Department',
    responseTime: 120,
    priority: 'urgent',
    timestamp: '2024-01-15T11:15:00Z',
    emergencyServicesContacted: true,
    escalationLevel: 2,
    affectedAreas: ['Kitchen Building', 'Dining Area'],
    estimatedCasualties: 0,
    evacuationRequired: true
  }
];

const mockSecurityAlerts: SecurityAlert[] = [
  { 
    id: '1',
    alertType: 'Suspicious Activity',
    location: {
      building: 'Parking Garage',
      floor: '2',
      room: 'Level 2'
    },
    severity: 'MEDIUM',
    description: 'Unusual loitering pattern detected by AI surveillance',
    status: 'investigating',
    assignedTo: 'John Smith',
    responseTime: 120,
    timestamp: '2024-01-15T10:30:00Z',
    threatLevel: 'medium',
    suspectDescription: 'Male, 30s, wearing dark clothing',
    weaponsInvolved: false,
    crowdSize: 1
  },
  {
    id: '2',
    alertType: 'Unauthorized Access',
    location: {
      building: 'Main Building',
      floor: '5',
      room: 'Executive Floor'
    },
    severity: 'HIGH',
    description: 'Unauthorized access attempt to restricted area',
    status: 'active',
    assignedTo: 'Security Team Alpha',
    responseTime: 60,
    timestamp: '2024-01-15T09:45:00Z',
    threatLevel: 'high',
    suspectDescription: 'Unknown individual with access card',
    weaponsInvolved: false,
    crowdSize: 1
  }
];

const mockMedicalEmergencies: MedicalEmergency[] = [
  {
    id: '1',
    emergencyType: 'cardiac',
    location: {
      building: 'Main Building',
      floor: '2',
      room: 'Conference Room A'
    },
    severity: 'CRITICAL',
    description: 'Guest experiencing chest pain and difficulty breathing',
    status: 'responding',
    assignedTo: 'Medical Team Bravo',
    responseTime: 90,
    timestamp: '2024-01-15T12:00:00Z',
    patientAge: 65,
    patientCondition: 'Chest pain, shortness of breath',
    medicalHistory: 'History of hypertension',
    allergies: ['Penicillin'],
    medications: ['Lisinopril', 'Metformin'],
    vitalSigns: {
      pulse: 110,
      bloodPressure: '150/95',
      temperature: 98.6,
      oxygenSaturation: 88
    },
    ambulanceRequired: true,
    hospitalDestination: 'City General Hospital'
  }
];

const mockResponseTeams: ResponseTeam[] = [
  {
    id: '1',
    name: 'Emergency Response Team Alpha',
    type: 'security',
    status: 'deployed',
    location: 'Main Building - Floor 3',
    members: 4,
    equipment: ['Radio', 'Flashlight', 'First Aid Kit', 'Fire Extinguisher'],
    specializations: ['Fire Response', 'Evacuation', 'First Aid'],
    contactInfo: {
      phone: '+1-555-0101',
      radio: 'Channel 1',
      email: 'alpha@security.com'
    },
    currentAssignment: 'Fire Alarm - Room 312',
    estimatedArrival: 2
  },
  {
    id: '2',
    name: 'Medical Team Bravo',
    type: 'medical',
    status: 'deployed',
    location: 'Main Building - Floor 2',
    members: 3,
    equipment: ['AED', 'Oxygen Tank', 'Stretcher', 'Medical Kit'],
    specializations: ['Cardiac Care', 'Trauma Response', 'Emergency Medicine'],
    contactInfo: {
      phone: '+1-555-0102',
      radio: 'Channel 2',
      email: 'bravo@medical.com'
    },
    currentAssignment: 'Cardiac Emergency - Conference Room A',
    estimatedArrival: 1
  },
  {
    id: '3',
    name: 'Fire Department Unit 1',
    type: 'fire',
    status: 'available',
    location: 'Fire Station 1',
    members: 6,
    equipment: ['Fire Truck', 'Hose', 'Ladder', 'Rescue Equipment'],
    specializations: ['Fire Suppression', 'Rescue Operations', 'Hazardous Materials'],
    contactInfo: {
      phone: '+1-555-911',
      radio: 'Emergency Channel',
      email: 'fire@city.gov'
    }
  }
];

const mockMetrics: EmergencyMetrics = {
  activeAlerts: 3,
  resolvedToday: 7,
  averageResponseTime: 2.5,
  emergencyServicesCalled: 2,
  evacuationsInitiated: 1,
  lockdownsActive: 0,
  medicalEmergencies: 1,
  securityIncidents: 2,
  systemUptime: 99.8,
  alertAccuracy: 94.5
};

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'alerts', label: 'Active Alerts' },
  { id: 'response', label: 'Response Management' },
  { id: 'settings', label: 'Settings' }
];

const EmergencyAlerts: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertFilter, setAlertFilter] = useState<'all' | 'emergency' | 'medical' | 'security'>('all');
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [medicalEmergencies, setMedicalEmergencies] = useState<MedicalEmergency[]>([]);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const [metrics, setMetrics] = useState<EmergencyMetrics>(mockMetrics);
  const [loading, setLoading] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAlerts(mockEmergencyAlerts);
      setSecurityAlerts(mockSecurityAlerts);
      setMedicalEmergencies(mockMedicalEmergencies);
      setResponseTeams(mockResponseTeams);
      setLoading(false);
    }, 500);
  }, []);

  // Helper functions
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'responding': return 'default';
      case 'resolved': return 'secondary';
      case 'escalated': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTeamStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'deployed': return 'destructive';
      case 'busy': return 'secondary';
      case 'offline': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCreateAlert = useCallback(async (alertData: any) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Creating emergency alert...');
      // Simulate API call using existing backend endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newAlert: EmergencyAlert = {
        id: String(alerts.length + 1),
        ...alertData,
        timestamp: new Date().toISOString(),
        status: 'active',
        responseTime: 0,
        escalationLevel: 1,
        affectedAreas: [],
        estimatedCasualties: 0,
        evacuationRequired: false
      };
      setAlerts(prev => [newAlert, ...prev]);
      setMetrics(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
      
      dismissLoadingAndShowSuccess(toastId, 'Emergency alert created successfully');
      setShowCreateAlert(false);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to create emergency alert');
      }
    }
  }, [alerts]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving alert...');
      // Simulate API call using existing backend endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
      setMetrics(prev => ({ 
      ...prev,
        activeAlerts: prev.activeAlerts - 1, 
        resolvedToday: prev.resolvedToday + 1 
      }));
      
      dismissLoadingAndShowSuccess(toastId, 'Alert resolved successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve alert');
      }
    }
  }, []);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Acknowledging alert...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update alert status to responding
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'responding' as const }
          : alert
      ));
      
      // Update medical emergencies
      setMedicalEmergencies(prev => prev.map(emergency => 
        emergency.id === alertId 
          ? { ...emergency, status: 'responding' as const }
          : emergency
      ));
      
      // Update security alerts
      setSecurityAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'investigating' as const }
          : alert
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Alert acknowledged successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to acknowledge alert');
      }
    }
  }, []);

  const handleViewAlert = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading emergency alerts...</div>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                    <Badge variant="destructive" className="animate-pulse">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.activeAlerts}
                    </h3>
                    <p className="text-slate-600 font-medium">Active Alerts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-check-circle text-white text-xl" />
                    </div>
                    <Badge variant="default" className="animate-pulse">
                      Resolved
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.resolvedToday}
                    </h3>
                    <p className="text-slate-600 font-medium">Resolved Today</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-clock text-white text-xl" />
                    </div>
                    <Badge variant="default" className="animate-pulse">
                      Avg Time
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.averageResponseTime}m
                    </h3>
                    <p className="text-slate-600 font-medium">Response Time</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-ambulance text-white text-xl" />
                    </div>
                    <Badge variant="destructive" className="animate-pulse">
                      Called
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.emergencyServicesCalled}
                    </h3>
                    <p className="text-slate-600 font-medium">Emergency Services</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-bell mr-3 text-slate-600" />
                  Recent Emergency Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 3).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-exclamation-triangle text-white text-xl" />
              </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{alert.alertType}</h3>
                          <p className="text-sm text-slate-600">{alert.location.building} - {alert.location.floor}</p>
                          <p className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
              </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
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
                  <i className="fas fa-bolt mr-3 text-slate-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                    onClick={() => setShowCreateAlert(true)}
                  >
                    <i className="fas fa-plus mr-2" />
                    Create Alert
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('active')}
                  >
                    <i className="fas fa-list mr-2" />
                    View All Alerts
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('response')}
                  >
                    <i className="fas fa-users mr-2" />
                    Deploy Teams
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <i className="fas fa-chart-bar mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-6">
            {/* Alert Type Filter */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-filter mr-3 text-slate-600" />
                  Alert Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={alertFilter === 'all' ? 'default' : 'outline'}
                    className={alertFilter === 'all' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    onClick={() => setAlertFilter('all')}
                  >
                    All Alerts
                  </Button>
                  <Button 
                    variant={alertFilter === 'emergency' ? 'default' : 'outline'}
                    className={alertFilter === 'emergency' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    onClick={() => setAlertFilter('emergency')}
                  >
                    Emergency
                  </Button>
                  <Button 
                    variant={alertFilter === 'medical' ? 'default' : 'outline'}
                    className={alertFilter === 'medical' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    onClick={() => setAlertFilter('medical')}
                  >
                    Medical
                  </Button>
                  <Button 
                    variant={alertFilter === 'security' ? 'default' : 'outline'}
                    className={alertFilter === 'security' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    onClick={() => setAlertFilter('security')}
                  >
                    Security
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Alerts */}
            {(alertFilter === 'all' || alertFilter === 'emergency') && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-exclamation-triangle mr-3 text-slate-600" />
                    Emergency Alerts
                  </CardTitle>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-exclamation-triangle text-white text-xl" />
                        </div>
          <div>
                          <h3 className="font-semibold text-slate-900">{alert.alertType}</h3>
                          <p className="text-sm text-slate-600">{alert.location.building} - Floor {alert.location.floor}</p>
                          <p className="text-xs text-slate-500">
                            {alert.assignedTo && `Assigned to: ${alert.assignedTo}`}
                            {alert.responseTime && ` | Response: ${alert.responseTime}s`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Medical Emergencies */}
            {(alertFilter === 'all' || alertFilter === 'medical') && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-ambulance mr-3 text-slate-600" />
                    Medical Emergencies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicalEmergencies.map(emergency => (
                      <div key={emergency.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getSeverityBadgeVariant(emergency.severity)}>
                              {emergency.severity}
                            </Badge>
                            <span className="font-medium text-slate-900">{emergency.emergencyType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-500">{emergency.timestamp}</span>
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(emergency.id)}>
                              <i className="fas fa-check mr-1" />
                              Respond
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-600 mb-2">{emergency.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Patient Condition:</span>
                            <p className="text-slate-600">{emergency.patientCondition}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Location:</span>
                            <p className="text-slate-600">{emergency.location.building} - {emergency.location.floor}</p>
                          </div>
                          {emergency.vitalSigns && (
                            <div>
                              <span className="font-medium text-slate-700">Vital Signs:</span>
                              <p className="text-slate-600">
                                Pulse: {emergency.vitalSigns.pulse} | BP: {emergency.vitalSigns.bloodPressure}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-slate-700">Ambulance Required:</span>
                            <p className="text-slate-600">{emergency.ambulanceRequired ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Alerts */}
            {(alertFilter === 'all' || alertFilter === 'security') && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-shield-alt mr-3 text-slate-600" />
                    Security Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityAlerts.map(alert => (
                      <div key={alert.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="font-medium text-slate-900">{alert.alertType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-500">{alert.timestamp}</span>
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                              <i className="fas fa-check mr-1" />
                              Investigate
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-600 mb-2">{alert.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Threat Level:</span>
                            <p className="text-slate-600">{alert.threatLevel}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Location:</span>
                            <p className="text-slate-600">{alert.location.building} - {alert.location.floor}</p>
                          </div>
                          {alert.suspectDescription && (
                            <div>
                              <span className="font-medium text-slate-700">Suspect Description:</span>
                              <p className="text-slate-600">{alert.suspectDescription}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-slate-700">Weapons Involved:</span>
                            <p className="text-slate-600">{alert.weaponsInvolved ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                  ))}
            </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'response':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-users mr-3 text-slate-600" />
                  Response Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responseTeams.map((team) => (
                    <div key={team.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                            <i className={`fas fa-${team.type === 'security' ? 'shield-alt' : team.type === 'medical' ? 'heartbeat' : team.type === 'fire' ? 'fire' : 'users'} text-white text-xl`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{team.name}</h3>
                            <p className="text-sm text-slate-600">{team.location}</p>
                          </div>
                        </div>
                        <Badge variant={getTeamStatusBadgeVariant(team.status)}>
                          {team.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Members:</span>
                          <p className="font-medium">{team.members} people</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="font-medium">{team.type}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Contact:</span>
                          <p className="font-medium">{team.contactInfo.phone}</p>
                        </div>
                      </div>
                      {team.currentAssignment && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-1">Current Assignment:</h4>
                          <p className="text-sm text-slate-600">{team.currentAssignment}</p>
                          {team.estimatedArrival && (
                            <p className="text-xs text-slate-500 mt-1">
                              ETA: {team.estimatedArrival} minutes
                            </p>
                          )}
              </div>
                      )}
                      <div className="mt-3">
                        <h4 className="font-semibold text-slate-900 mb-2">Equipment:</h4>
                        <div className="flex flex-wrap gap-2">
                          {team.equipment.map((item, index) => (
                            <Badge key={index} variant="secondary">{item}</Badge>
                          ))}
              </div>
              </div>
            </div>
                  ))}
          </div>
              </CardContent>
            </Card>

            {/* Alert History */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-history mr-3 text-slate-600" />
                  Alert History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.filter(alert => alert.status === 'resolved').map(alert => (
                    <div key={alert.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium text-slate-900">{alert.alertType}</span>
                        </div>
                        <span className="text-sm text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mb-2">{alert.description}</p>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>📍 {alert.location.building} - {alert.location.floor}</span>
                        <span>⏱️ Resolved in {alert.responseTime || 'N/A'}m</span>
                      </div>
                </div>
                  ))}
                  {alerts.filter(alert => alert.status === 'resolved').length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-check-circle text-4xl mb-4 text-green-500" />
                      <p>No resolved alerts in history</p>
              </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );


      case 'settings':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <i className="fas fa-cogs text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Emergency System Settings</h3>
            <p className="text-slate-600">Configure emergency alert system settings and preferences.</p>
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-exclamation-triangle text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-bell text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Emergency Alerts Command Center
              </h1>
              <p className="text-slate-600 font-medium">
                Monitor, respond, and manage critical emergency situations
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EmergencyAlerts; 