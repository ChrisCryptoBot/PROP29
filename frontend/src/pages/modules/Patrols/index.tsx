import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Badge } from '../../../components/UI/Badge';
import { Avatar } from '../../../components/UI/Avatar';
import { showLoading, showSuccess, showError } from '../../../utils/toast';

// Enhanced TypeScript Interfaces
interface PatrolOfficer {
  id: string;
  name: string;
  status: 'on-duty' | 'off-duty' | 'break' | 'unavailable';
  location: string;
  specializations: string[];
  shift: 'Day' | 'Night' | 'Evening';
  experience: string;
  avatar: string;
  lastSeen: string;
  currentPatrol?: string;
}

interface UpcomingPatrol {
  id: string;
  name: string;
  assignedOfficer: string;
  startTime: string;
  duration: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  description: string;
}

interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  checkpoints: Checkpoint[];
  estimatedDuration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
  isActive: boolean;
  lastUsed: string;
  performanceScore: number;
}

interface Checkpoint {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  type: 'security' | 'maintenance' | 'safety' | 'custom';
  requiredActions: string[];
  estimatedTime: number; // minutes
  isCritical: boolean;
}

interface PatrolSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  route: string;
  assignedOfficer: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'routine' | 'emergency' | 'special' | 'training';
}

interface EmergencyStatus {
  level: 'normal' | 'elevated' | 'high' | 'critical';
  message: string;
  lastUpdated: string;
  activeAlerts: number;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  windSpeed: number;
  visibility: string;
  patrolRecommendation: string;
}

interface Alert {
  id: string;
  type: 'checkpoint_missed' | 'emergency' | 'system' | 'weather';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
}

interface PatrolTemplate {
  id: string;
  name: string;
  description: string;
  routeId: string;
  assignedOfficers: string[];
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRecurring: boolean;
}

// Optimized Tab Structure - 5 tabs focused on patrol-specific functionality
const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/patrol' },
  { id: 'patrol-management', label: 'Patrol Management', path: '/modules/patrol-management' },
  { id: 'deployment', label: 'Officer Deployment', path: '/modules/patrol-deployment' },
  { id: 'routes-checkpoints', label: 'Routes & Checkpoints', path: '/modules/patrol-routes' },
  { id: 'patrol-settings', label: 'Patrol Settings', path: '/modules/patrol-settings' }
];

// Mock Data
const mockOfficers: PatrolOfficer[] = [
  {
    id: '1',
    name: 'John Smith',
    status: 'on-duty',
    location: 'Building A - Floor 3',
    specializations: ['Emergency Response', 'Crowd Control'],
    shift: 'Day',
    experience: '5 years',
    avatar: 'JS',
    lastSeen: '2 minutes ago',
    currentPatrol: 'Perimeter Check'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    status: 'on-duty',
    location: 'Main Lobby',
    specializations: ['VIP Protection', 'Surveillance'],
    shift: 'Day',
    experience: '8 years',
    avatar: 'SJ',
    lastSeen: '1 minute ago',
    currentPatrol: 'Lobby Security'
  },
  {
    id: '3',
    name: 'Mike Wilson',
    status: 'break',
    location: 'Security Office',
    specializations: ['Patrol Management', 'Training'],
    shift: 'Night',
    experience: '12 years',
    avatar: 'MW',
    lastSeen: '15 minutes ago'
  },
  {
    id: '4',
    name: 'Lisa Brown',
    status: 'off-duty',
    location: 'Off-site',
    specializations: ['Emergency Response', 'First Aid'],
    shift: 'Evening',
    experience: '3 years',
    avatar: 'LB',
    lastSeen: '2 hours ago'
  }
];

const mockUpcomingPatrols: UpcomingPatrol[] = [
  {
    id: '1',
    name: 'Perimeter Security Check',
    assignedOfficer: 'John Smith',
    startTime: '15:30',
    duration: '45 min',
    priority: 'high',
    status: 'scheduled',
    location: 'Building Perimeter',
    description: 'Complete perimeter security check including parking areas'
  },
  {
    id: '2',
    name: 'VIP Floor Patrol',
    assignedOfficer: 'Sarah Johnson',
    startTime: '16:00',
    duration: '30 min',
    priority: 'critical',
    status: 'scheduled',
    location: 'Executive Floor',
    description: 'High-priority patrol for VIP guest arrival'
  },
  {
    id: '3',
    name: 'Night Shift Handover',
    assignedOfficer: 'Mike Wilson',
    startTime: '22:00',
    duration: '60 min',
    priority: 'medium',
    status: 'scheduled',
    location: 'Security Office',
    description: 'Complete handover briefing for night shift team'
  }
];

