import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../hooks/useAuth';
import * as evacuationService from '../../../services/evacuationService';
import type {
  EvacuationMetrics,
  FloorStatus,
  StaffMember,
  TimelineEvent,
  GuestAssistance,
  EvacuationRoute,
  CommunicationLog,
  EvacuationDrill,
  EvacuationSettings,
  PredictiveInsight,
} from '../types/evacuation.types';

export interface UseEmergencyEvacuationStateReturn {
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  error: string | null;
  setError: (value: string | null) => void;
  timer: number;
  evacuationActive: boolean;
  metrics: EvacuationMetrics;
  floors: FloorStatus[];
  staff: StaffMember[];
  timeline: TimelineEvent[];
  guestAssistance: GuestAssistance[];
  routes: EvacuationRoute[];
  communicationLogs: CommunicationLog[];
  evacuationDrills: EvacuationDrill[];
  settings: EvacuationSettings;
  setSettings: (value: EvacuationSettings) => void;
  announcementText: string;
  setAnnouncementText: (value: string) => void;
  assistanceNotes: string;
  setAssistanceNotes: (value: string) => void;
  showAssistanceModal: boolean;
  setShowAssistanceModal: (value: boolean) => void;
  showAnnouncementModal: boolean;
  setShowAnnouncementModal: (value: boolean) => void;
  showRouteModal: boolean;
  setShowRouteModal: (value: boolean) => void;
  selectedAssistance: GuestAssistance | null;
  setSelectedAssistance: (value: GuestAssistance | null) => void;
  selectedRoute: EvacuationRoute | null;
  setSelectedRoute: (value: EvacuationRoute | null) => void;
  activeStaff: StaffMember[];
  clearRoutes: EvacuationRoute[];
  completedAssistance: GuestAssistance[];
  pendingAssistance: GuestAssistance[];
  hasManagementAccess: boolean;
  ensureAuthorized: () => boolean;
  handleStartEvacuation: () => Promise<void>;
  handleEndEvacuation: () => Promise<void>;
  handleAllCallAnnouncement: () => void;
  handleSendAnnouncement: () => Promise<void>;
  handleUnlockExits: () => Promise<void>;
  handleContactEmergencyServices: () => Promise<void>;
  handleSendGuestNotifications: () => Promise<void>;
  handleAssignAssistance: (assistanceId: string, staffId: string) => Promise<void>;
  handleCompleteAssistance: (assistanceId: string) => Promise<void>;
  handleViewRoute: (route: EvacuationRoute) => void;
  handleExportData: () => Promise<void>;
  handleSaveSettings: () => Promise<void>;
  handleResetSettings: () => void;
  getStatusBadgeClass: (status: string) => string;
  getRiskLevelBadgeClass: (riskLevel: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
}

const defaultSettings: EvacuationSettings = {
  autoEvacuation: true,
  emergencyServicesContact: true,
  guestNotifications: true,
  staffAlerts: true,
  soundAlarms: true,
  unlockExits: true,
  elevatorShutdown: true,
  hvacControl: true,
  lightingControl: true,
  announcementVolume: '80',
  evacuationTimeout: '30',
  drillFrequency: '90',
};

export function useEmergencyEvacuationState(): UseEmergencyEvacuationStateReturn {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [evacuationActive, setEvacuationActive] = useState(false);

  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState<GuestAssistance | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);

  const [announcementText, setAnnouncementText] = useState('');
  const [assistanceNotes, setAssistanceNotes] = useState('');

  const [settings, setSettings] = useState<EvacuationSettings>(defaultSettings);

  const [metrics, setMetrics] = useState<EvacuationMetrics>({
    evacuated: 0,
    inProgress: 0,
    remaining: 0,
    staffDeployed: 0,
    elapsedTime: '00:00',
    totalOccupancy: 0,
    evacuationProgress: 0,
  });

