import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Users, Activity, Clock, Shield, Zap,
  MapPin, Bell, BellOff, Phone, Radio, TrendingUp, BarChart3,
  FileText, Download, Settings as SettingsIcon, Play, StopCircle,
  Unlock, Volume2, CheckCircle, XCircle, Eye, UserCheck,
  Navigation, Route, AlertCircle, Megaphone, Building, X,
  ChevronRight, Wifi, Target, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Progress } from '../../components/UI/Progress';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';

// TypeScript Interfaces
interface EvacuationMetrics {
  evacuated: number;
  inProgress: number;
  remaining: number;
  staffDeployed: number;
  elapsedTime: string;
  totalOccupancy: number;
  evacuationProgress: number;
}

interface FloorStatus {
  id: string;
  name: string;
  description: string;
  guestCount: number;
  progress: number;
  status: 'evacuated' | 'in-progress' | 'pending';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  assignedStaff: number;
  exitRoute: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'complete' | 'assigned' | 'standby';
  location: string;
  avatar: string;
  assignedFloor?: string;
  guestsAssisted: number;
}

interface TimelineEvent {
  id: string;
  time: string;
  content: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  current?: boolean;
  icon?: string;
}

interface GuestAssistance {
  id: string;
  room: string;
  guestName: string;
  need: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'completed';
  assignedStaff?: string;
  notes?: string;
}

interface EvacuationRoute {
  id: string;
  name: string;
  status: 'clear' | 'congested' | 'blocked';
  description: string;
  capacity: number;
  currentOccupancy: number;
  floors: string[];
  estimatedTime: string;
}

interface CommunicationLog {
  id: string;
  timestamp: string;
  type: 'announcement' | 'notification' | 'emergency-call' | 'radio';
  message: string;
  recipients: string;
  status: 'sent' | 'pending' | 'failed';
}

interface EvacuationDrill {
  id: string;
  date: string;
  duration: string;
  participationRate: number;
  issues: number;
  score: number;
  status: 'completed' | 'in-progress' | 'scheduled';
}

