import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Badge } from '../../../components/UI/Badge';
import { Avatar } from '../../../components/UI/Avatar';
import { Toggle } from '../../../components/UI/Toggle';
import { Modal } from '../../../components/UI/Modal';
import { EmptyState } from '../../../components/UI/EmptyState';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess } from '../../../utils/toast';
import {
  ScheduleSuggestionsPanel,
  TemplateSuggestionsPanel,
  OfficerMatchingPanel,
  RouteOptimizationPanel
} from '../../../components/PatrolModule';
import { patrolAI } from '../../../services/PatrolAIService';
import { ValidationService } from '../../../services/ValidationService';
import { StateUpdateService } from '../../../services/StateUpdateService';
import { IdGeneratorService } from '../../../services/IdGeneratorService';
import { ConfigService } from '../../../services/ConfigService';
import { PatrolCreationService } from '../../../services/PatrolCreationService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import '../../../styles/modern-glass.css';

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


const Patrols: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [officers, setOfficers] = useState<PatrolOfficer[]>([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState<UpcomingPatrol[]>([]);
  const [metrics, setMetrics] = useState({
    activePatrols: 0,
    totalOfficers: 0,
    onDutyOfficers: 0,
    completedPatrols: 0,
    averageResponseTime: '0 min',
    systemUptime: '0%',
    emergencyAlerts: 0,
    lastIncident: 'N/A',
    totalRoutes: 0,
    activeRoutes: 0,
    checkpointCompletionRate: 0,
    averagePatrolDuration: '0 min'
  });
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [templates, setTemplates] = useState<PatrolTemplate[]>([]);
  const [schedule, setSchedule] = useState<PatrolSchedule[]>([]);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
    level: 'normal',
    message: 'All systems operational',
    lastUpdated: 'Just now',
    activeAlerts: 0
  });
  const [weather, setWeather] = useState<WeatherInfo>({
    temperature: 0,
    condition: 'Unknown',
    windSpeed: 0,
    visibility: 'Unknown',
    patrolRecommendation: 'No data available'
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Modal states
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PatrolTemplate | null>(null);
  const [editingRoute, setEditingRoute] = useState<PatrolRoute | null>(null);
  const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
  const [viewingRoute, setViewingRoute] = useState<PatrolRoute | null>(null);
  const [viewingCheckpoint, setViewingCheckpoint] = useState<Checkpoint | null>(null);
  const [aiTemplateSuggestions, setAiTemplateSuggestions] = useState<any[]>([]);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    realTimeSync: true,
    offlineMode: true,
    autoScheduleUpdates: true,
    pushNotifications: true,
    locationTracking: true,
    emergencyAlerts: true,
    checkpointMissedAlert: true,
    emergencyAlert: true,
    patrolCompletionNotification: true,
    shiftChangeAlerts: true,
    routeDeviationAlert: true,
    systemStatusAlerts: true,
    gpsTracking: true,
    biometricVerification: true,
    autoReportGeneration: true,
    auditLogging: true,
    twoFactorAuth: true,
    sessionTimeout: true,
    ipWhitelist: true,
    mobileAppSync: true,
    apiIntegration: true,
    databaseSync: true,
    webhookSupport: true,
    cloudBackup: true,
    roleBasedAccess: true,
    dataEncryption: true
  });
  
  // Default form states (centralized)
  const DEFAULT_TEMPLATE_FORM = {
    name: '',
    description: '',
    routeId: '',
    assignedOfficers: [] as string[],
    schedule: { startTime: '', endTime: '', days: [] as string[] },
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    isRecurring: false
  };

  const DEFAULT_ROUTE_FORM = {
    name: '',
    description: '',
    estimatedDuration: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    frequency: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'custom',
    isActive: true
  };

  const DEFAULT_CHECKPOINT_FORM = {
    name: '',
    location: '',
    type: 'security' as 'security' | 'maintenance' | 'safety' | 'custom',
    requiredActions: [] as string[],
    estimatedTime: ConfigService.DEFAULT_CHECKPOINT_TIME,
    isCritical: false,
    routeId: '',
    coordinates: { lat: 0, lng: 0 }
  };

  // Form states
  const [templateForm, setTemplateForm] = useState(DEFAULT_TEMPLATE_FORM);
  const [routeForm, setRouteForm] = useState(DEFAULT_ROUTE_FORM);
  const [checkpointForm, setCheckpointForm] = useState(DEFAULT_CHECKPOINT_FORM);

  // Handlers
  const handleDeployOfficer = useCallback(async (officerId: string, patrolId: string) => {
    if (!officerId || !patrolId) {
      showError('Invalid officer or patrol ID');
      return;
    }

    const officer = officers.find(o => o.id === officerId);
    if (!officer) {
      showError('Officer not found');
      return;
    }

    if (officer.status === 'on-duty') {
      showError('Officer is already deployed');
      return;
    }

    const patrol = upcomingPatrols.find(p => p.id === patrolId);
    if (!patrol) {
      showError('Patrol not found');
      return;
    }

    if (patrol.status !== 'scheduled') {
      showError('Can only deploy to scheduled patrols');
      return;
    }

    showLoading('Deploying officer...');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      setOfficers(prev => StateUpdateService.updateItem(prev, officerId, {
        status: 'on-duty' as const,
        currentPatrol: patrolId
      }));

      setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, {
        status: 'in-progress' as const,
        assignedOfficer: officer.name
      }));

      showSuccess(`Officer ${officer.name} deployed successfully!`);
    } catch (error) {
      showError('Failed to deploy officer');
    }
  }, [officers, upcomingPatrols]);

  const handleCompletePatrol = useCallback(async (patrolId: string) => {
    if (!patrolId) {
      showError('Invalid patrol ID');
      return;
    }

    const patrol = upcomingPatrols.find(p => p && p.id === patrolId);
    if (!patrol) {
      showError('Patrol not found');
      return;
    }

    if (patrol.status === 'completed') {
      showError('Patrol is already completed');
      return;
    }

    if (patrol.status !== 'in-progress') {
      showError('Can only complete patrols that are in progress');
      return;
    }

    showLoading('Completing patrol...');
    try {
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, {
        status: 'completed' as const
      }));

      // Update officer status if assigned
      if (patrol.assignedOfficer) {
        const assignedOfficer = officers.find(o => 
          o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId
        );
        if (assignedOfficer) {
          setOfficers(prev => StateUpdateService.updateItem(prev, assignedOfficer.id, {
            status: 'off-duty' as const,
            currentPatrol: undefined
          }));
        }
      }

      showSuccess('Patrol completed successfully!');
    } catch (error) {
      showError('Failed to complete patrol');
    }
  }, [upcomingPatrols]);

  const handleEmergencyAlert = useCallback(async () => {
    if (!officers || officers.length === 0) {
      showError('No officers available to alert');
      return;
    }

    const onDutyOfficers = officers.filter(o => o && o.status === 'on-duty');
    if (onDutyOfficers.length === 0) {
      showError('No officers on duty to alert');
      return;
    }

    if (!window.confirm(`Send emergency alert to ${onDutyOfficers.length} officer(s)?`)) {
      return;
    }

    showLoading('Sending emergency alert...');
    try {
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      // Update emergency status
      setEmergencyStatus(prev => ({
        ...prev,
        level: 'critical',
        message: 'Emergency alert active',
        lastUpdated: 'Just now',
        activeAlerts: (prev.activeAlerts || 0) + 1
      }));

      showSuccess(`Emergency alert sent to ${onDutyOfficers.length} officer(s)!`);
    } catch (error) {
      showError('Failed to send emergency alert');
    }
  }, [officers]);

  // Form submission handlers
  const handleCreateTemplate = useCallback(async () => {
    // Validation using ValidationService
    const nameValidation = ValidationService.required(templateForm.name, 'Template name');
    if (!nameValidation.valid) {
      showError(nameValidation.error!);
      return;
    }

    const uniqueValidation = ValidationService.uniqueName(
      templateForm.name,
      templates,
      'template',
      editingTemplate?.id
    );
    if (!uniqueValidation.valid) {
      showError(uniqueValidation.error!);
      return;
    }

    const routeValidation = ValidationService.required(templateForm.routeId, 'Route');
    if (!routeValidation.valid) {
      showError('Please select a route');
      return;
    }

    const routeExistsValidation = ValidationService.routeExists(templateForm.routeId, routes);
    if (!routeExistsValidation.valid) {
      showError(routeExistsValidation.error!);
      return;
    }

    const timeValidation = ValidationService.timeRange(
      templateForm.schedule.startTime,
      templateForm.schedule.endTime
    );
    if (!timeValidation.valid) {
      showError(timeValidation.error!);
      return;
    }

    const daysValidation = ValidationService.recurringDays(
      templateForm.schedule.days,
      templateForm.isRecurring
    );
    if (!daysValidation.valid) {
      showError(daysValidation.error!);
      return;
    }

    showLoading(editingTemplate ? 'Updating patrol template...' : 'Creating patrol template...');
    try {
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      if (editingTemplate) {
        // Update using StateUpdateService
        setTemplates(prev => StateUpdateService.updateItem(prev, editingTemplate.id, templateForm));
        setEditingTemplate(null);
        showSuccess('Patrol template updated successfully!');
      } else {
        // Create using IdGeneratorService and StateUpdateService
        const newTemplate: PatrolTemplate = {
          id: IdGeneratorService.generate('template'),
          ...templateForm,
          assignedOfficers: templateForm.assignedOfficers,
          schedule: templateForm.schedule
        };
        setTemplates(prev => StateUpdateService.addItem(prev, newTemplate));
        showSuccess('Patrol template created successfully!');
      }

      setShowCreateTemplate(false);
      setTemplateForm(DEFAULT_TEMPLATE_FORM);
      setAiTemplateSuggestions([]);
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'createTemplate');
      showError('Failed to create patrol template');
      ErrorHandlerService.logError(error, 'handleCreateTemplate');
    }
  }, [templateForm, editingTemplate, templates, routes]);

  const handleCreateRoute = useCallback(async () => {
    // Validation using ValidationService
    const nameValidation = ValidationService.required(routeForm.name, 'Route name');
    if (!nameValidation.valid) {
      showError(nameValidation.error!);
      return;
    }

    const uniqueValidation = ValidationService.uniqueName(
      routeForm.name,
      routes,
      'route',
      editingRoute?.id
    );
    if (!uniqueValidation.valid) {
      showError(uniqueValidation.error!);
      return;
    }

    const durationValidation = ValidationService.required(routeForm.estimatedDuration, 'Estimated duration');
    if (!durationValidation.valid) {
      showError('Please select estimated duration');
      return;
    }

    const formatValidation = ValidationService.durationFormat(routeForm.estimatedDuration);
    if (!formatValidation.valid) {
      showError(formatValidation.error!);
      return;
    }

    showLoading(editingRoute ? 'Updating patrol route...' : 'Creating patrol route...');
    try {
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      if (editingRoute) {
        setRoutes(prev => StateUpdateService.updateItem(prev, editingRoute.id, routeForm));
        setEditingRoute(null);
        showSuccess('Patrol route updated successfully!');
      } else {
        const newRoute: PatrolRoute = {
          id: IdGeneratorService.generate('route'),
          ...routeForm,
          checkpoints: [],
          lastUsed: new Date().toISOString(),
          performanceScore: 0
        };
        setRoutes(prev => StateUpdateService.addItem(prev, newRoute));
        showSuccess('Patrol route created successfully!');
      }

      setShowCreateRoute(false);
      setRouteForm(DEFAULT_ROUTE_FORM);
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'createRoute');
      showError('Failed to create patrol route');
      ErrorHandlerService.logError(error, 'handleCreateRoute');
    }
  }, [routeForm, editingRoute, routes]);

  const handleAddCheckpoint = useCallback(async () => {
    // Validation using ValidationService
    const nameValidation = ValidationService.required(checkpointForm.name, 'Checkpoint name');
    if (!nameValidation.valid) {
      showError(nameValidation.error!);
      return;
    }

    const locationValidation = ValidationService.required(checkpointForm.location, 'Checkpoint location');
    if (!locationValidation.valid) {
      showError(locationValidation.error!);
      return;
    }

    const routeValidation = ValidationService.required(checkpointForm.routeId, 'Route');
    if (!routeValidation.valid) {
      showError('Please select a route');
      return;
    }

    const timeValidation = ValidationService.estimatedTime(
      checkpointForm.estimatedTime,
      ConfigService.MIN_CHECKPOINT_TIME,
      ConfigService.MAX_CHECKPOINT_TIME
    );
    if (!timeValidation.valid) {
      showError(timeValidation.error!);
      return;
    }

    // Validate coordinates if provided
    if (checkpointForm.coordinates.lat !== 0 || checkpointForm.coordinates.lng !== 0) {
      const coordValidation = ValidationService.coordinates(
        checkpointForm.coordinates.lat,
        checkpointForm.coordinates.lng
      );
      if (!coordValidation.valid) {
        showError(coordValidation.error!);
        return;
      }
    }

    const routeExistsValidation = ValidationService.routeExists(checkpointForm.routeId, routes);
    if (!routeExistsValidation.valid) {
      showError(routeExistsValidation.error!);
      return;
    }

    showLoading(editingCheckpoint ? 'Updating checkpoint...' : 'Adding checkpoint...');
    try {
      await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));

      if (editingCheckpoint) {
        // Update existing checkpoint
        setRoutes(prev => prev.map(route => ({
          ...route,
          checkpoints: route.checkpoints.map(cp =>
            cp.id === editingCheckpoint.id
              ? {
                ...cp,
                name: checkpointForm.name,
                location: checkpointForm.location,
                type: checkpointForm.type,
                requiredActions: checkpointForm.requiredActions,
                estimatedTime: checkpointForm.estimatedTime,
                isCritical: checkpointForm.isCritical,
                coordinates: checkpointForm.coordinates
              }
              : cp
          )
        })));
        setEditingCheckpoint(null);
        showSuccess('Checkpoint updated successfully!');
      } else {
        // Add new checkpoint
        const newCheckpoint: Checkpoint = {
          id: IdGeneratorService.generate('checkpoint'),
          name: checkpointForm.name,
          location: checkpointForm.location,
          type: checkpointForm.type,
          requiredActions: checkpointForm.requiredActions,
          estimatedTime: checkpointForm.estimatedTime,
          isCritical: checkpointForm.isCritical,
          coordinates: checkpointForm.coordinates.lat !== 0 && checkpointForm.coordinates.lng !== 0
            ? checkpointForm.coordinates
            : ConfigService.DEFAULT_COORDINATES
        };

        setRoutes(prev => prev.map(route =>
          route.id === checkpointForm.routeId
            ? { ...route, checkpoints: [...route.checkpoints, newCheckpoint] }
            : route
        ));

        setShowAddCheckpoint(false);
        setCheckpointForm(DEFAULT_CHECKPOINT_FORM);
        setEditingCheckpoint(null);
        showSuccess('Checkpoint added successfully!');
      }
    } catch (error) {
      const errorMessage = ErrorHandlerService.handle(error, 'addCheckpoint');
      showError('Failed to add checkpoint');
      ErrorHandlerService.logError(error, 'handleAddCheckpoint');
    }
  }, [checkpointForm, editingCheckpoint, routes]);

  // Tab Content Renderer
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 px-6 pb-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                      <i className="fas fa-route text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">Active Patrols</p>
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.activePatrols}</h3>
                    <p className="text-slate-600 text-sm">Currently in progress</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 px-6 pb-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">ON DUTY</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                      <i className="fas fa-user-shield text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">Officers On Duty</p>
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.onDutyOfficers}</h3>
                    <p className="text-slate-600 text-sm">Out of {metrics.totalOfficers || 0} total</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 px-6 pb-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                      <i className="fas fa-map-marked-alt text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">Active Routes</p>
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.activeRoutes}</h3>
                    <p className="text-slate-600 text-sm">Patrol routes in use</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 px-6 pb-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">SUCCESS</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                      <i className="fas fa-check-double text-white text-xl"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.checkpointCompletionRate ?? 0}%</h3>
                    <p className="text-slate-600 text-sm">Checkpoint success</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, metrics.checkpointCompletionRate ?? 0))}%` }}
                        role="progressbar"
                        aria-valuenow={metrics.checkpointCompletionRate ?? 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Checkpoint completion rate: ${metrics.checkpointCompletionRate ?? 0}%`}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Dashboard Components */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Emergency Status & Weather */}
              <div className="space-y-4">
                {/* Alert Center - Merged Emergency Status & Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                          <i className="fas fa-bell text-white"></i>
                        </div>
                        Alert Center
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                        {alerts ? alerts.filter(alert => alert && !alert.isRead).length : 0} unread
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Emergency Status Level */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                      <div>
                        <div className={`px-3 py-1 rounded text-sm font-medium inline-block ${emergencyStatus.level === 'normal' ? 'bg-green-100 text-green-800' :
                            emergencyStatus.level === 'elevated' ? 'bg-yellow-100 text-yellow-800' :
                              emergencyStatus.level === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {emergencyStatus.level.toUpperCase()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{emergencyStatus.lastUpdated}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">{emergencyStatus.message}</p>
                        {emergencyStatus.activeAlerts > 0 && (
                          <div className="flex items-center justify-end text-red-600 text-xs mt-1">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            {emergencyStatus.activeAlerts} active
                          </div>
                        )}
                      </div>
                    </div>

                    {/* System Status Indicators */}
                    <div className="mb-4 pb-4 border-b">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">System Status</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">GPS Tracking:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-green-700 font-medium">Online</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Radio Comms:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-green-700 font-medium">Active</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Backup Power:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-green-700 font-medium">Ready</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Alerts List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-900">Recent Alerts</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const toastId = showLoading('Prioritizing alerts with AI...');
                            try {
                              const priorities = await patrolAI.prioritizeAlerts(alerts);
                              const sortedAlerts = [...alerts].sort((a, b) => {
                                const aPriority = priorities.find(p => p.alertId === a.id)?.score || 0;
                                const bPriority = priorities.find(p => p.alertId === b.id)?.score || 0;
                                return bPriority - aPriority;
                              });
                              setAlerts(sortedAlerts);
                              dismissLoadingAndShowSuccess(toastId, 'Alerts prioritized by AI');
                            } catch (error) {
                              showError('Failed to prioritize alerts');
                            }
                          }}
                        >
                          <i className="fas fa-brain mr-1"></i>
                          AI Prioritize
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {alerts && alerts.length > 0 ? (
                          alerts.slice(0, 3).map((alert) => {
                            if (!alert) return null;
                            let alertDate: Date;
                            try {
                              alertDate = new Date(alert.timestamp);
                              if (isNaN(alertDate.getTime())) {
                                alertDate = new Date();
                              }
                            } catch {
                              alertDate = new Date();
                            }
                            return (
                              <div key={alert.id} className="flex items-start justify-between p-2 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs ${alert.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                    {alert.message || 'No message'}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {alertDate.toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-2">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${alert.severity === 'critical'
                                      ? 'text-red-800 bg-red-100'
                                      : alert.severity === 'high'
                                        ? 'text-orange-800 bg-orange-100'
                                        : alert.severity === 'medium'
                                          ? 'text-yellow-800 bg-yellow-100'
                                          : 'text-blue-800 bg-blue-100'
                                    }`}>
                                    {alert.severity || 'low'}
                                  </span>
                                  {!alert.isRead && (
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-2">No alerts at this time</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                        <i className="fas fa-cloud-sun text-white"></i>
                      </div>
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
                          <span className={`font-medium ${weather.temperature > 60 && weather.temperature < 85 ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                            {weather.temperature > 60 && weather.temperature < 85 ? 'Optimal' : 'Caution'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Night Visibility:</span>
                          <span className={`font-medium ${weather.visibility === 'Good' ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                            {weather.visibility}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Wind Impact:</span>
                          <span className={`font-medium ${weather.windSpeed < 15 ? 'text-green-700' : 'text-yellow-700'
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
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                          <i className="fas fa-calendar-alt text-white"></i>
                        </div>
                        Today's Patrols
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                          {schedule.filter(item => {
                            if (!item || !item.date) return false;
                            const today = new Date().toISOString().split('T')[0];
                            return item.date === today;
                          }).length} today
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                          {schedule.filter(item => item.status === 'in-progress').length} active
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {schedule && schedule.length > 0 ? (
                        (() => {
                          const today = new Date().toISOString().split('T')[0];
                          const todaySchedule = schedule.filter(item => item && item.date === today);
                          return todaySchedule.length > 0 ? (
                            todaySchedule.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${item.status === 'completed' ? 'bg-green-400' :
                                      item.status === 'in-progress' ? 'bg-blue-400' :
                                        item.status === 'scheduled' ? 'bg-yellow-400' :
                                          'bg-gray-500'
                                    }`}></div>
                                  <div>
                                    <h4 className="font-medium text-slate-900">{item.title || 'Untitled Patrol'}</h4>
                                    <p className="text-sm text-slate-600">
                                      {item.route || 'No route'} • {item.assignedOfficer || 'Unassigned'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Badge 
                                    variant={
                                      item.priority === 'critical' ? 'destructive' :
                                      item.priority === 'high' ? 'warning' :
                                      item.priority === 'medium' ? 'warning' :
                                      'default'
                                    }
                                    size="sm"
                                  >
                                    {item.priority || 'medium'}
                                  </Badge>
                                  <div className="text-right text-sm text-slate-600">
                                    <div>{item.time || 'N/A'}</div>
                                    <div>{item.duration || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <EmptyState
                              icon="fas fa-calendar-times"
                              title="No patrols scheduled for today"
                              description="Schedule patrols to see them here"
                            />
                          );
                        })()
                      ) : (
                        <EmptyState
                          icon="fas fa-calendar-times"
                          title="No schedule data available"
                          description="Schedule data will appear here once available"
                        />
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-900">
                            {schedule.filter(item => {
                              if (!item || !item.date) return false;
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const tomorrowStr = tomorrow.toISOString().split('T')[0];
                              return item.date === tomorrowStr;
                            }).length}
                          </div>
                          <div className="text-xs text-slate-600">Tomorrow's Patrols</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-900">
                            {schedule.filter(item => {
                              if (!item) return false;
                              const today = new Date().toISOString().split('T')[0];
                              return item.status === 'completed' && item.date === today;
                            }).length}
                          </div>
                          <div className="text-xs text-slate-600">Completed Today</div>
                        </div>
                      </div>
                    </div>

                    {/* Average Route Performance Metric */}
                    {routes && routes.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">Average Route Performance:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(
                              routes.reduce((sum, r) => sum + (r.performanceScore ?? 0), 0) / routes.length
                            )}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* AI Schedule Suggestions */}
            {schedule && schedule.length > 0 && routes && routes.length > 0 ? (
              <ScheduleSuggestionsPanel
                schedule={schedule.filter(s => s)}
                incidents={[]}
                routes={routes.filter(r => r)}
                onApplySuggestion={(suggestion) => {
                  if (!suggestion || !suggestion.recommendation) {
                    showError('Invalid suggestion received');
                    return;
                  }
                  showSuccess(`Schedule suggestion applied: ${suggestion.recommendation}`);
                }}
              />
            ) : null}

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-bell text-white"></i>
                    </div>
                    Recent Alerts
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3"
                      onClick={async () => {
                        const toastId = showLoading('Prioritizing alerts with AI...');
                        try {
                          const priorities = await patrolAI.prioritizeAlerts(alerts);
                          const sortedAlerts = [...alerts].sort((a, b) => {
                            const aPriority = priorities.find(p => p.alertId === a.id)?.score || 0;
                            const bPriority = priorities.find(p => p.alertId === b.id)?.score || 0;
                            return bPriority - aPriority;
                          });
                          setAlerts(sortedAlerts);
                          dismissLoadingAndShowSuccess(toastId, 'Alerts prioritized by AI');
                        } catch (error) {
                          showError('Failed to prioritize alerts');
                        }
                      }}
                    >
                      <i className="fas fa-brain mr-1"></i>
                      AI Prioritize
                    </Button>
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                    {alerts ? alerts.filter(alert => alert && !alert.isRead).length : 0} unread
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts && alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert) => {
                      if (!alert) return null;
                      let alertDate: Date;
                      try {
                        alertDate = new Date(alert.timestamp);
                        if (isNaN(alertDate.getTime())) {
                          alertDate = new Date();
                        }
                      } catch {
                        alertDate = new Date();
                      }

                      return (
                        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${alert.isRead ? 'bg-slate-50' : 'bg-blue-50 border border-blue-200'
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-400' :
                                alert.severity === 'high' ? 'bg-orange-400' :
                                  alert.severity === 'medium' ? 'bg-yellow-400' :
                                    'bg-green-400'
                              }`}></div>
                            <div>
                              <p className={`text-sm ${alert.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                {alert.message || 'No message'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {alertDate.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${alert.severity === 'critical'
                                ? 'text-red-800 bg-red-100'
                                : alert.severity === 'high'
                                  ? 'text-orange-800 bg-orange-100'
                                  : alert.severity === 'medium'
                                    ? 'text-yellow-800 bg-yellow-100'
                                    : 'text-blue-800 bg-blue-100'
                              }`}>
                              {alert.severity || 'low'}
                            </span>
                            {!alert.isRead && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon="fas fa-bell-slash"
                      title="No alerts at this time"
                      description="All systems are operating normally"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Link to Officer Deployment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-users text-white"></i>
                    </div>
                    Officer Management
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('deployment')}
                  >
                    View All Officers →
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-sm text-slate-600 mb-4">
                    {officers.length > 0 
                      ? `${officers.filter(o => o.status === 'on-duty').length} of ${officers.length} officers on duty`
                      : 'No officers available'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('deployment')}
                  >
                    <i className="fas fa-user-shield mr-2"></i>
                    Manage Officers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'patrol-management':
        return (
          <div className="space-y-6">
            {/* AI Template Suggestions */}
            {upcomingPatrols && upcomingPatrols.length > 0 && routes && routes.length > 0 ? (
              <TemplateSuggestionsPanel
                patrolHistory={upcomingPatrols.filter(p => p)}
                incidents={[]}
                onCreateTemplate={(suggestion) => {
                  if (!suggestion) {
                    showError('Invalid suggestion received');
                    return;
                  }
                  if (!suggestion.name || !suggestion.name.trim()) {
                    showError('Template name is required');
                    return;
                  }

                  // Find matching route more safely
                  let matchingRoute = null;
                  if (suggestion.suggestedRoute) {
                    const routeKeyword = suggestion.suggestedRoute.split(' ')[0];
                    matchingRoute = routes.find(r => r && r.name && r.name.includes(routeKeyword));
                  }

                  if (!matchingRoute && routes.length > 0) {
                    matchingRoute = routes.find(r => r) || null;
                  }

                  if (!matchingRoute) {
                    showError('No route available for template. Please create a route first.');
                    return;
                  }

                  // Parse time safely
                  const timeParts = suggestion.suggestedTime ? suggestion.suggestedTime.split(' - ') : [];
                  const startTime = timeParts[0] || '18:00';
                  const endTime = timeParts[1] || '22:00';

                  // Validate time range
                  if (startTime >= endTime) {
                    showError('End time must be after start time');
                    return;
                  }

                  setTemplateForm({
                    name: suggestion.name.trim(),
                    description: suggestion.description || '',
                    routeId: matchingRoute.id,
                    assignedOfficers: [],
                    schedule: {
                      startTime: startTime,
                      endTime: endTime,
                      days: suggestion.suggestedDays || []
                    },
                    priority: suggestion.priority || 'medium',
                    isRecurring: true
                  });
                  setShowCreateTemplate(true);
                  showSuccess(`Template "${suggestion.name}" ready to create`);
                }}
              />
            ) : null}

            {/* Patrol Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-file-alt text-white"></i>
                    </div>
                    Patrol Templates
                  </span>
                  <Button
                    onClick={() => setShowCreateTemplate(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates && templates.length > 0 ? (
                    templates.map((template) => {
                      if (!template) return null;
                      const route = routes.find(r => r && r.id === template.routeId);
                      return (
                        <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">{template.name || 'Unnamed Template'}</h3>
                            <p className="text-sm text-slate-600">{template.description || 'No description'}</p>
                            <div className="flex items-center mt-2 space-x-4 flex-wrap gap-2">
                              <span className="text-sm text-slate-600">
                                Route: {route?.name || 'Route not found'}
                              </span>
                              <span className="text-sm text-slate-600">
                                Schedule: {template.schedule?.startTime || 'N/A'} - {template.schedule?.endTime || 'N/A'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${template.priority === 'critical'
                                  ? 'text-red-800 bg-red-100'
                                  : template.priority === 'high'
                                    ? 'text-orange-800 bg-orange-100'
                                    : template.priority === 'medium'
                                      ? 'text-yellow-800 bg-yellow-100'
                                      : 'text-blue-800 bg-blue-100'
                                }`}>
                                {template.priority || 'medium'}
                              </span>
                              <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                                {template.isRecurring ? 'Recurring' : 'One-time'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateForm({
                                  name: template.name || '',
                                  description: template.description || '',
                                  routeId: template.routeId || '',
                                  assignedOfficers: template.assignedOfficers || [],
                                  schedule: template.schedule || { startTime: '', endTime: '', days: [] },
                                  priority: template.priority || 'medium',
                                  isRecurring: template.isRecurring || false
                                });
                                setShowCreateTemplate(true);
                              }}
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!template.schedule?.startTime) {
                                  showError('Template schedule is incomplete');
                                  return;
                                }
                                const route = routes.find(r => r && r.id === template.routeId);
                                const newPatrol = PatrolCreationService.createFromTemplate(template, route);
                                setUpcomingPatrols(prev => StateUpdateService.addItem(prev, newPatrol));
                                showSuccess(`Template "${template.name || 'Untitled'}" executed!`);
                              }}
                            >
                              <i className="fas fa-play mr-1"></i>
                              Execute
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon="fas fa-file-alt"
                      title="No patrol templates created yet"
                      description="Create templates to streamline patrol scheduling"
                    />
                  )}
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
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${patrol.priority === 'critical'
                              ? 'text-red-800 bg-red-100'
                              : patrol.priority === 'high'
                                ? 'text-orange-800 bg-orange-100'
                                : patrol.priority === 'medium'
                                  ? 'text-yellow-800 bg-yellow-100'
                                  : 'text-blue-800 bg-blue-100'
                            }`}>
                            {patrol.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleCompletePatrol(patrol.id)}
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
            {/* AI Officer Matching */}
            {upcomingPatrols && upcomingPatrols.some(p => p && p.status === 'scheduled') && officers && officers.length > 0 ? (
              <OfficerMatchingPanel
                selectedPatrol={(() => {
                  const scheduledPatrol = upcomingPatrols.find(p => p && p.status === 'scheduled');
                  return scheduledPatrol ? {
                    id: scheduledPatrol.id,
                    name: scheduledPatrol.name || 'Unnamed Patrol',
                    location: scheduledPatrol.location || 'Unknown',
                    priority: scheduledPatrol.priority || 'medium',
                    estimatedDuration: scheduledPatrol.duration || '45 min'
                  } : null;
                })()}
                officers={officers
                  .filter(o => o)
                  .map(o => ({
                    ...o,
                    activePatrols: upcomingPatrols.filter(p =>
                      p && p.assignedOfficer === o.name && p.status === 'in-progress'
                    ).length
                  }))}
                onSelectOfficer={(officerId) => {
                  if (!officerId) {
                    showError('Invalid officer ID');
                    return;
                  }
                  const officer = officers.find(o => o && o.id === officerId);
                  const selectedPatrol = upcomingPatrols.find(p => p && p.status === 'scheduled');
                  if (!officer) {
                    showError('Officer not found');
                    return;
                  }
                  if (!selectedPatrol) {
                    showError('No scheduled patrol available');
                    return;
                  }
                  handleDeployOfficer(officerId, selectedPatrol.id);
                  showSuccess(`Officer ${officer.name} deployed via AI recommendation`);
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center text-slate-500">
                    <i className="fas fa-info-circle text-2xl mb-2"></i>
                    <p>No scheduled patrols available for AI matching</p>
                    <p className="text-sm mt-1">Schedule a patrol first to use AI officer matching</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Officer Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {officers && officers.length > 0 ? (
                    officers.map((officer) => {
                      if (!officer) return null;
                      const isDeployed = officer.status === 'on-duty';
                      const hasActivePatrol = upcomingPatrols.some(p =>
                        p.assignedOfficer === officer.name && p.status === 'in-progress'
                      );
                      const nextScheduledPatrol = upcomingPatrols.find(p =>
                        p.assignedOfficer === officer.name && p.status === 'scheduled'
                      );

                      return (
                        <div key={officer.id} className="p-4 border rounded-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-700 to-blue-800 text-white text-xs font-medium">
                                {officer.avatar || '?'}
                              </div>
                            </Avatar>
                            <div>
                              <p className="font-medium">{officer.name || 'Unknown Officer'}</p>
                              <p className="text-sm text-slate-600">{officer.experience || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs px-2 py-1 rounded ${isDeployed ? 'bg-green-100 text-green-800' :
                                  officer.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                                    officer.status === 'off-duty' ? 'bg-slate-100 text-slate-800' :
                                      'bg-red-100 text-red-800'
                                }`}>
                                {officer.status || 'unknown'}
                              </span>
                              {hasActivePatrol && (
                                <span className="text-xs text-blue-600">
                                  <i className="fas fa-route mr-1"></i>
                                  Active Patrol
                                </span>
                              )}
                            </div>
                            {officer.specializations && officer.specializations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {officer.specializations.map((spec, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No specializations listed</p>
                            )}
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (!nextScheduledPatrol) {
                                  showError('No scheduled patrol available for deployment');
                                  return;
                                }
                                handleDeployOfficer(officer.id, nextScheduledPatrol.id);
                              }}
                              disabled={isDeployed || !nextScheduledPatrol}
                            >
                              {isDeployed ? 'Currently Deployed' :
                                !nextScheduledPatrol ? 'No Patrol Available' :
                                  'Deploy Officer'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2">
                      <EmptyState
                        icon="fas fa-user-slash"
                        title="No officers available"
                        description="Add officers to the system to deploy them"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'routes-checkpoints':
        return (
          <div className="space-y-6">
            {/* AI Route Optimization */}
            {routes && routes.length > 0 && routes[0] && routes[0].checkpoints && routes[0].checkpoints.length > 0 ? (
              <RouteOptimizationPanel
                selectedRoute={{
                  id: routes[0].id,
                  name: routes[0].name || 'Unnamed Route',
                  checkpoints: routes[0].checkpoints || [],
                  estimatedDuration: routes[0].estimatedDuration || '45 min',
                  performanceScore: routes[0].performanceScore ?? 0
                }}
                onApplyOptimization={(optimizedSequence) => {
                  if (!optimizedSequence || optimizedSequence.length === 0) {
                    showError('Invalid optimization sequence');
                    return;
                  }
                  showSuccess('Route optimization applied!');
                  // Route optimization logic would update route checkpoint sequence
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-6">
                  <EmptyState
                    icon="fas fa-route"
                    title="No routes available for optimization"
                    description="Create routes to enable AI optimization"
                    action={{
                      label: "Create Route",
                      onClick: () => setShowCreateRoute(true)
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Route Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-route text-white"></i>
                    </div>
                    Patrol Routes
                  </span>
                  <Button
                    onClick={() => setShowCreateRoute(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Route
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes && routes.length > 0 ? (
                    routes.map((route) => {
                      if (!route) return null;
                      return (
                        <div key={route.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-slate-900">{route.name || 'Unnamed Route'}</h3>
                              <p className="text-sm text-slate-600">{route.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-wrap gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${route.difficulty === 'hard'
                                  ? 'text-red-800 bg-red-100'
                                  : route.difficulty === 'medium'
                                    ? 'text-orange-800 bg-orange-100'
                                    : 'text-blue-800 bg-blue-100'
                                }`}>
                                {route.difficulty || 'medium'}
                              </span>
                              <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                                {route.frequency || 'hourly'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${route.isActive
                                  ? 'text-green-800 bg-green-100'
                                  : 'text-slate-800 bg-slate-100'
                                }`}>
                                {route.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="text-sm">
                              <span className="text-slate-600">Duration:</span>
                              <span className="ml-1 font-medium">{route.estimatedDuration || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-600">Checkpoints:</span>
                              <span className="ml-1 font-medium">
                                {route.checkpoints ? route.checkpoints.length : 0}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-slate-600">Performance:</span>
                              <span className="ml-1 font-medium">{route.performanceScore ?? 0}%</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingRoute(route)}
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRoute(route);
                                setRouteForm({
                                  name: route.name || '',
                                  description: route.description || '',
                                  estimatedDuration: route.estimatedDuration || '',
                                  difficulty: route.difficulty || 'medium',
                                  frequency: route.frequency || 'hourly',
                                  isActive: route.isActive ?? true
                                });
                                setShowCreateRoute(true);
                              }}
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit Route
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!route.checkpoints || route.checkpoints.length === 0) {
                                  showError('Cannot start patrol: Route has no checkpoints');
                                  return;
                                }
                                const newPatrol = PatrolCreationService.createFromRoute(route);
                                setUpcomingPatrols(prev => StateUpdateService.addItem(prev, newPatrol));
                                showSuccess(`Patrol started for route "${route.name || 'Unnamed'}"!`);
                              }}
                              disabled={!route.checkpoints || route.checkpoints.length === 0}
                            >
                              <i className="fas fa-play mr-1"></i>
                              Start Patrol
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon="fas fa-route"
                      title="No patrol routes created yet"
                      description="Create routes to organize patrol checkpoints"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Checkpoint Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-map-marker-alt text-white"></i>
                    </div>
                    Checkpoint Management
                  </span>
                  <Button
                    onClick={() => setShowAddCheckpoint(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Checkpoint
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes && routes.length > 0 ? (
                    (() => {
                      const allCheckpoints = routes
                        .filter(route => route && route.checkpoints && route.checkpoints.length > 0)
                        .flatMap(route => route.checkpoints.map(cp => ({ ...cp, routeId: route.id })));

                      return allCheckpoints.length > 0 ? (
                        allCheckpoints.map((checkpoint) => {
                          if (!checkpoint) return null;
                          return (
                            <div key={checkpoint.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <h3 className="font-medium text-slate-900">{checkpoint.name || 'Unnamed Checkpoint'}</h3>
                                <p className="text-sm text-slate-600">{checkpoint.location || 'Location not specified'}</p>
                                <div className="flex items-center mt-2 space-x-4 flex-wrap gap-2">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${checkpoint.type === 'security'
                                      ? 'text-red-800 bg-red-100'
                                      : checkpoint.type === 'safety'
                                        ? 'text-orange-800 bg-orange-100'
                                        : 'text-blue-800 bg-blue-100'
                                    }`}>
                                    {checkpoint.type || 'custom'}
                                  </span>
                                  <span className="text-sm text-slate-600">
                                    Time: {checkpoint.estimatedTime ?? 0} min
                                  </span>
                                  {checkpoint.isCritical && (
                                    <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <p className="text-xs text-slate-500">Required Actions:</p>
                                  {checkpoint.requiredActions && checkpoint.requiredActions.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {checkpoint.requiredActions.map((action, index) => (
                                        <span key={index} className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                                          {action}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 mt-1">No required actions</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewingCheckpoint(checkpoint)}
                                >
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  View Location
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCheckpoint(checkpoint);
                                    const parentRoute = routes.find(route =>
                                      route && route.checkpoints && route.checkpoints.some(cp => cp && cp.id === checkpoint.id)
                                    );
                                    setCheckpointForm({
                                      name: checkpoint.name || '',
                                      location: checkpoint.location || '',
                                      type: checkpoint.type || 'security',
                                      requiredActions: checkpoint.requiredActions || [],
                                      estimatedTime: checkpoint.estimatedTime ?? 5,
                                      isCritical: checkpoint.isCritical || false,
                                      coordinates: checkpoint.coordinates || { lat: 0, lng: 0 },
                                      routeId: parentRoute?.id || ''
                                    });
                                    setShowAddCheckpoint(true);
                                  }}
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Edit
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <EmptyState
                          icon="fas fa-map-marker-alt"
                          title="No checkpoints created yet"
                          description="Add checkpoints to routes for patrol officers"
                        />
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-route text-3xl mb-2"></i>
                      <p>No routes available</p>
                      <p className="text-sm mt-1">Create a route first, then add checkpoints</p>
                    </div>
                  )}
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-cog text-white"></i>
                  </div>
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
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 1) {
                            e.target.value = '1';
                          } else if (value > 20) {
                            e.target.value = '20';
                          }
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">Range: 1-20</p>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-mobile-alt text-white"></i>
                  </div>
                  Mobile App Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.realTimeSync}
                        onChange={(checked) => setSettings(prev => ({ ...prev, realTimeSync: checked }))}
                        label="Real-time Sync"
                        description="Sync patrol data with mobile apps in real-time"
                      />
                      <Toggle
                        checked={settings.offlineMode}
                        onChange={(checked) => setSettings(prev => ({ ...prev, offlineMode: checked }))}
                        label="Offline Mode"
                        description="Allow patrol agents to work offline"
                      />
                      <Toggle
                        checked={settings.autoScheduleUpdates}
                        onChange={(checked) => setSettings(prev => ({ ...prev, autoScheduleUpdates: checked }))}
                        label="Auto-Schedule Updates"
                        description="Automatically update agent schedules"
                      />
                    </div>
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.pushNotifications}
                        onChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                        label="Push Notifications"
                        description="Send notifications to mobile devices"
                      />
                      <Toggle
                        checked={settings.locationTracking}
                        onChange={(checked) => setSettings(prev => ({ ...prev, locationTracking: checked }))}
                        label="Location Tracking"
                        description="Track agent locations during patrols"
                      />
                      <Toggle
                        checked={settings.emergencyAlerts}
                        onChange={(checked) => setSettings(prev => ({ ...prev, emergencyAlerts: checked }))}
                        label="Emergency Alerts"
                        description="Send emergency alerts to all agents"
                      />
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-bell text-white"></i>
                  </div>
                  Alert & Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.checkpointMissedAlert}
                        onChange={(checked) => setSettings(prev => ({ ...prev, checkpointMissedAlert: checked }))}
                        label="Checkpoint Missed Alert"
                        description="Alert when officer misses a checkpoint"
                      />
                      <Toggle
                        checked={settings.emergencyAlert}
                        onChange={(checked) => setSettings(prev => ({ ...prev, emergencyAlert: checked }))}
                        label="Emergency Alert"
                        description="Send alerts to all officers during emergencies"
                      />
                      <Toggle
                        checked={settings.patrolCompletionNotification}
                        onChange={(checked) => setSettings(prev => ({ ...prev, patrolCompletionNotification: checked }))}
                        label="Patrol Completion Notification"
                        description="Notify command center when patrols are completed"
                      />
                    </div>
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.shiftChangeAlerts}
                        onChange={(checked) => setSettings(prev => ({ ...prev, shiftChangeAlerts: checked }))}
                        label="Shift Change Alerts"
                        description="Alert agents about upcoming shift changes"
                      />
                      <Toggle
                        checked={settings.routeDeviationAlert}
                        onChange={(checked) => setSettings(prev => ({ ...prev, routeDeviationAlert: checked }))}
                        label="Route Deviation Alert"
                        description="Alert when agents deviate from assigned routes"
                      />
                      <Toggle
                        checked={settings.systemStatusAlerts}
                        onChange={(checked) => setSettings(prev => ({ ...prev, systemStatusAlerts: checked }))}
                        label="System Status Alerts"
                        description="Alert about system issues or maintenance"
                      />
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
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) {
                              e.target.value = '1';
                            } else if (value > 10) {
                              e.target.value = '10';
                            }
                          }}
                        />
                        <p className="text-xs text-slate-500 mt-1">Range: 1-10</p>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-plug text-white"></i>
                  </div>
                  Integration Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.gpsTracking}
                        onChange={(checked) => setSettings(prev => ({ ...prev, gpsTracking: checked }))}
                        label="GPS Tracking"
                        description="Enable real-time GPS tracking for patrol officers"
                      />
                      <Toggle
                        checked={settings.mobileAppSync}
                        onChange={(checked) => setSettings(prev => ({ ...prev, mobileAppSync: checked }))}
                        label="Mobile App Sync"
                        description="Synchronize patrol data with mobile applications"
                      />
                      <Toggle
                        checked={settings.apiIntegration}
                        onChange={(checked) => setSettings(prev => ({ ...prev, apiIntegration: checked }))}
                        label="API Integration"
                        description="Enable API access for third-party integrations"
                      />
                    </div>
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.databaseSync}
                        onChange={(checked) => setSettings(prev => ({ ...prev, databaseSync: checked }))}
                        label="Database Sync"
                        description="Sync with external databases"
                      />
                      <Toggle
                        checked={settings.webhookSupport}
                        onChange={(checked) => setSettings(prev => ({ ...prev, webhookSupport: checked }))}
                        label="Webhook Support"
                        description="Enable webhook notifications"
                      />
                      <Toggle
                        checked={settings.cloudBackup}
                        onChange={(checked) => setSettings(prev => ({ ...prev, cloudBackup: checked }))}
                        label="Cloud Backup"
                        description="Automatically backup patrol data to cloud"
                      />
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-shield-alt text-white"></i>
                  </div>
                  Security & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.roleBasedAccess}
                        onChange={(checked) => setSettings(prev => ({ ...prev, roleBasedAccess: checked }))}
                        label="Role-Based Access"
                        description="Enable role-based permissions for patrol agents"
                      />
                      <Toggle
                        checked={settings.dataEncryption}
                        onChange={(checked) => setSettings(prev => ({ ...prev, dataEncryption: checked }))}
                        label="Data Encryption"
                        description="Encrypt sensitive patrol data"
                      />
                      <Toggle
                        checked={settings.auditLogging}
                        onChange={(checked) => setSettings(prev => ({ ...prev, auditLogging: checked }))}
                        label="Audit Logging"
                        description="Log all patrol activities for audit"
                      />
                    </div>
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.sessionTimeout}
                        onChange={(checked) => setSettings(prev => ({ ...prev, sessionTimeout: checked }))}
                        label="Session Management"
                        description="Manage agent login sessions"
                      />
                      <Toggle
                        checked={settings.twoFactorAuth}
                        onChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                        label="Two-Factor Auth"
                        description="Require 2FA for agent access"
                      />
                      <Toggle
                        checked={settings.ipWhitelist}
                        onChange={(checked) => setSettings(prev => ({ ...prev, ipWhitelist: checked }))}
                        label="Device Management"
                        description="Manage authorized devices for agents"
                      />
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
                        showLoading('Resetting settings...');
                        setTimeout(() => {
                          showSuccess('Settings reset to defaults');
                          // In a real app, this would reset all form values to defaults
                        }, 1000);
                      }
                    }}
                  >
                    <i className="fas fa-undo mr-2"></i>
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={async () => {
                      showLoading('Saving settings...');
                      try {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, ConfigService.API_TIMEOUT));
                        showSuccess('Settings saved successfully!');
                        // In a real app, this would save all settings to the backend
                      } catch (error) {
                        showError('Failed to save settings. Please try again.');
                      }
                    }}
                  >
                    <i className="fas fa-save mr-2"></i>
                    Save All Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Card>
              <CardContent className="py-12">
                <i className="fas fa-exclamation-triangle text-slate-400 text-4xl mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Tab not found</h3>
                <p className="text-slate-500 mb-4">The requested tab does not exist.</p>
                <Button
                  onClick={() => setActiveTab('dashboard')}
                >
                  <i className="fas fa-home mr-2"></i>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  }, [activeTab, officers, upcomingPatrols, metrics, handleDeployOfficer, handleCompletePatrol, handleEmergencyAlert]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
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
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab.id
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingTemplate ? 'Edit Patrol Template' : 'Create Patrol Template'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateTemplate(false);
                  setEditingTemplate(null);
                  setAiTemplateSuggestions([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* AI Template Suggestions */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-brain text-white text-sm"></i>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">AI Template Suggestions</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!upcomingPatrols || upcomingPatrols.length === 0) {
                      showError('No patrol history available for AI suggestions');
                      return;
                    }
                    setIsLoadingAISuggestions(true);
                    try {
                      const suggestions = await patrolAI.suggestTemplates(
                        upcomingPatrols.filter(p => p),
                        []
                      );
                      if (suggestions && Array.isArray(suggestions)) {
                        setAiTemplateSuggestions(suggestions);
                        if (suggestions.length === 0) {
                          showSuccess('No AI suggestions available at this time');
                        }
                      } else {
                        setAiTemplateSuggestions([]);
                        showError('Invalid suggestions format received');
                      }
                    } catch (error) {
                      showError('Failed to load AI suggestions');
                      setAiTemplateSuggestions([]);
                    } finally {
                      setIsLoadingAISuggestions(false);
                    }
                  }}
                  disabled={isLoadingAISuggestions}
                >
                  <i className={`fas ${isLoadingAISuggestions ? 'fa-spinner fa-spin' : 'fa-magic'} mr-1`}></i>
                  {isLoadingAISuggestions ? 'Loading...' : 'Get Suggestions'}
                </Button>
              </div>

              {aiTemplateSuggestions && aiTemplateSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {aiTemplateSuggestions.map((suggestion, index) => {
                    if (!suggestion) return null;
                    return (
                      <div key={index} className="p-3 bg-white rounded border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{suggestion.name || 'Unnamed Template'}</p>
                            <p className="text-xs text-slate-600 mt-1">{suggestion.description || 'No description'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {suggestion.confidence !== undefined && (
                                <Badge className="badge badge-info text-xs">
                                  {patrolAI.formatConfidence(suggestion.confidence)} confidence
                                </Badge>
                              )}
                              {suggestion.patternCount !== undefined && (
                                <span className="text-xs text-slate-500">
                                  {suggestion.patternCount} similar patrols
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!suggestion || !suggestion.name) {
                                showError('Invalid suggestion');
                                return;
                              }

                              if (!routes || routes.length === 0) {
                                showError('No routes available. Please create a route first.');
                                return;
                              }

                              // Find matching route more safely
                              let matchingRoute = null;
                              if (suggestion.suggestedRoute) {
                                const routeKeyword = suggestion.suggestedRoute.split(' ')[0];
                                matchingRoute = routes.find(r => r && r.name && r.name.includes(routeKeyword));
                              }

                              if (!matchingRoute) {
                                matchingRoute = routes.find(r => r) || null;
                              }

                              if (!matchingRoute) {
                                showError('No route available for template');
                                return;
                              }

                              // Parse time safely
                              const timeParts = suggestion.suggestedTime ? suggestion.suggestedTime.split(' - ') : [];
                              const startTime = timeParts[0] || '18:00';
                              const endTime = timeParts[1] || '22:00';

                              // Validate time range
                              if (startTime >= endTime) {
                                showError('Invalid time range in suggestion');
                                return;
                              }

                              setTemplateForm({
                                name: suggestion.name.trim(),
                                description: suggestion.description || '',
                                routeId: matchingRoute.id,
                                assignedOfficers: [],
                                schedule: {
                                  startTime: startTime,
                                  endTime: endTime,
                                  days: suggestion.suggestedDays || []
                                },
                                priority: suggestion.priority || 'medium',
                                isRecurring: true
                              });
                              showSuccess('AI suggestion applied to form!');
                            }}
                            className="ml-3"
                          >
                            <i className="fas fa-check mr-1"></i>
                            Use
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-600">Click "Get Suggestions" to see AI-recommended templates based on patrol patterns</p>
              )}
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
                {routes && routes.length > 0 ? (
                  <select
                    id="template-route"
                    value={templateForm.routeId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemplateForm(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a route</option>
                    {routes.filter(r => r).map(route => (
                      <option key={route.id} value={route.id}>{route.name || 'Unnamed Route'}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      No routes available. Please create a route first.
                    </p>
                  </div>
                )}
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
              <h2 className="text-xl font-semibold text-slate-900">
                {editingCheckpoint ? 'Edit Checkpoint' : 'Add Checkpoint'}
              </h2>
              <button
                onClick={() => {
                  setShowAddCheckpoint(false);
                  setEditingCheckpoint(null);
                }}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 1) {
                        setCheckpointForm(prev => ({ ...prev, estimatedTime: 1 }));
                      } else if (value > 60) {
                        setCheckpointForm(prev => ({ ...prev, estimatedTime: 60 }));
                      } else {
                        setCheckpointForm(prev => ({ ...prev, estimatedTime: value }));
                      }
                    }}
                    min="1"
                    max="60"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Range: 1-60 minutes</p>
                </div>
              </div>

              <div>
                <label htmlFor="checkpoint-route" className="block text-sm font-medium text-slate-700 mb-2">Assign to Route</label>
                {routes && routes.length > 0 ? (
                  <select
                    id="checkpoint-route"
                    value={checkpointForm.routeId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCheckpointForm(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a route</option>
                    {routes.filter(r => r).map(route => (
                      <option key={route.id} value={route.id}>{route.name || 'Unnamed Route'}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      No routes available. Please create a route first.
                    </p>
                  </div>
                )}
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
              >
                {editingCheckpoint ? 'Update Checkpoint' : 'Add Checkpoint'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Route Details Modal */}
      {viewingRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Route Details: {viewingRoute.name || 'Unnamed Route'}
              </h2>
              <button
                onClick={() => setViewingRoute(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-900">{viewingRoute.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Duration</h3>
                  <p className="text-sm text-slate-900">{viewingRoute.estimatedDuration || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Difficulty</h3>
                  <Badge variant={viewingRoute.difficulty === 'hard' ? 'destructive' : viewingRoute.difficulty === 'medium' ? 'warning' : 'default'}>
                    {viewingRoute.difficulty || 'medium'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Frequency</h3>
                  <p className="text-sm text-slate-900">{viewingRoute.frequency || 'hourly'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Performance Score</h3>
                  <p className="text-sm text-slate-900">{viewingRoute.performanceScore ?? 0}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Checkpoints ({viewingRoute.checkpoints ? viewingRoute.checkpoints.length : 0})
                </h3>
                {viewingRoute.checkpoints && viewingRoute.checkpoints.length > 0 ? (
                  <div className="space-y-2">
                    {viewingRoute.checkpoints.filter(cp => cp).map((checkpoint, index) => (
                      <div key={checkpoint.id || index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {index + 1}. {checkpoint.name || 'Unnamed Checkpoint'}
                            </p>
                            <p className="text-xs text-slate-600">{checkpoint.location || 'Location not specified'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {checkpoint.isCritical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{checkpoint.type || 'custom'}</Badge>
                            <span className="text-xs text-slate-600">{checkpoint.estimatedTime ?? 0} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <i className="fas fa-map-marker-alt text-2xl mb-2"></i>
                    <p className="text-sm">No checkpoints for this route</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setViewingRoute(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Checkpoint Location Modal */}
      {viewingCheckpoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Checkpoint: {viewingCheckpoint.name}</h2>
              <button
                onClick={() => setViewingCheckpoint(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Location</h3>
                <p className="text-sm text-slate-900">{viewingCheckpoint.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Type</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${viewingCheckpoint.type === 'security'
                      ? 'text-red-800 bg-red-100'
                      : viewingCheckpoint.type === 'safety'
                        ? 'text-orange-800 bg-orange-100'
                        : 'text-blue-800 bg-blue-100'
                    }`}>
                    {viewingCheckpoint.type}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Estimated Time</h3>
                  <p className="text-sm text-slate-900">{viewingCheckpoint.estimatedTime} minutes</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Status</h3>
                  {viewingCheckpoint.isCritical ? (
                    <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">
                      Critical
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                      Standard
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Coordinates</h3>
                  <p className="text-sm text-slate-900">
                    {viewingCheckpoint.coordinates.lat.toFixed(4)}, {viewingCheckpoint.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              {viewingCheckpoint.requiredActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Required Actions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingCheckpoint.requiredActions.map((action, index) => (
                      <li key={index} className="text-sm text-slate-900">{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-2">Map Preview</p>
                <div className="h-48 bg-slate-200 rounded flex items-center justify-center">
                  <i className="fas fa-map-marked-alt text-4xl text-slate-400"></i>
                  <p className="ml-3 text-sm text-slate-600">Map view coming soon</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setViewingCheckpoint(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patrols; 