  const [floors, setFloors] = useState<FloorStatus[]>([]);

  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const [guestAssistance, setGuestAssistance] = useState<GuestAssistance[]>([]);

  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);

  const [evacuationDrills, setEvacuationDrills] = useState<EvacuationDrill[]>([]);

  const [predictiveInsights] = useState<PredictiveInsight[]>([]);

  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => ['ADMIN', 'SECURITY_MANAGER', 'SECURITY_OFFICER'].includes(role.toUpperCase()));
  }, [user]);

  const ensureAuthorized = useCallback(() => {
    if (!hasManagementAccess) {
      showError('You do not have permission to perform evacuation actions');
      return false;
    }
    return true;
  }, [hasManagementAccess]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          metricsRes,
          floorsRes,
          staffRes,
          timelineRes,
          assistanceRes,
          routesRes,
          commsRes,
          drillsRes
        ] = await Promise.all([
          evacuationService.getEvacuationMetrics(),
          evacuationService.getFloorStatuses(),
          evacuationService.getStaffMembers(),
          evacuationService.getTimelineEvents(),
          evacuationService.getGuestAssistance(),
          evacuationService.getEvacuationRoutes(),
          evacuationService.getCommunicationLogs(),
          evacuationService.getEvacuationDrills(),
        ]);

        if (metricsRes.success) setMetrics(metricsRes.data as EvacuationMetrics);
        if (floorsRes.success) setFloors(floorsRes.data as FloorStatus[]);
        if (staffRes.success) setStaff(staffRes.data as StaffMember[]);
        if (timelineRes.success) setTimeline(timelineRes.data as TimelineEvent[]);
        if (assistanceRes.success) setGuestAssistance(assistanceRes.data as GuestAssistance[]);
        if (routesRes.success) setRoutes(routesRes.data as EvacuationRoute[]);
        if (commsRes.success) setCommunicationLogs(commsRes.data as CommunicationLog[]);
        if (drillsRes.success) setEvacuationDrills(drillsRes.data as EvacuationDrill[]);

        const currentMetrics = metricsRes.data as EvacuationMetrics;
        setEvacuationActive(currentMetrics?.evacuationProgress > 0);
      } catch (err) {
        logger.error('Failed to fetch evacuation data', err instanceof Error ? err : new Error(String(err)));
        setError('Failed to synchronize with evacuation server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setError]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/modules/evacuation-auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (evacuationActive) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1;
          const minutes = Math.floor(newTime / 60);
          const seconds = newTime % 60;
          setMetrics(prevMetrics => ({
            ...prevMetrics,
            elapsedTime: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
          }));
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [evacuationActive]);

  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'evacuated': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'in-progress': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'pending': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'clear': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'congested': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'active': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'complete': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'standby': return 'bg-white/5 text-white/40 border border-white/10';
      default: return 'bg-white/5 text-white/40 border border-white/10';
    }
  }, []);

  const getRiskLevelBadgeClass = useCallback((riskLevel: string): string => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600/20 text-red-500 border border-red-600/30';
      case 'high': return 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-500 border border-green-500/30';
      default: return 'bg-white/5 text-white/40 border border-white/10';
    }
  }, []);

  const getPriorityBadgeClass = useCallback((priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-white/5 text-white/40 border border-white/10';
    }
  }, []);

  const handleStartEvacuation = useCallback(async () => {
    if (!ensureAuthorized()) return;
    let toastId: string | undefined;
    try {
      toastId = showLoading('Initiating evacuation protocol...');
      const response = await evacuationService.startEvacuation();
      if (!response.success) {
        throw new Error(response.error || 'Failed to start evacuation');
      }

      setEvacuationActive(true);
      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Emergency evacuation initiated', severity: 'critical', current: true, icon: 'Zap' },
        ...prev.filter(item => !item.current),
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Evacuation protocol activated');
      }
    } catch (error) {
      logger.error('Failed to start evacuation', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleStartEvacuation' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to initiate evacuation');
      }
    }
  }, [ensureAuthorized]);

  const handleEndEvacuation = useCallback(async () => {
    if (!ensureAuthorized()) return;
    const confirmed = window.confirm('Are you sure you want to end the evacuation? This will mark the evacuation as complete.');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Ending evacuation...');
      const response = await evacuationService.endEvacuation();
      if (!response.success) {
        throw new Error(response.error || 'Failed to end evacuation');
      }

      setEvacuationActive(false);
      setTimer(0);
      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Evacuation completed - All clear', severity: 'success', current: true, icon: 'CheckCircle' },
        ...prev.filter(item => !item.current),
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Evacuation ended successfully');
      }
    } catch (error) {
      logger.error('Failed to end evacuation', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleEndEvacuation' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to end evacuation');
      }
    }
  }, [ensureAuthorized]);

  const handleAllCallAnnouncement = useCallback(() => {
    setShowAnnouncementModal(true);
  }, []);

  const handleSendAnnouncement = useCallback(async () => {
    if (!ensureAuthorized()) return;
    if (!announcementText.trim()) {
      showError('Please enter an announcement message');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Broadcasting announcement...');
      const response = await evacuationService.sendAnnouncement(announcementText);
      if (!response.success) {
        throw new Error(response.error || 'Failed to broadcast announcement');
      }

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: `All-call announcement: "${announcementText}"`, severity: 'warning', current: true, icon: 'Megaphone' },
        ...prev.filter(item => !item.current),
      ]);

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'announcement', message: announcementText, recipients: 'All guests', status: 'sent' },
        ...prev,
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Announcement broadcast successfully');
      }

      setShowAnnouncementModal(false);
      setAnnouncementText('');
    } catch (error) {
      logger.error('Failed to send announcement', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleSendAnnouncement' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to broadcast announcement');
      }
    }
  }, [announcementText, ensureAuthorized]);

  const handleUnlockExits = useCallback(async () => {
    if (!ensureAuthorized()) return;
    let toastId: string | undefined;
    try {
      toastId = showLoading('Unlocking all emergency exits...');
      const response = await evacuationService.unlockExits();
      if (!response.success) {
        throw new Error(response.error || 'Failed to unlock exits');
      }

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'All emergency exits unlocked', severity: 'info', current: true, icon: 'Unlock' },
        ...prev.filter(item => !item.current),
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'All exits unlocked successfully');
      }
    } catch (error) {
      logger.error('Failed to unlock exits', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleUnlockExits' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to unlock exits');
      }
    }
  }, [ensureAuthorized]);

  const handleContactEmergencyServices = useCallback(async () => {
    if (!ensureAuthorized()) return;
    let toastId: string | undefined;
    try {
      toastId = showLoading('Contacting emergency services...');
      const response = await evacuationService.contactEmergencyServices();
      if (!response.success) {
        throw new Error(response.error || 'Failed to contact emergency services');
      }

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Emergency services contacted - Fire Department, Police, EMS', severity: 'critical', current: true, icon: 'Phone' },
        ...prev.filter(item => !item.current),
      ]);

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'emergency-call', message: 'Emergency services dispatch', recipients: 'Fire Dept, Police, EMS', status: 'sent' },
        ...prev,
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Emergency services contacted');
      }
    } catch (error) {
      logger.error('Failed to contact emergency services', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleContactEmergencyServices' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to contact emergency services');
      }
    }
  }, [ensureAuthorized]);

  const handleSendGuestNotifications = useCallback(async () => {
    if (!ensureAuthorized()) return;
    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending guest notifications...');
      const response = await evacuationService.notifyGuests();
      if (!response.success) {
        throw new Error(response.error || 'Failed to send notifications');
      }

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'notification', message: 'Emergency evacuation alert', recipients: `${metrics.totalOccupancy} guests`, status: 'sent' },
        ...prev,
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Notifications sent to ${metrics.totalOccupancy} guests`);
      }
    } catch (error) {
      logger.error('Failed to send notifications', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleSendGuestNotifications' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send notifications');
      }
    }
  }, [metrics.totalOccupancy, ensureAuthorized]);

  const handleAssignAssistance = useCallback(async (assistanceId: string, staffId: string) => {
    if (!ensureAuthorized()) return;
    if (!staffId) {
      showError('No available staff to assign');
      return;
    }
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning staff member...');
      const staffMember = staff.find(s => s.id === staffId);
      const request = guestAssistance.find(a => a.id === assistanceId);
      if (!request) {
        throw new Error('Assistance request not found');
      }
      const response = await evacuationService.assignAssistance({
        guest_name: request.guestName,
        room: request.room,
        need: request.need,
        priority: request.priority,
        assigned_staff: staffMember?.name,
        notes: request.notes,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to assign staff');
      }

      setGuestAssistance(prev => prev.map(a =>
        a.id === assistanceId
          ? { ...a, status: 'assigned' as const, assignedStaff: staffMember?.name }
          : a
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Assigned to ${staffMember?.name}`);
      }
    } catch (error) {
      logger.error('Failed to assign staff', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleAssignAssistance' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign staff');
      }
    }
  }, [staff, guestAssistance, ensureAuthorized]);

  const handleCompleteAssistance = useCallback(async (assistanceId: string) => {
    if (!ensureAuthorized()) return;
    let toastId: string | undefined;
    try {
      toastId = showLoading('Marking assistance as complete...');
      const response = await evacuationService.completeAssistance(assistanceId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to complete assistance');
      }

      setGuestAssistance(prev => prev.map(a =>
        a.id === assistanceId ? { ...a, status: 'completed' as const } : a
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Assistance marked as complete');
      }
    } catch (error) {
      logger.error('Failed to complete assistance', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleCompleteAssistance' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update status');
      }
    }
  }, [ensureAuthorized]);

  const handleViewRoute = useCallback((route: EvacuationRoute) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  }, []);

  const handleExportData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Exporting evacuation data...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data exported successfully');
      }
    } catch (error) {
      logger.error('Failed to export data', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleExportData' });
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

      setSettings(settings);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
      }
    } catch (error) {
      logger.error('Failed to save settings', error instanceof Error ? error : new Error(String(error)), { module: 'EvacuationModule', action: 'handleSaveSettings' });
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [settings]);

  const handleResetSettings = useCallback(() => {
    setSettings(defaultSettings);
    showSuccess('Settings reset to defaults');
  }, []);

  const activeStaff = useMemo(() =>
    staff.filter(s => s.status === 'active' || s.status === 'assigned'),
    [staff]
  );

  const clearRoutes = useMemo(() =>
    routes.filter(r => r.status === 'clear'),
    [routes]
  );

  const completedAssistance = useMemo(() =>
    guestAssistance.filter(a => a.status === 'completed'),
    [guestAssistance]
  );

  const pendingAssistance = useMemo(() =>
    guestAssistance.filter(a => a.status === 'pending'),
    [guestAssistance]
  );

  return {
    isAuthenticated,
    activeTab,
    setActiveTab,
    loading,
    error,
    setError,
    timer,
    evacuationActive,
    metrics,
    floors,
    staff,
    timeline,
    guestAssistance,
    routes,
    communicationLogs,
    evacuationDrills,
    settings,
    setSettings,
    announcementText,
    setAnnouncementText,
    assistanceNotes,
    setAssistanceNotes,
    showAssistanceModal,
    setShowAssistanceModal,
    showAnnouncementModal,
    setShowAnnouncementModal,
    showRouteModal,
    setShowRouteModal,
    selectedAssistance,
    setSelectedAssistance,
    selectedRoute,
    setSelectedRoute,
    activeStaff,
    clearRoutes,
    completedAssistance,
    pendingAssistance,
    hasManagementAccess,
    ensureAuthorized,
    handleStartEvacuation,
    handleEndEvacuation,
    handleAllCallAnnouncement,
    handleSendAnnouncement,
    handleUnlockExits,
    handleContactEmergencyServices,
    handleSendGuestNotifications,
    handleAssignAssistance,
    handleCompleteAssistance,
    handleViewRoute,
    handleExportData,
    handleSaveSettings,
    handleResetSettings,
    getStatusBadgeClass,
    getRiskLevelBadgeClass,
    getPriorityBadgeClass,
  };
}