const mockRoutes: PatrolRoute[] = [
  {
    id: '1',
    name: 'Perimeter Security Route',
    description: 'Complete perimeter check including all entrances and exits',
    checkpoints: [
      { id: '1', name: 'Main Entrance', location: 'Building A - Front', coordinates: { lat: 40.7128, lng: -74.0060 }, type: 'security', requiredActions: ['Check access logs', 'Verify cameras'], estimatedTime: 5, isCritical: true },
      { id: '2', name: 'Loading Dock', location: 'Building A - Rear', coordinates: { lat: 40.7129, lng: -74.0061 }, type: 'security', requiredActions: ['Check deliveries', 'Verify locks'], estimatedTime: 3, isCritical: false },
      { id: '3', name: 'Emergency Exit', location: 'Building A - Side', coordinates: { lat: 40.7127, lng: -74.0059 }, type: 'safety', requiredActions: ['Test alarm', 'Check lighting'], estimatedTime: 2, isCritical: true }
    ],
    estimatedDuration: '45 min',
    difficulty: 'medium',
    frequency: 'hourly',
    isActive: true,
    lastUsed: '2024-01-15T10:30:00Z',
    performanceScore: 92
  },
  {
    id: '2',
    name: 'VIP Area Patrol',
    description: 'High-security area patrol for VIP guests and sensitive areas',
    checkpoints: [
      { id: '4', name: 'VIP Suite Floor', location: 'Building B - Floor 15', coordinates: { lat: 40.7130, lng: -74.0062 }, type: 'security', requiredActions: ['Verify access', 'Check surveillance'], estimatedTime: 8, isCritical: true },
      { id: '5', name: 'Executive Office', location: 'Building B - Floor 16', coordinates: { lat: 40.7131, lng: -74.0063 }, type: 'security', requiredActions: ['Check locks', 'Verify alarms'], estimatedTime: 5, isCritical: true }
    ],
    estimatedDuration: '25 min',
    difficulty: 'hard',
    frequency: 'daily',
    isActive: true,
    lastUsed: '2024-01-15T09:15:00Z',
    performanceScore: 88
  }
];

const mockSchedule: PatrolSchedule[] = [
  {
    id: '1',
    title: 'Morning Perimeter Check',
    date: '2024-01-15',
    time: '06:00',
    duration: '45 min',
    route: 'Perimeter Security Route',
    assignedOfficer: 'John Smith',
    priority: 'high',
    status: 'completed',
    type: 'routine'
  },
  {
    id: '2',
    title: 'VIP Area Patrol',
    date: '2024-01-15',
    time: '14:00',
    duration: '30 min',
    route: 'VIP Area Patrol',
    assignedOfficer: 'Sarah Johnson',
    priority: 'critical',
    status: 'in-progress',
    type: 'special'
  },
  {
    id: '3',
    title: 'Night Security Round',
    date: '2024-01-15',
    time: '22:00',
    duration: '60 min',
    route: 'Perimeter Security Route',
    assignedOfficer: 'Mike Wilson',
    priority: 'high',
    status: 'scheduled',
    type: 'routine'
  },
  {
    id: '4',
    title: 'Emergency Response Training',
    date: '2024-01-16',
    time: '10:00',
    duration: '120 min',
    route: 'Training Area',
    assignedOfficer: 'Lisa Brown',
    priority: 'medium',
    status: 'scheduled',
    type: 'training'
  }
];

const mockEmergencyStatus: EmergencyStatus = {
  level: 'normal',
  message: 'All systems operational',
  lastUpdated: '2 minutes ago',
  activeAlerts: 0
};

const mockWeather: WeatherInfo = {
  temperature: 72,
  condition: 'Partly Cloudy',
  windSpeed: 8,
  visibility: 'Good',
  patrolRecommendation: 'Normal patrol conditions'
};

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'checkpoint_missed',
    message: 'Checkpoint 3 missed by Officer Johnson',
    timestamp: '2024-01-15T13:45:00Z',
    severity: 'medium',
    isRead: false
  },
  {
    id: '2',
    type: 'system',
    message: 'GPS tracking restored for all officers',
    timestamp: '2024-01-15T12:30:00Z',
    severity: 'low',
    isRead: true
  },
  {
    id: '3',
    type: 'weather',
    message: 'Weather alert: High winds expected after 18:00',
    timestamp: '2024-01-15T11:15:00Z',
    severity: 'medium',
    isRead: false
  }
];