const EvacuationModule: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [evacuationActive, setEvacuationActive] = useState(false);
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState<GuestAssistance | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);
  
  // Form states
  const [announcementText, setAnnouncementText] = useState('');
  const [assistanceNotes, setAssistanceNotes] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
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
    drillFrequency: '90'
  });

  const [settingsForm, setSettingsForm] = useState(settings);

  // State for evacuation data
  const [metrics, setMetrics] = useState<EvacuationMetrics>({
    evacuated: 247,
    inProgress: 89,
    remaining: 556,
    staffDeployed: 12,
    elapsedTime: '00:00',
    totalOccupancy: 892,
    evacuationProgress: 28
  });

  const [floors, setFloors] = useState<FloorStatus[]>([
    {
      id: 'ground',
      name: 'Ground Floor',
      description: 'Lobby, Restaurant, Reception',
      guestCount: 156,
      progress: 100,
      status: 'evacuated',
      riskLevel: 'low',
      assignedStaff: 3,
      exitRoute: 'Main Entrance'
    },
    {
      id: 'floors-2-5',
      name: 'Floors 2-5',
      description: 'Guest Rooms (320 guests)',
      guestCount: 320,
      progress: 80,
      status: 'in-progress',
      riskLevel: 'medium',
      assignedStaff: 4,
      exitRoute: 'Stairwell A, B'
    },
    {
      id: 'floors-6-10',
      name: 'Floors 6-10',
      description: 'Guest Rooms (572 guests)',
      guestCount: 572,
      progress: 60,
      status: 'in-progress',
      riskLevel: 'high',
      assignedStaff: 5,
      exitRoute: 'Stairwell A, C'
    },
    {
      id: 'penthouse',
      name: 'Penthouse',
      description: 'Suites (44 guests)',
      guestCount: 44,
      progress: 0,
      status: 'pending',
      riskLevel: 'critical',
      assignedStaff: 2,
      exitRoute: 'Stairwell C'
    }
  ]);

  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'Sarah Miller', role: 'Floor Supervisor', status: 'active', location: 'Floor 3', avatar: 'SM', assignedFloor: 'Floors 2-5', guestsAssisted: 45 },
    { id: '2', name: 'James Davis', role: 'Stairwell Guide', status: 'active', location: 'Stairwell A', avatar: 'JD', guestsAssisted: 78 },
    { id: '3', name: 'Lisa Wang', role: 'Assembly Coordinator', status: 'complete', location: 'Ground Floor', avatar: 'LW', guestsAssisted: 156 },
    { id: '4', name: 'Mike Rodriguez', role: 'Accessibility Support', status: 'assigned', location: 'Floor 4', avatar: 'MR', assignedFloor: 'Floors 2-5', guestsAssisted: 12 },
    { id: '5', name: 'Emma Chen', role: 'Floor Supervisor', status: 'active', location: 'Floor 7', avatar: 'EC', assignedFloor: 'Floors 6-10', guestsAssisted: 38 },
    { id: '6', name: 'David Kim', role: 'Emergency Coordinator', status: 'active', location: 'Command Center', avatar: 'DK', guestsAssisted: 0 }
  ]);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: '1', time: '04:32 ago', content: 'Fire alarm triggered - Floor 11 East Wing', severity: 'critical', icon: 'AlertTriangle' },
    { id: '2', time: '04:28 ago', content: 'Automatic evacuation protocol initiated', severity: 'critical', icon: 'Zap' },
    { id: '3', time: '04:25 ago', content: 'Emergency services contacted - ETA 2 minutes', severity: 'critical', icon: 'Phone' },
    { id: '4', time: '04:20 ago', content: 'Staff deployment commenced', severity: 'warning', icon: 'Users' },
    { id: '5', time: '03:45 ago', content: 'Ground floor evacuation completed', severity: 'success', icon: 'CheckCircle' },
    { id: '6', time: 'Now', content: 'Floors 2-10 evacuation in progress', severity: 'warning', current: true, icon: 'Activity' }
  ]);

  const [guestAssistance, setGuestAssistance] = useState<GuestAssistance[]>([
    { id: '1', room: 'Room 318', guestName: 'John Smith', need: 'Wheelchair user', priority: 'high', status: 'pending' },
    { id: '2', room: 'Room 425', guestName: 'Mary Johnson', need: 'Elderly guest, slow mobility', priority: 'medium', status: 'assigned', assignedStaff: 'Mike Rodriguez' },
    { id: '3', room: 'Room 567', guestName: 'The Martinez Family', need: 'Family with infant', priority: 'medium', status: 'pending' },
    { id: '4', room: 'Room 894', guestName: 'Robert Lee', need: 'Hearing impaired', priority: 'high', status: 'pending' },
    { id: '5', room: 'Room 1023', guestName: 'Susan Davis', need: 'Visually impaired', priority: 'high', status: 'pending' },
    { id: '6', room: 'Room 732', guestName: 'Tom Wilson', need: 'Medical equipment', priority: 'high', status: 'assigned', assignedStaff: 'Sarah Miller' }
  ]);

  const [routes, setRoutes] = useState<EvacuationRoute[]>([
    { 
      id: 'stairwell-a', 
      name: 'Stairwell A - North', 
      status: 'clear', 
      description: 'Clear - Normal flow', 
      capacity: 100, 
      currentOccupancy: 45,
      floors: ['Ground', 'Floors 1-10'],
      estimatedTime: '3-5 min'
    },
    { 
      id: 'stairwell-b', 
      name: 'Stairwell B - Central', 
      status: 'congested', 
      description: 'Congested - Slow', 
      capacity: 100, 
      currentOccupancy: 85,
      floors: ['Ground', 'Floors 1-10'],
      estimatedTime: '6-8 min'
    },
    { 
      id: 'stairwell-c', 
      name: 'Stairwell C - South', 
      status: 'blocked', 
      description: 'Blocked - Fire zone', 
      capacity: 100, 
      currentOccupancy: 0,
      floors: ['Ground', 'Floors 1-10'],
      estimatedTime: 'N/A'
    },
    { 
      id: 'emergency-exit', 
      name: 'Emergency Exit - East', 
      status: 'clear', 
      description: 'Clear - Direct route', 
      capacity: 50, 
      currentOccupancy: 20,
      floors: ['Ground', 'Floors 1-5'],
      estimatedTime: '2-3 min'
    }
  ]);

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([
    { id: '1', timestamp: '04:28', type: 'announcement', message: 'All-call evacuation announcement', recipients: 'All guests', status: 'sent' },
    { id: '2', timestamp: '04:25', type: 'emergency-call', message: 'Emergency services dispatch', recipients: 'Fire Department', status: 'sent' },
    { id: '3', timestamp: '04:22', type: 'notification', message: 'Guest mobile app alerts', recipients: '847 guests', status: 'sent' },
    { id: '4', timestamp: '04:20', type: 'radio', message: 'Staff coordination channel active', recipients: 'All staff', status: 'sent' }
  ]);

  const [evacuationDrills, setEvacuationDrills] = useState<EvacuationDrill[]>([
    { id: '1', date: '2025-01-15', duration: '12:34', participationRate: 94, issues: 2, score: 92, status: 'completed' },
    { id: '2', date: '2024-10-22', duration: '14:21', participationRate: 89, issues: 5, score: 85, status: 'completed' },
    { id: '3', date: '2024-07-18', duration: '11:45', participationRate: 96, issues: 1, score: 95, status: 'completed' }
  ]);

  // Authentication check
  useEffect(() => {
    const isAuth = localStorage.getItem('evacuationAuth');
    if (!isAuth) {
      setAuthenticated(false);
      navigate('/modules/evacuation-auth');
    } else {
      setAuthenticated(true);
    }
  }, [navigate]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (evacuationActive) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1;
          const minutes = Math.floor(newTime / 60);
          const seconds = newTime % 60;
          setMetrics(prev => ({
            ...prev,
            elapsedTime: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          }));
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [evacuationActive]);

  // Sync settings form when modal opens
  useEffect(() => {
    if (showSettingsModal) {
      setSettingsForm(settings);
    }
  }, [showSettingsModal, settings]);

  // Handlers with comprehensive error handling and toast notifications
  const handleStartEvacuation = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Initiating evacuation protocol...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEvacuationActive(true);
      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Emergency evacuation initiated', severity: 'critical', current: true, icon: 'Zap' },
        ...prev.filter(item => !item.current)
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Evacuation protocol activated');
      }
    } catch (error) {
      console.error('Failed to start evacuation:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to initiate evacuation');
      }
    }
  }, []);

  const handleEndEvacuation = useCallback(async () => {
    const confirmed = window.confirm('Are you sure you want to end the evacuation? This will mark the evacuation as complete.');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Ending evacuation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEvacuationActive(false);
      setTimer(0);
      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Evacuation completed - All clear', severity: 'success', current: true, icon: 'CheckCircle' },
        ...prev.filter(item => !item.current)
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Evacuation ended successfully');
      }
    } catch (error) {
      console.error('Failed to end evacuation:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to end evacuation');
      }
    }
  }, []);

  const handleAllCallAnnouncement = useCallback(async () => {
    setShowAnnouncementModal(true);
  }, []);

  const handleSendAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) {
      showError('Please enter an announcement message');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Broadcasting announcement...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: `All-call announcement: "${announcementText}"`, severity: 'warning', current: true, icon: 'Megaphone' },
        ...prev.filter(item => !item.current)
      ]);

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'announcement', message: announcementText, recipients: 'All guests', status: 'sent' },
        ...prev
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Announcement broadcast successfully');
      }

      setShowAnnouncementModal(false);
      setAnnouncementText('');
    } catch (error) {
      console.error('Failed to send announcement:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to broadcast announcement');
      }
    }
  }, [announcementText]);

  const handleUnlockExits = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Unlocking all emergency exits...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'All emergency exits unlocked', severity: 'info', current: true, icon: 'Unlock' },
        ...prev.filter(item => !item.current)
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'All exits unlocked successfully');
      }
    } catch (error) {
      console.error('Failed to unlock exits:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to unlock exits');
      }
    }
  }, []);

  const handleContactEmergencyServices = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Contacting emergency services...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setTimeline(prev => [
        { id: Date.now().toString(), time: 'Now', content: 'Emergency services contacted - Fire Department, Police, EMS', severity: 'critical', current: true, icon: 'Phone' },
        ...prev.filter(item => !item.current)
      ]);

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'emergency-call', message: 'Emergency services dispatch', recipients: 'Fire Dept, Police, EMS', status: 'sent' },
        ...prev
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Emergency services contacted');
      }
    } catch (error) {
      console.error('Failed to contact emergency services:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to contact emergency services');
      }
    }
  }, []);

  const handleSendGuestNotifications = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending guest notifications...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCommunicationLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'notification', message: 'Emergency evacuation alert', recipients: `${metrics.totalOccupancy} guests`, status: 'sent' },
        ...prev
      ]);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Notifications sent to ${metrics.totalOccupancy} guests`);
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send notifications');
      }
    }
  }, [metrics.totalOccupancy]);

  const handleAssignAssistance = useCallback(async (assistanceId: string, staffId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning staff member...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const staffMember = staff.find(s => s.id === staffId);
      setGuestAssistance(prev => prev.map(a => 
        a.id === assistanceId 
          ? { ...a, status: 'assigned' as const, assignedStaff: staffMember?.name } 
          : a
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Assigned to ${staffMember?.name}`);
      }
    } catch (error) {
      console.error('Failed to assign staff:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign staff');
      }
    }
  }, [staff]);

  const handleCompleteAssistance = useCallback(async (assistanceId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Marking assistance as complete...');
      await new Promise(resolve => setTimeout(resolve, 600));

      setGuestAssistance(prev => prev.map(a => 
        a.id === assistanceId ? { ...a, status: 'completed' as const } : a
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Assistance marked as complete');
      }
    } catch (error) {
      console.error('Failed to complete assistance:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update status');
      }
    }
  }, []);

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
      drillFrequency: '90'
    };
    setSettingsForm(defaultSettings);
    showSuccess('Settings reset to defaults');
  }, []);

  // Computed values with useMemo
  const pendingAssistance = useMemo(() => 
    guestAssistance.filter(a => a.status === 'pending'),
    [guestAssistance]
  );

  const assignedAssistance = useMemo(() => 
    guestAssistance.filter(a => a.status === 'assigned'),
    [guestAssistance]
  );

  const completedAssistance = useMemo(() => 
    guestAssistance.filter(a => a.status === 'completed'),
    [guestAssistance]
  );

  const activeStaff = useMemo(() => 
    staff.filter(s => s.status === 'active' || s.status === 'assigned'),
    [staff]
  );

  const clearRoutes = useMemo(() => 
    routes.filter(r => r.status === 'clear'),
    [routes]
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full backdrop-blur-xl bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-slate-900">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-center">Please authenticate to access the emergency evacuation controls.</p>
            <Button 
              onClick={() => navigate('/modules/evacuation-auth')}
              className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
            >
              Go to Authentication
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Action Buttons - FAR RIGHT CORNER */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex items-center space-x-3">
          {!evacuationActive ? (
            <Button
              onClick={handleStartEvacuation}
              disabled={loading}
              className="bg-[#2563eb] hover:bg-blue-700 text-white shadow-lg"
            >
              <Play size={16} className="mr-2" />
              Start Evacuation
            </Button>
          ) : (
            <Button
              onClick={handleEndEvacuation}
              disabled={loading}
              variant="outline"
              className="text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              <StopCircle size={16} className="mr-2" />
              End Evacuation
            </Button>
          )}
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-exclamation-triangle text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={12} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Emergency Evacuation
              </h1>
              <p className="text-slate-600 font-medium">
                Real-time evacuation management and emergency response coordination
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
            {['overview', 'active', 'communication', 'analytics', 'predictive', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {tab === 'active' ? 'Active Evacuation' : 
                 tab === 'predictive' ? 'Predictive Intel' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="p-6 max-w-[1400px] mx-auto">

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl backdrop-blur-sm">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* GOLD STANDARD METRICS GRID - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Evacuated */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="text-white" size={24} />
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">Safe</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{metrics.evacuated}</h3>
              <p className="text-slate-600 text-sm">Evacuated</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="text-white" size={24} />
              </div>
              <Badge variant="warning" className="animate-pulse">Active</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{metrics.inProgress}</h3>
              <p className="text-slate-600 text-sm">In Progress</p>
            </div>
          </CardContent>
        </Card>

        {/* Remaining */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="text-white" size={24} />
              </div>
              <Badge variant="destructive" className="animate-pulse">Priority</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{metrics.remaining}</h3>
              <p className="text-slate-600 text-sm">Remaining</p>
            </div>
          </CardContent>
        </Card>

        {/* Staff Deployed */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="text-white" size={24} />
              </div>
              <Badge variant="default">Deployed</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{metrics.staffDeployed}</h3>
              <p className="text-slate-600 text-sm">Staff Members</p>
            </div>
          </CardContent>
        </Card>

        {/* Elapsed Time */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="text-white" size={24} />
              </div>
              <Badge variant="default" className="animate-pulse">Live</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{metrics.elapsedTime}</h3>
              <p className="text-slate-600 text-sm">Elapsed Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Zap className="mr-3 text-slate-600" size={24} />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={handleAllCallAnnouncement}
                  disabled={loading}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <Megaphone size={16} className="mr-2" />
                  All-Call Announcement
                </Button>
                <Button 
                  onClick={handleUnlockExits}
                  disabled={loading}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <Unlock size={16} className="mr-2" />
                  Unlock All Exits
                </Button>
                <Button 
                  onClick={handleContactEmergencyServices}
                  disabled={loading}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <Phone size={16} className="mr-2" />
                  Contact Emergency Services
                </Button>
                <Button 
                  onClick={handleSendGuestNotifications}
                  disabled={loading}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <Bell size={16} className="mr-2" />
                  Send Guest Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Evacuation Progress */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="mr-3 text-slate-600" size={24} />
                Evacuation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                    <span className="text-sm font-bold text-slate-900">{metrics.evacuationProgress}%</span>
                  </div>
                  <Progress value={metrics.evacuationProgress} className="h-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{metrics.evacuated}</p>
                    <p className="text-xs text-slate-600">Evacuated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{metrics.inProgress}</p>
                    <p className="text-xs text-slate-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{metrics.remaining}</p>
                    <p className="text-xs text-slate-600">Remaining</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Clock className="mr-3 text-slate-600" size={24} />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.slice(0, 8).map((event, index) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg transition-all",
                      event.current && "bg-yellow-50 border-2 border-yellow-300",
                      !event.current && "bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      event.severity === 'critical' && "bg-red-100",
                      event.severity === 'warning' && "bg-yellow-100",
                      event.severity === 'info' && "bg-blue-100",
                      event.severity === 'success' && "bg-green-100"
                    )}>
                      {event.icon === 'AlertTriangle' && <AlertTriangle size={18} className="text-red-600" />}
                      {event.icon === 'Zap' && <Zap size={18} className="text-yellow-600" />}
                      {event.icon === 'Phone' && <Phone size={18} className="text-blue-600" />}
                      {event.icon === 'Users' && <Users size={18} className="text-slate-600" />}
                      {event.icon === 'CheckCircle' && <CheckCircle size={18} className="text-green-600" />}
                      {event.icon === 'Activity' && <Activity size={18} className="text-yellow-600" />}
                      {event.icon === 'Megaphone' && <Megaphone size={18} className="text-blue-600" />}
                      {event.icon === 'Unlock' && <Unlock size={18} className="text-green-600" />}
                      {!event.icon && <Activity size={18} className="text-slate-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{event.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{event.time}</p>
                    </div>
                    {event.current && (
                      <Badge variant="warning" className="animate-pulse">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Floor Status */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Building className="mr-3 text-slate-600" size={24} />
                Floor-by-Floor Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {floors.map(floor => (
                  <Card 
                    key={floor.id} 
                    className={cn(
                      "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all",
                      floor.riskLevel === 'critical' && "border-red-300",
                      floor.riskLevel === 'high' && "border-orange-300",
                      floor.riskLevel === 'medium' && "border-yellow-300"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{floor.name}</h3>
                          <p className="text-slate-600 text-sm">{floor.description}</p>
                        </div>
                        <Badge 
                          variant={
                            floor.status === 'evacuated' ? 'default' : 
                            floor.status === 'in-progress' ? 'warning' : 
                            'destructive'
                          }
                          className="capitalize"
                        >
                          {floor.status}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Progress:</span>
                          <span className="font-bold text-slate-900">{floor.progress}%</span>
                        </div>
                        <Progress value={floor.progress} className="h-2" />

                        <div className="grid grid-cols-2 gap-4 pt-3">
                          <div>
                            <p className="text-xs text-slate-600">Guest Count</p>
                            <p className="text-lg font-bold text-slate-900">{floor.guestCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Assigned Staff</p>
                            <p className="text-lg font-bold text-slate-900">{floor.assignedStaff}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Exit Route:</span>
                            <span className="font-medium text-slate-900">{floor.exitRoute}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-slate-600">Risk Level:</span>
                            <Badge 
                              variant={
                                floor.riskLevel === 'critical' ? 'destructive' :
                                floor.riskLevel === 'high' ? 'warning' :
                                'default'
                              }
                              className="capitalize"
                            >
                              {floor.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Deployment */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Shield className="mr-3 text-slate-600" size={24} />
                Staff Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(member => (
                  <Card key={member.id} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-slate-600 font-semibold text-sm">{member.avatar}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{member.name}</h4>
                          <p className="text-slate-600 text-xs">{member.role}</p>
                        </div>
                        <Badge 
                          variant={
                            member.status === 'active' ? 'default' : 
                            member.status === 'complete' ? 'default' : 
                            'secondary'
                          }
                          className={cn(
                            member.status === 'complete' && 'bg-green-100 text-green-800'
                          )}
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-medium text-slate-900">{member.location}</span>
                        </div>
                        {member.assignedFloor && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Assigned:</span>
                            <span className="font-medium text-slate-900">{member.assignedFloor}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Guests Assisted:</span>
                          <span className="font-bold text-slate-900">{member.guestsAssisted}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guest Assistance Requests */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl justify-between">
                <div className="flex items-center">
                  <UserCheck className="mr-3 text-slate-600" size={24} />
                  Guest Assistance Requests
                </div>
                <Badge variant="destructive">{pendingAssistance.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guestAssistance.map(request => (
                  <Card 
                    key={request.id} 
                    className={cn(
                      "backdrop-blur-sm shadow-lg border-2",
                      request.priority === 'high' && request.status === 'pending' && "border-red-300 bg-red-50/60",
                      request.priority === 'high' && request.status !== 'pending' && "border-red-200 bg-white/60",
                      request.priority === 'medium' && "border-yellow-200 bg-white/60",
                      request.priority === 'low' && "border-slate-200 bg-white/60"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge 
                              variant={request.priority === 'high' ? 'destructive' : 'warning'}
                              className="capitalize"
                            >
                              {request.priority} Priority
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {request.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">{request.room}</h4>
                          <p className="text-sm text-slate-700 font-medium">{request.guestName}</p>
                          <p className="text-sm text-slate-600 mt-1">{request.need}</p>
                          {request.assignedStaff && (
                            <p className="text-xs text-slate-500 mt-2">
                              Assigned to: <span className="font-medium">{request.assignedStaff}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignAssistance(request.id, activeStaff[0]?.id)}
                              className="bg-[#2563eb] hover:bg-blue-700 text-white"
                            >
                              Assign Staff
                            </Button>
                          )}
                          {request.status === 'assigned' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteAssistance(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Complete
                            </Button>
                          )}
                          {request.status === 'completed' && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evacuation Routes */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Navigation className="mr-3 text-slate-600" size={24} />
                Evacuation Routes Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map(route => (
                  <Card 
                    key={route.id}
                    className={cn(
                      "backdrop-blur-sm shadow-lg cursor-pointer hover:shadow-xl transition-all",
                      route.status === 'clear' && "border-green-300 bg-green-50/60",
                      route.status === 'congested' && "border-yellow-300 bg-yellow-50/60",
                      route.status === 'blocked' && "border-red-300 bg-red-50/60"
                    )}
                    onClick={() => handleViewRoute(route)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{route.name}</h4>
                          <p className="text-sm text-slate-600">{route.description}</p>
                        </div>
                        <Badge 
                          variant={
                            route.status === 'clear' ? 'default' :
                            route.status === 'congested' ? 'warning' :
                            'destructive'
                          }
                          className="capitalize"
                        >
                          {route.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">Capacity</span>
                            <span className="font-medium">{route.currentOccupancy}/{route.capacity}</span>
                          </div>
                          <Progress value={(route.currentOccupancy / route.capacity) * 100} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-slate-600">Est. Time:</span>
                          <span className="font-bold text-slate-900">{route.estimatedTime}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 text-slate-600 border-slate-300 hover:bg-slate-50"
                      >
                        <Eye size={14} className="mr-1" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Radio className="mr-3 text-slate-600" size={24} />
                Communication Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Public Announcements */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <Megaphone className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Public Announcements</h3>
                        <p className="text-sm text-slate-600">Broadcast emergency messages</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleAllCallAnnouncement}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Megaphone size={16} className="mr-2" />
                      Make Announcement
                    </Button>
                  </CardContent>
                </Card>

                {/* Guest Notifications */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <Bell className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Guest Notifications</h3>
                        <p className="text-sm text-slate-600">Send mobile alerts</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendGuestNotifications}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Bell size={16} className="mr-2" />
                      Send Notifications
                    </Button>
                  </CardContent>
                </Card>

                {/* Emergency Services */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                        <Phone className="text-red-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Emergency Services</h3>
                        <p className="text-sm text-slate-600">Direct communication</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleContactEmergencyServices}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Phone size={16} className="mr-2" />
                      Contact Services
                    </Button>
                  </CardContent>
                </Card>

                {/* Radio Communication */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <Radio className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Radio Communication</h3>
                        <p className="text-sm text-slate-600">Staff coordination</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Radio channel active')}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Radio size={16} className="mr-2" />
                      Open Radio Channel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Communication Logs */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-3 text-slate-600" size={24} />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communicationLogs.map(log => (
                  <Card key={log.id} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            log.type === 'announcement' && "bg-blue-100",
                            log.type === 'notification' && "bg-green-100",
                            log.type === 'emergency-call' && "bg-red-100",
                            log.type === 'radio' && "bg-purple-100"
                          )}>
                            {log.type === 'announcement' && <Megaphone size={18} className="text-blue-600" />}
                            {log.type === 'notification' && <Bell size={18} className="text-green-600" />}
                            {log.type === 'emergency-call' && <Phone size={18} className="text-red-600" />}
                            {log.type === 'radio' && <Radio size={18} className="text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{log.message}</p>
                            <p className="text-sm text-slate-600">To: {log.recipients}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{log.timestamp}</p>
                          <Badge 
                            variant={log.status === 'sent' ? 'default' : 'warning'}
                            className={cn(
                              log.status === 'sent' && 'bg-green-100 text-green-800'
                            )}
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-3 text-slate-600" size={24} />
                Evacuation Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Performance Metrics</h3>
                        <p className="text-sm text-slate-600">Historical evacuation data</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Average Time:</span>
                        <span className="font-bold text-slate-900">12:34</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Success Rate:</span>
                        <span className="font-bold text-slate-900">98.5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Avg Staff Response:</span>
                        <span className="font-bold text-slate-900">2:15</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Performance report generated')}
                      className="w-full mt-4 bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      View Full Report
                    </Button>
                  </CardContent>
                </Card>

                {/* Compliance Reports */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <FileText className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Compliance Reports</h3>
                        <p className="text-sm text-slate-600">Regulatory documentation</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Last Inspection:</span>
                        <span className="font-bold text-slate-900">Jan 15, 2025</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Status:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Compliant</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Next Drill:</span>
                        <span className="font-bold text-slate-900">Apr 20, 2025</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Compliance report generated')}
                      className="w-full mt-4 bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                {/* Staff Performance */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <Users className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Staff Performance</h3>
                        <p className="text-sm text-slate-600">Response analytics</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Staff:</span>
                        <span className="font-bold text-slate-900">{staff.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Active Now:</span>
                        <span className="font-bold text-slate-900">{activeStaff.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Readiness Score:</span>
                        <span className="font-bold text-slate-900">94/100</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Staff metrics report generated')}
                      className="w-full mt-4 bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      View Staff Metrics
                    </Button>
                  </CardContent>
                </Card>

                {/* Export Data */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                        <Download className="text-orange-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Export Data</h3>
                        <p className="text-sm text-slate-600">Download reports</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Export evacuation data for analysis and reporting in various formats.</p>
                    </div>
                    <Button 
                      onClick={handleExportData}
                      className="w-full mt-4 bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Download size={16} className="mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Evacuation Drills History */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="mr-3 text-slate-600" size={24} />
                Evacuation Drills History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evacuationDrills.map(drill => (
                  <Card key={drill.id} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-600">{drill.score}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{drill.date}</p>
                            <p className="text-sm text-slate-600">Duration: {drill.duration} | Participation: {drill.participationRate}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={drill.score >= 90 ? 'default' : 'warning'} className={cn(
                            drill.score >= 90 && 'bg-green-100 text-green-800'
                          )}>
                            Score: {drill.score}/100
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">{drill.issues} issues</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'predictive' && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="mr-3 text-slate-600" size={24} />
                Predictive Intelligence & AI Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Assessment */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                        <AlertCircle className="text-red-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Risk Assessment</h3>
                        <p className="text-sm text-slate-600">AI-powered risk analysis</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Current Risk Level:</span>
                        <Badge variant="warning">Medium</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Confidence:</span>
                        <span className="font-bold text-slate-900">87%</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Risk assessment analysis updated')}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      Run Assessment
                    </Button>
                  </CardContent>
                </Card>

                {/* Early Warning System */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                        <Bell className="text-yellow-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Early Warning System</h3>
                        <p className="text-sm text-slate-600">Proactive alerts</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Active Alerts:</span>
                        <span className="font-bold text-slate-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">System Status:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Early warning system configured')}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      Configure Alerts
                    </Button>
                  </CardContent>
                </Card>

                {/* Route Optimization */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <Route className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Route Optimization</h3>
                        <p className="text-sm text-slate-600">AI-optimized paths</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Clear Routes:</span>
                        <span className="font-bold text-slate-900">{clearRoutes.length}/{routes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Optimization:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Routes optimized successfully')}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      Optimize Routes
                    </Button>
                  </CardContent>
                </Card>

                {/* Scenario Planning */}
                <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <BarChart3 className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Scenario Planning</h3>
                        <p className="text-sm text-slate-600">Simulate emergencies</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Scenarios:</span>
                        <span className="font-bold text-slate-900">12 Planned</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Last Run:</span>
                        <span className="font-bold text-slate-900">Jan 15</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => showSuccess('Scenario simulation started')}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      Run Scenario
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Zap className="mr-3 text-slate-600" size={24} />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card className="backdrop-blur-sm bg-blue-50/60 border-blue-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Improved Response Time</h4>
                        <p className="text-sm text-slate-600">Analysis shows 15% improvement in evacuation response time over the past 3 drills. Staff training effectiveness is increasing.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-yellow-50/60 border-yellow-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={16} className="text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Route Congestion Pattern</h4>
                        <p className="text-sm text-slate-600">Stairwell B consistently shows congestion during drills. Consider deploying additional staff or optimizing flow patterns.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-green-50/60 border-green-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">High Guest Compliance</h4>
                        <p className="text-sm text-slate-600">Guest participation and compliance rates are excellent at 94%. Current notification system is effective.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="glass-card-strong p-6">
            <div className="mb-6">
              <h3 className="flex items-center text-lg font-semibold text-slate-900">
                <i className="fas fa-cog mr-3 text-slate-600"></i>
                Evacuation System Settings
              </h3>
            </div>
            <div className="space-y-6">
              {/* Automation Settings */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Automation Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Auto-Evacuation</span>
                      <p className="text-sm text-gray-600">Automatically initiate evacuation on fire alarm</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoEvacuation}
                      onChange={(e) => setSettings({...settings, autoEvacuation: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Emergency Services Contact</span>
                      <p className="text-sm text-gray-600">Automatically contact emergency services</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emergencyServicesContact}
                      onChange={(e) => setSettings({...settings, emergencyServicesContact: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Guest Notifications</span>
                      <p className="text-sm text-gray-600">Send mobile app notifications to guests</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.guestNotifications}
                      onChange={(e) => setSettings({...settings, guestNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* System Control */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">System Control</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Sound Alarms</span>
                      <p className="text-sm text-gray-600">Activate audible evacuation alarms</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundAlarms}
                      onChange={(e) => setSettings({...settings, soundAlarms: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Unlock Exits</span>
                      <p className="text-sm text-gray-600">Automatically unlock all emergency exits</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.unlockExits}
                      onChange={(e) => setSettings({...settings, unlockExits: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <span className="text-gray-900 font-medium">Elevator Shutdown</span>
                      <p className="text-sm text-gray-600">Disable elevators during evacuation</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.elevatorShutdown}
                      onChange={(e) => setSettings({...settings, elevatorShutdown: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Volume</label>
                    <select
                      value={settings.announcementVolume}
                      onChange={(e) => setSettings({...settings, announcementVolume: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="50">50%</option>
                      <option value="60">60%</option>
                      <option value="70">70%</option>
                      <option value="80">80%</option>
                      <option value="90">90%</option>
                      <option value="100">100%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evacuation Timeout (minutes)</label>
                    <select
                      value={settings.evacuationTimeout}
                      onChange={(e) => setSettings({...settings, evacuationTimeout: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drill Frequency (days)</label>
                    <select
                      value={settings.drillFrequency}
                      onChange={(e) => setSettings({...settings, drillFrequency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="30">30 days (Monthly)</option>
                      <option value="60">60 days (Bi-monthly)</option>
                      <option value="90">90 days (Quarterly)</option>
                      <option value="180">180 days (Semi-annually)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleResetSettings}
                  className="btn btn-secondary"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => {
                    handleSaveSettings();
                    showSuccess('Settings saved successfully');
                  }}
                  className="btn btn-primary"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <i className="fas fa-bullhorn mr-3 text-blue-600"></i>
                Make All-Call Announcement
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Message</label>
                  <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your announcement message..."
                  />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> This message will be broadcast to all guests and staff throughout the facility via the PA system.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAnnouncement}
                className="btn btn-primary"
              >
                <i className="fas fa-bullhorn mr-2"></i>
                Broadcast Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      {showRouteModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <i className="fas fa-route mr-3 text-blue-600"></i>
                {selectedRoute.name}
              </h2>
              <button
                onClick={() => setShowRouteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Route Status</h3>
                <span
                  className={cn(
                    "badge capitalize text-lg px-4 py-2",
                    selectedRoute.status === 'clear' ? 'badge-glass' :
                    selectedRoute.status === 'congested' ? 'badge-warning' :
                    'badge-danger'
                  )}
                >
                  {selectedRoute.status}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-600">{selectedRoute.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Capacity</h3>
                  <p className="text-2xl font-bold text-slate-900">{selectedRoute.capacity}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Current Occupancy</h3>
                  <p className="text-2xl font-bold text-slate-900">{selectedRoute.currentOccupancy}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Capacity Utilization</h3>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(selectedRoute.currentOccupancy / selectedRoute.capacity) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {Math.round((selectedRoute.currentOccupancy / selectedRoute.capacity) * 100)}% utilized
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Estimated Evacuation Time</h3>
                <p className="text-lg font-bold text-slate-900">{selectedRoute.estimatedTime}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Serves Floors</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRoute.floors.map((floor, index) => (
                    <span key={index} className="badge badge-outline">{floor}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRouteModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Evacuation System Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Automation Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Auto-Evacuation</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.autoEvacuation}
                      onChange={(e) => setSettingsForm({...settingsForm, autoEvacuation: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Emergency Services Contact</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.emergencyServicesContact}
                      onChange={(e) => setSettingsForm({...settingsForm, emergencyServicesContact: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Guest Notifications</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.guestNotifications}
                      onChange={(e) => setSettingsForm({...settingsForm, guestNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* System Control */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Control</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Sound Alarms</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.soundAlarms}
                      onChange={(e) => setSettingsForm({...settingsForm, soundAlarms: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-gray-700">Unlock Exits</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.unlockExits}
                      onChange={(e) => setSettingsForm({...settingsForm, unlockExits: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleResetSettings}
                className="btn btn-secondary"
              >
                Reset to Defaults
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="btn btn-primary"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EvacuationModule;