const mockTemplates: PatrolTemplate[] = [
  {
    id: '1',
    name: 'Morning Security Round',
    description: 'Standard morning security patrol for all areas',
    routeId: '1',
    assignedOfficers: ['1', '2'],
    schedule: { startTime: '06:00', endTime: '08:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    priority: 'high',
    isRecurring: true
  },
  {
    id: '2',
    name: 'Night Perimeter Check',
    description: 'Nightly perimeter security check',
    routeId: '1',
    assignedOfficers: ['3', '4'],
    schedule: { startTime: '22:00', endTime: '23:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    priority: 'critical',
    isRecurring: true
  }
];

const mockMetrics = {
  activePatrols: 3,
  totalOfficers: 12,
  onDutyOfficers: 8,
  completedPatrols: 24,
  averageResponseTime: '2.3 min',
  systemUptime: '99.8%',
  emergencyAlerts: 1,
  lastIncident: '2 hours ago',
  totalRoutes: mockRoutes.length,
  activeRoutes: mockRoutes.filter(r => r.isActive).length,
  checkpointCompletionRate: 94,
  averagePatrolDuration: '38 min'
};

const Patrols: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [officers, setOfficers] = useState<PatrolOfficer[]>(mockOfficers);
  const [upcomingPatrols, setUpcomingPatrols] = useState<UpcomingPatrol[]>(mockUpcomingPatrols);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [routes, setRoutes] = useState<PatrolRoute[]>(mockRoutes);
  const [templates, setTemplates] = useState<PatrolTemplate[]>(mockTemplates);
  const [schedule, setSchedule] = useState<PatrolSchedule[]>(mockSchedule);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>(mockEmergencyStatus);
  const [weather, setWeather] = useState<WeatherInfo>(mockWeather);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  
  // Modal states
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  
  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    routeId: '',
    assignedOfficers: [] as string[],
    schedule: { startTime: '', endTime: '', days: [] as string[] },
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    isRecurring: false
  });
  
  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    estimatedDuration: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    frequency: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'custom',
    isActive: true
  });
  
  const [checkpointForm, setCheckpointForm] = useState({
    name: '',
    location: '',
    type: 'security' as 'security' | 'maintenance' | 'safety' | 'custom',
    requiredActions: [] as string[],
    estimatedTime: 5,
    isCritical: false,
    routeId: ''
  });

  // Handlers
  const handleDeployOfficer = useCallback(async (officerId: string, patrolId: string) => {
    showLoading('Deploying officer...');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOfficers(prev => prev.map(officer => 
        officer.id === officerId 
          ? { ...officer, status: 'on-duty', currentPatrol: patrolId }
          : officer
      ));
      
      showSuccess('Officer deployed successfully!');
    } catch (error) {
      showError('Failed to deploy officer');
    }
  }, []);

  const handleCompletePatrol = useCallback(async (patrolId: string) => {
    showLoading('Completing patrol...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUpcomingPatrols(prev => prev.map(patrol => 
        patrol.id === patrolId 
          ? { ...patrol, status: 'completed' }
          : patrol
      ));
      
      showSuccess('Patrol completed successfully!');
    } catch (error) {
      showError('Failed to complete patrol');
    }
  }, []);

  const handleEmergencyAlert = useCallback(async () => {
    showLoading('Sending emergency alert...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Emergency alert sent to all officers!');
    } catch (error) {
      showError('Failed to send emergency alert');
    }
  }, []);

  // Form submission handlers
  const handleCreateTemplate = useCallback(async () => {
    // Form validation
    if (!templateForm.name.trim()) {
      showError('Template name is required');
      return;
    }
    if (!templateForm.routeId) {
      showError('Please select a route');
      return;
    }
    if (!templateForm.schedule.startTime || !templateForm.schedule.endTime) {
      showError('Start and end times are required');
      return;
    }

    showLoading('Creating patrol template...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTemplate: PatrolTemplate = {
        id: `template-${Date.now()}`,
        ...templateForm,
        assignedOfficers: templateForm.assignedOfficers,
        schedule: templateForm.schedule
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateTemplate(false);
      setTemplateForm({
        name: '',
        description: '',
        routeId: '',
        assignedOfficers: [],
        schedule: { startTime: '', endTime: '', days: [] },
        priority: 'medium',
        isRecurring: false
      });
      showSuccess('Patrol template created successfully!');
    } catch (error) {
      showError('Failed to create patrol template');
    }
  }, [templateForm]);

  const handleCreateRoute = useCallback(async () => {
    // Form validation
    if (!routeForm.name.trim()) {
      showError('Route name is required');
      return;
    }
    if (!routeForm.estimatedDuration) {
      showError('Please select estimated duration');
      return;
    }

    showLoading('Creating patrol route...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRoute: PatrolRoute = {
        id: `route-${Date.now()}`,
        ...routeForm,
        checkpoints: [],
        lastUsed: new Date().toISOString(),
        performanceScore: 0
      };
      
      setRoutes(prev => [...prev, newRoute]);
      setShowCreateRoute(false);
      setRouteForm({
        name: '',
        description: '',
        estimatedDuration: '',
        difficulty: 'medium',
        frequency: 'hourly',
        isActive: true
      });
      showSuccess('Patrol route created successfully!');
    } catch (error) {
      showError('Failed to create patrol route');
    }
  }, [routeForm]);

  const handleAddCheckpoint = useCallback(async () => {
    // Form validation
    if (!checkpointForm.name.trim()) {
      showError('Checkpoint name is required');
      return;
    }
    if (!checkpointForm.location.trim()) {
      showError('Checkpoint location is required');
      return;
    }
    if (!checkpointForm.routeId) {
      showError('Please select a route');
      return;
    }
    if (checkpointForm.estimatedTime < 1 || checkpointForm.estimatedTime > 60) {
      showError('Estimated time must be between 1 and 60 minutes');
      return;
    }

    showLoading('Adding checkpoint...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCheckpoint: Checkpoint = {
        id: `checkpoint-${Date.now()}`,
        ...checkpointForm,
        coordinates: { lat: 40.7128, lng: -74.0060 } // Default coordinates
      };
      
      setRoutes(prev => prev.map(route => 
        route.id === checkpointForm.routeId 
          ? { ...route, checkpoints: [...route.checkpoints, newCheckpoint] }
          : route
      ));
      
      setShowAddCheckpoint(false);
      setCheckpointForm({
        name: '',
        location: '',
        type: 'security',
        requiredActions: [],
        estimatedTime: 5,
        isCritical: false,
        routeId: ''
      });
      showSuccess('Checkpoint added successfully!');
    } catch (error) {
      showError('Failed to add checkpoint');
    }
  }, [checkpointForm]);

  // Tab Content Renderer
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
  return (
          <div className="space-y-6">
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-route text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{metrics.activePatrols}</h3>
                    <p className="text-slate-600 text-sm">Currently in progress</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-user-shield text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{metrics.onDutyOfficers}</h3>
                    <p className="text-slate-600 text-sm">Out of {metrics.totalOfficers} total</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-map-marked-alt text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{metrics.activeRoutes}</h3>
                    <p className="text-slate-600 text-sm">Active patrol routes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-check-circle text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{metrics.checkpointCompletionRate}%</h3>
                    <p className="text-slate-600 text-sm">Checkpoint completion rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Dashboard Components */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Emergency Status & Weather */}
              <div className="space-y-4">
                {/* Emergency Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-shield-alt mr-2 text-slate-600"></i>
                      Emergency Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        emergencyStatus.level === 'normal' ? 'bg-green-100 text-green-800' :
                        emergencyStatus.level === 'elevated' ? 'bg-yellow-100 text-yellow-800' :
                        emergencyStatus.level === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {emergencyStatus.level.toUpperCase()}
                </div>
                      <span className="text-xs text-slate-500">{emergencyStatus.lastUpdated}</span>
              </div>
                    <p className="text-sm text-slate-600 mb-2">{emergencyStatus.message}</p>
                    {emergencyStatus.activeAlerts > 0 && (
                      <div className="flex items-center text-red-600 text-sm">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        {emergencyStatus.activeAlerts} active alerts
                      </div>
                    )}
                    
                    {/* System Status Indicators */}
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">System Status</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">GPS Tracking:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span className="text-green-600 font-medium">Online</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Radio Comms:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span className="text-green-600 font-medium">Active</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Backup Power:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span className="text-green-600 font-medium">Ready</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-cloud-sun mr-2 text-slate-600"></i>
                      Weather Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-slate-900">{weather.temperature}°F</div>
                      <div className="text-sm text-slate-600">{weather.condition}</div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Wind Speed:</span>
                        <span>{weather.windSpeed} mph</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Visibility:</span>
                        <span>{weather.visibility}</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-800 font-medium">
                        <i className="fas fa-info-circle mr-1"></i>
                        {weather.patrolRecommendation}
                </p>
              </div>
                    
                    {/* Patrol Conditions */}
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Patrol Conditions</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Outdoor Patrol:</span>
                          <span className={`font-medium ${
                            weather.temperature > 60 && weather.temperature < 85 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {weather.temperature > 60 && weather.temperature < 85 ? 'Optimal' : 'Caution'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Night Visibility:</span>
                          <span className={`font-medium ${
                            weather.visibility === 'Good' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {weather.visibility}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Wind Impact:</span>
                          <span className={`font-medium ${
                            weather.windSpeed < 15 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {weather.windSpeed < 15 ? 'Minimal' : 'Moderate'}
                          </span>
                        </div>
                      </div>
                    </div>
            </CardContent>
          </Card>
              </div>

              {/* Calendar & Schedule */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <i className="fas fa-calendar-alt mr-2 text-slate-600"></i>
                        Patrol Schedule
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {schedule.filter(item => item.date === '2024-01-15').length} today
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {schedule.filter(item => item.status === 'in-progress').length} active
                        </Badge>
                </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {schedule.filter(item => item.date === '2024-01-15').map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              item.status === 'completed' ? 'bg-green-500' :
                              item.status === 'in-progress' ? 'bg-blue-500' :
                              item.status === 'scheduled' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <h4 className="font-medium text-slate-900">{item.title}</h4>
                              <p className="text-sm text-slate-600">{item.route} • {item.assignedOfficer}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={
                              item.priority === 'critical' ? 'destructive' :
                              item.priority === 'high' ? 'warning' :
                              'default'
                            }>
                              {item.priority}
                </Badge>
                            <div className="text-right text-sm text-slate-600">
                              <div>{item.time}</div>
                              <div>{item.duration}</div>
              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-900">
                            {schedule.filter(item => item.date === '2024-01-16').length}
                          </div>
                          <div className="text-xs text-slate-600">Tomorrow's Patrols</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-900">
                            {schedule.filter(item => item.status === 'completed').length}
                          </div>
                          <div className="text-xs text-slate-600">Completed Today</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Route Performance Summary */}
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Route Performance</h4>
                      <div className="space-y-2">
                        {routes.slice(0, 2).map((route) => (
                          <div key={route.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                route.performanceScore >= 90 ? 'bg-green-500' :
                                route.performanceScore >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-sm text-slate-700">{route.name}</span>
                            </div>
                            <div className="text-sm font-medium text-slate-900">
                              {route.performanceScore}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-bell mr-2 text-slate-600"></i>
                    Recent Alerts
                  </span>
                  <Badge variant="outline">
                    {alerts.filter(alert => !alert.isRead).length} unread
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      alert.isRead ? 'bg-slate-50' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div>
                          <p className={`text-sm ${alert.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'warning' :
                          'default'
                        }>
                          {alert.severity}
                        </Badge>
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

            {/* Officers Status */}
            <Card>
              <CardHeader>
                <CardTitle>Officer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {officers.map((officer) => (
                    <div key={officer.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-medium">
                          {officer.avatar}
                </div>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{officer.name}</p>
                        <p className="text-sm text-slate-500">{officer.location}</p>
                        <div className="flex items-center mt-1">
                          <Badge variant={officer.status === 'on-duty' ? 'default' : 'secondary'}>
                            {officer.status}
                </Badge>
                          <span className="text-xs text-slate-500 ml-2">{officer.lastSeen}</span>
              </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 'patrol-management':
        return (
          <div className="space-y-6">
            {/* Patrol Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patrol Templates</span>
                  <Button 
                    onClick={() => setShowCreateTemplate(true)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Template
                  </Button>
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-600">{template.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-slate-600">Route: {routes.find(r => r.id === template.routeId)?.name}</span>
                          <span className="text-sm text-slate-600">Schedule: {template.schedule.startTime} - {template.schedule.endTime}</span>
                          <Badge variant={template.priority === 'critical' ? 'destructive' : template.priority === 'high' ? 'warning' : 'default'}>
                            {template.priority}
                          </Badge>
                          <Badge variant="outline">
                            {template.isRecurring ? 'Recurring' : 'One-time'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button size="sm" className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                          <i className="fas fa-play mr-1"></i>
                          Execute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Patrols */}
            <Card>
              <CardHeader>
                <CardTitle>Active Patrols</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPatrols.filter(p => p.status === 'in-progress').map((patrol) => (
                    <div key={patrol.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{patrol.name}</h3>
                        <p className="text-sm text-slate-600">{patrol.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-slate-600">Officer: {patrol.assignedOfficer}</span>
                          <span className="text-sm text-slate-600">Location: {patrol.location}</span>
                          <Badge variant={patrol.priority === 'critical' ? 'destructive' : 'default'}>
                            {patrol.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleCompletePatrol(patrol.id)}
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                        >
                          <i className="fas fa-check mr-1"></i>
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'deployment':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Officer Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {officers.map((officer) => (
                    <div key={officer.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-medium">
                                {officer.avatar}
                          </div>
                              </Avatar>
                              <div>
                          <p className="font-medium">{officer.name}</p>
                          <p className="text-sm text-slate-600">{officer.experience}</p>
                              </div>
                            </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {officer.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {spec}
                              </Badge>
                          ))}
                            </div>
                        <Button 
                          size="sm" 
                          className="w-full !bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => handleDeployOfficer(officer.id, 'patrol-1')}
                          disabled={officer.status === 'on-duty'}
                        >
                          {officer.status === 'on-duty' ? 'Currently Deployed' : 'Deploy Officer'}
                        </Button>
                          </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'routes-checkpoints':
        return (
          <div className="space-y-6">
            {/* Route Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patrol Routes</span>
                  <Button 
                    onClick={() => setShowCreateRoute(true)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Route
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes.map((route) => (
                    <div key={route.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-slate-900">{route.name}</h3>
                          <p className="text-sm text-slate-600">{route.description}</p>
                            </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={route.difficulty === 'hard' ? 'destructive' : route.difficulty === 'medium' ? 'warning' : 'default'}>
                            {route.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            {route.frequency}
                          </Badge>
                          <Badge variant={route.isActive ? 'success' : 'secondary'}>
                            {route.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-sm">
                          <span className="text-slate-600">Duration:</span>
                          <span className="ml-1 font-medium">{route.estimatedDuration}</span>
                                </div>
                        <div className="text-sm">
                          <span className="text-slate-600">Checkpoints:</span>
                          <span className="ml-1 font-medium">{route.checkpoints.length}</span>
                                </div>
                        <div className="text-sm">
                          <span className="text-slate-600">Performance:</span>
                          <span className="ml-1 font-medium">{route.performanceScore}%</span>
                              </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-eye mr-1"></i>
                          View Details
                              </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-edit mr-1"></i>
                          Edit Route
                        </Button>
                        <Button size="sm" className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                          <i className="fas fa-play mr-1"></i>
                          Start Patrol
                              </Button>
                            </div>
                    </div>
                  ))}
                          </div>
                        </CardContent>
                      </Card>

            {/* Checkpoint Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Checkpoint Management</span>
                  <Button 
                    onClick={() => setShowAddCheckpoint(true)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Checkpoint
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes.flatMap(route => route.checkpoints).map((checkpoint) => (
                    <div key={checkpoint.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{checkpoint.name}</h3>
                        <p className="text-sm text-slate-600">{checkpoint.location}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <Badge variant={checkpoint.type === 'security' ? 'destructive' : checkpoint.type === 'safety' ? 'warning' : 'default'}>
                            {checkpoint.type}
                          </Badge>
                          <span className="text-sm text-slate-600">Time: {checkpoint.estimatedTime} min</span>
                          {checkpoint.isCritical && (
                            <Badge variant="destructive">Critical</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">Required Actions:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {checkpoint.requiredActions.map((action, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          View Location
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                      </div>
                    </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
        );

      case 'patrol-settings':
        return (
            <div className="space-y-6">
            {/* System Configuration */}
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-cog mr-2 text-slate-600"></i>
                  System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Default Patrol Duration</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="60"
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">2 hours</option>
                      </select>
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Patrol Frequency</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="hourly"
                      >
                        <option value="30min">Every 30 minutes</option>
                        <option value="hourly">Every hour</option>
                        <option value="2hours">Every 2 hours</option>
                        <option value="4hours">Every 4 hours</option>
                        <option value="custom">Custom Schedule</option>
                      </select>
                          </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Checkpoint Timeout</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="5"
                      >
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                      </select>
                          </div>
                          </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Shift Handover Time</label>
                      <input 
                        type="time" 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        defaultValue="06:00" 
                      />
                          </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Response Time</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="2"
                      >
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                      </select>
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Assignment</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="enabled"
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                        <option value="manual">Manual Only</option>
                      </select>
                      </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Patrol Buffer Time</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="5"
                      >
                        <option value="0">No buffer</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Max Concurrent Patrols</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="20" 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        defaultValue="5" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Patrol Priority</label>
                      <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="medium"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>

            {/* Mobile App Integration */}
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-mobile-alt mr-2 text-slate-600"></i>
                  Mobile App Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Real-time Sync</h3>
                          <p className="text-sm text-slate-600">Sync patrol data with mobile apps in real-time</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Offline Mode</h3>
                          <p className="text-sm text-slate-600">Allow patrol agents to work offline</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Auto-Schedule Updates</h3>
                          <p className="text-sm text-slate-600">Automatically update agent schedules</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Push Notifications</h3>
                          <p className="text-sm text-slate-600">Send notifications to mobile devices</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Location Tracking</h3>
                          <p className="text-sm text-slate-600">Track agent locations during patrols</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Emergency Alerts</h3>
                          <p className="text-sm text-slate-600">Send emergency alerts to all agents</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile App Configuration */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Mobile App Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sync Interval</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="30"
                        >
                          <option value="15">15 seconds</option>
                          <option value="30">30 seconds</option>
                          <option value="60">1 minute</option>
                          <option value="300">5 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Offline Data Limit</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="24"
                        >
                          <option value="1">1 hour</option>
                          <option value="6">6 hours</option>
                          <option value="12">12 hours</option>
                          <option value="24">24 hours</option>
                          <option value="48">48 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert & Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-bell mr-2 text-slate-600"></i>
                  Alert & Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Checkpoint Missed Alert</h3>
                          <p className="text-sm text-slate-600">Alert when officer misses a checkpoint</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Emergency Alert</h3>
                          <p className="text-sm text-slate-600">Send alerts to all officers during emergencies</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Patrol Completion Notification</h3>
                          <p className="text-sm text-slate-600">Notify command center when patrols are completed</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Shift Change Alerts</h3>
                          <p className="text-sm text-slate-600">Alert agents about upcoming shift changes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Route Deviation Alert</h3>
                          <p className="text-sm text-slate-600">Alert when agents deviate from assigned routes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">System Status Alerts</h3>
                          <p className="text-sm text-slate-600">Alert about system issues or maintenance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alert Configuration */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Alert Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Alert Escalation Time</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="5"
                        >
                          <option value="2">2 minutes</option>
                          <option value="5">5 minutes</option>
                          <option value="10">10 minutes</option>
                          <option value="15">15 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Alert Retries</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          defaultValue="3" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Alert Priority</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="high"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-plug mr-2 text-slate-600"></i>
                  Integration Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">GPS Tracking</h3>
                          <p className="text-sm text-slate-600">Enable real-time GPS tracking for patrol officers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Mobile App Sync</h3>
                          <p className="text-sm text-slate-600">Synchronize patrol data with mobile applications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">API Integration</h3>
                          <p className="text-sm text-slate-600">Enable API access for third-party integrations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Database Sync</h3>
                          <p className="text-sm text-slate-600">Sync with external databases</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Webhook Support</h3>
                          <p className="text-sm text-slate-600">Enable webhook notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Cloud Backup</h3>
                          <p className="text-sm text-slate-600">Automatically backup patrol data to cloud</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* API Configuration */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">API Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">API Rate Limit</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="1000"
                        >
                          <option value="100">100 requests/hour</option>
                          <option value="500">500 requests/hour</option>
                          <option value="1000">1000 requests/hour</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">API Timeout</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="30"
                        >
                          <option value="10">10 seconds</option>
                          <option value="30">30 seconds</option>
                          <option value="60">60 seconds</option>
                          <option value="120">120 seconds</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-shield-alt mr-2 text-slate-600"></i>
                  Security & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Role-Based Access</h3>
                          <p className="text-sm text-slate-600">Enable role-based permissions for patrol agents</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Data Encryption</h3>
                          <p className="text-sm text-slate-600">Encrypt sensitive patrol data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Audit Logging</h3>
                          <p className="text-sm text-slate-600">Log all patrol activities for audit</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Session Management</h3>
                          <p className="text-sm text-slate-600">Manage agent login sessions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Two-Factor Auth</h3>
                          <p className="text-sm text-slate-600">Require 2FA for agent access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">Device Management</h3>
                          <p className="text-sm text-slate-600">Manage authorized devices for agents</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Configuration */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Security Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Session Timeout</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="8"
                        >
                          <option value="2">2 hours</option>
                          <option value="4">4 hours</option>
                          <option value="8">8 hours</option>
                          <option value="12">12 hours</option>
                          <option value="24">24 hours</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password Policy</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="strong"
                        >
                          <option value="basic">Basic</option>
                          <option value="medium">Medium</option>
                          <option value="strong">Strong</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Login Attempts</label>
                        <input 
                          type="number" 
                          min="3" 
                          max="10" 
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          defaultValue="5" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings */}
            <div className="flex justify-end space-x-4">
                    <Button 
                variant="outline" 
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                <i className="fas fa-undo mr-2"></i>
                Reset to Defaults
                    </Button>
              <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-save mr-2"></i>
                Save All Settings
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-slate-400 text-4xl mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">Tab not found</h3>
            <p className="text-slate-500">The requested tab does not exist.</p>
          </div>
        );
    }
  }, [activeTab, officers, upcomingPatrols, metrics, handleDeployOfficer, handleCompletePatrol, handleEmergencyAlert]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-route text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Patrol Command Center
                </h1>
                <p className="text-slate-600 font-medium">
                  Advanced patrol management and security operations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.id
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
      </div>

      {/* Main Content */}
      <div className="relative max-w-[1800px] mx-auto px-6 py-6">
        {renderTabContent()}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Patrol Template</h2>
              <button 
                onClick={() => setShowCreateTemplate(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                <input
                  id="template-name"
                  type="text"
                  value={templateForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="template-description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="template-route" className="block text-sm font-medium text-slate-700 mb-2">Route</label>
                <select
                  id="template-route"
                  value={templateForm.routeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemplateForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="template-start-time" className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                  <input
                    id="template-start-time"
                    type="time"
                    value={templateForm.schedule.startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm(prev => ({ 
                      ...prev, 
                      schedule: { ...prev.schedule, startTime: e.target.value }
                    }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="template-end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                  <input
                    id="template-end-time"
                    type="time"
                    value={templateForm.schedule.endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm(prev => ({ 
                      ...prev, 
                      schedule: { ...prev.schedule, endTime: e.target.value }
                    }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="template-priority" className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  id="template-priority"
                  value={templateForm.priority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemplateForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="template-recurring"
                  checked={templateForm.isRecurring}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                />
                <label htmlFor="template-recurring" className="text-sm font-medium text-slate-700">Recurring Template</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                      variant="outline"
                onClick={() => setShowCreateTemplate(false)}
                    >
                Cancel
                    </Button>
                    <Button 
                onClick={handleCreateTemplate}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Create Template
                    </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Route Modal */}
      {showCreateRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Patrol Route</h2>
              <button 
                onClick={() => setShowCreateRoute(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="route-name" className="block text-sm font-medium text-slate-700 mb-2">Route Name</label>
                <input
                  id="route-name"
                  type="text"
                  value={routeForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter route name"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="route-description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  id="route-description"
                  value={routeForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRouteForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter route description"
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="route-duration" className="block text-sm font-medium text-slate-700 mb-2">Estimated Duration</label>
                  <select
                    id="route-duration"
                    value={routeForm.estimatedDuration}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRouteForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select duration</option>
                    <option value="15 min">15 minutes</option>
                    <option value="30 min">30 minutes</option>
                    <option value="45 min">45 minutes</option>
                    <option value="60 min">60 minutes</option>
                    <option value="90 min">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="route-difficulty" className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                  <select
                    id="route-difficulty"
                    value={routeForm.difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRouteForm(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="route-frequency" className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                <select
                  id="route-frequency"
                  value={routeForm.frequency}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRouteForm(prev => ({ ...prev, frequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'custom' }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="route-active"
                  checked={routeForm.isActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="route-active" className="text-sm font-medium text-slate-700">Active Route</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
                    <Button 
                      variant="outline"
                onClick={() => setShowCreateRoute(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRoute}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Create Route
                    </Button>
                  </div>
            </div>
          </div>
        )}

      {/* Add Checkpoint Modal */}
      {showAddCheckpoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Add Checkpoint</h2>
              <button 
                onClick={() => setShowAddCheckpoint(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
      </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="checkpoint-name" className="block text-sm font-medium text-slate-700 mb-2">Checkpoint Name</label>
                <input
                  id="checkpoint-name"
                  type="text"
                  value={checkpointForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckpointForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter checkpoint name"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="checkpoint-location" className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  id="checkpoint-location"
                  type="text"
                  value={checkpointForm.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckpointForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter checkpoint location"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkpoint-type" className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    id="checkpoint-type"
                    value={checkpointForm.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCheckpointForm(prev => ({ ...prev, type: e.target.value as 'security' | 'maintenance' | 'safety' | 'custom' }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="security">Security</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="safety">Safety</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="checkpoint-time" className="block text-sm font-medium text-slate-700 mb-2">Estimated Time (minutes)</label>
                  <input
                    id="checkpoint-time"
                    type="number"
                    value={checkpointForm.estimatedTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckpointForm(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="60"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="checkpoint-route" className="block text-sm font-medium text-slate-700 mb-2">Assign to Route</label>
                <select
                  id="checkpoint-route"
                  value={checkpointForm.routeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCheckpointForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="checkpoint-critical"
                  checked={checkpointForm.isCritical}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckpointForm(prev => ({ ...prev, isCritical: e.target.checked }))}
                />
                <label htmlFor="checkpoint-critical" className="text-sm font-medium text-slate-700">Critical Checkpoint</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowAddCheckpoint(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCheckpoint}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Add Checkpoint
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patrols; 