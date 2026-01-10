import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { SearchBar } from '../../components/UI/SearchBar';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';
import { BehaviorAnalysisPanel } from '../../components/AccessControlModule/BehaviorAnalysisPanel';
import { useAuth } from '../../contexts/AuthContext';
import { ValidationService } from '../../services/ValidationService';
import { ErrorHandlerService } from '../../services/ErrorHandlerService';
import apiService from '../../services/ApiService';
import { AccessControlUtilities, type CachedEvent, type AccessPointGroup, type RoleZoneMapping, type VisitorRegistration, type HeldOpenAlert } from '../../services/AccessControlUtilities';
import '../../styles/modern-glass.css';

// Enhanced TypeScript Interfaces
interface AccessPoint {
  id: string;
  name: string;
  location: string;
  type: 'door' | 'gate' | 'elevator' | 'turnstile';
  status: 'active' | 'maintenance' | 'disabled';
  accessMethod: 'card' | 'biometric' | 'pin' | 'mobile';
  lastAccess?: string;
  accessCount: number;
  permissions: string[];
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  isOnline?: boolean;
  sensorStatus?: 'closed' | 'open' | 'forced' | 'held-open';
  powerSource?: 'mains' | 'battery';
  batteryLevel?: number;
  lastStatusChange?: string; // ISO timestamp when sensorStatus last changed (for held-open alarm)
  groupId?: string; // For access point grouping
  zoneId?: string; // For role-zone mapping
  cachedEvents?: CachedEvent[]; // Events cached when offline (for hardware late-sync)
  permanentAccess?: boolean; // Indicates permanent access type (for priority stack)
}

interface AccessSchedule {
  days: string[]; // ['monday', 'tuesday', ...]
  startTime: string; // '06:00'
  endTime: string; // '23:00'
  timezone?: string;
}

interface TemporaryAccess {
  id: string;
  userId: string;
  accessPointIds: string[];
  startTime: string;
  endTime: string;
  reason: string;
  grantedBy: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  accessLevel: 'standard' | 'elevated' | 'restricted';
  lastAccess?: string;
  accessCount: number;
  avatar: string;
  permissions: string[];
  phone?: string;
  employeeId?: string;
  accessSchedule?: AccessSchedule;
  temporaryAccesses?: TemporaryAccess[];
  autoRevokeAtCheckout?: boolean;
}

interface AccessEvent {
  id: string;
  userId: string;
  userName: string;
  accessPointId: string;
  accessPointName: string;
  action: 'granted' | 'denied' | 'timeout';
  timestamp: string;
  reason?: string;
  location: string;
  accessMethod: string;
}

interface AccessMetrics {
  totalAccessPoints: number;
  activeAccessPoints: number;
  totalUsers: number;
  activeUsers: number;
  todayAccessEvents: number;
  deniedAccessEvents: number;
  averageResponseTime: string;
  systemUptime: string;
  topAccessPoints: { name: string; count: number }[];
  recentAlerts: number;
  securityScore: number;
  lastSecurityScan: string;
}

// Enhanced Tab Structure - 7 tabs with AI Analytics and Reports
const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/access-control' },
  { id: 'access-points', label: 'Access Points', path: '/modules/access-control-points' },
  { id: 'users', label: 'User Management', path: '/modules/access-control-users' },
  { id: 'events', label: 'Access Events', path: '/modules/access-control-events' },
  { id: 'ai-analytics', label: 'AI Analytics', path: '/modules/access-control-ai' },
  { id: 'reports', label: 'Reports & Analytics', path: '/modules/access-control-reports' },
  { id: 'configuration', label: 'Configuration', path: '/modules/access-control-config' }
];

// Enhanced Mock Data
const mockAccessPoints: AccessPoint[] = [
    {
      id: '1',
      name: 'Main Entrance',
      location: 'Building A - Lobby',
      type: 'door',
      status: 'active',
      accessMethod: 'card',
      lastAccess: '2024-01-15T14:30:00Z',
      accessCount: 1247,
      permissions: ['staff', 'guest', 'contractor'],
      securityLevel: 'high',
      isOnline: true,
      sensorStatus: 'closed',
      powerSource: 'mains',
      batteryLevel: undefined
    },
    {
      id: '2',
      name: 'Parking Gate',
      location: 'Underground Parking',
      type: 'gate',
      status: 'active',
      accessMethod: 'mobile',
      lastAccess: '2024-01-15T14:25:00Z',
      accessCount: 234,
      permissions: ['staff', 'guest'],
      securityLevel: 'medium',
      isOnline: true,
      sensorStatus: 'closed',
      powerSource: 'mains',
      batteryLevel: undefined
    },
    {
      id: '3',
      name: 'Executive Floor',
      location: 'Building A - Floor 15',
      type: 'elevator',
      status: 'active',
      accessMethod: 'biometric',
      lastAccess: '2024-01-15T14:20:00Z',
      accessCount: 89,
      permissions: ['admin', 'executive'],
      securityLevel: 'critical',
      isOnline: true,
      sensorStatus: 'closed',
      powerSource: 'mains',
      batteryLevel: undefined
    },
    {
      id: '4',
      name: 'Server Room',
      location: 'Building B - Basement',
      type: 'door',
      status: 'active',
      accessMethod: 'card',
      lastAccess: '2024-01-15T14:15:00Z',
      accessCount: 12,
      permissions: ['admin', 'it'],
      securityLevel: 'critical',
      isOnline: false,
      sensorStatus: 'open',
      powerSource: 'battery',
      batteryLevel: 45
    },
    {
      id: '5',
      name: 'Guest Elevator',
      location: 'Building A - Lobby',
      type: 'elevator',
      status: 'maintenance',
      accessMethod: 'card',
      lastAccess: '2024-01-15T13:45:00Z',
      accessCount: 456,
      permissions: ['staff', 'guest'],
      securityLevel: 'medium',
      isOnline: true,
      sensorStatus: 'closed',
      powerSource: 'mains',
      batteryLevel: undefined
    }
];

const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@hotel.com',
      role: 'admin',
      department: 'Security',
      status: 'active',
    accessLevel: 'elevated',
      lastAccess: '2024-01-15T14:30:00Z',
    accessCount: 45,
    avatar: 'JS',
    permissions: ['all']
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@hotel.com',
    role: 'manager',
    department: 'Front Desk',
      status: 'active',
    accessLevel: 'standard',
      lastAccess: '2024-01-15T13:45:00Z',
    accessCount: 23,
    avatar: 'SJ',
    permissions: ['lobby', 'guest_areas']
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@hotel.com',
    role: 'employee',
    department: 'Maintenance',
    status: 'active',
    accessLevel: 'restricted',
    lastAccess: '2024-01-15T12:30:00Z',
    accessCount: 8,
    avatar: 'MW',
    permissions: ['maintenance_areas']
  },
  {
    id: '4',
    name: 'Lisa Brown',
    email: 'lisa.brown@hotel.com',
    role: 'employee',
    department: 'Housekeeping',
    status: 'active',
    accessLevel: 'standard',
    lastAccess: '2024-01-15T14:15:00Z',
    accessCount: 34,
    avatar: 'LB',
    permissions: ['guest_rooms', 'service_areas']
  }
];

const mockAccessEvents: AccessEvent[] = [
    {
      id: '1',
      userId: '1',
      userName: 'John Smith',
      accessPointId: '1',
      accessPointName: 'Main Entrance',
      action: 'granted',
    timestamp: '2024-01-15T14:30:00Z',
    location: 'Building A - Lobby',
    accessMethod: 'card'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Sarah Johnson',
      accessPointId: '2',
    accessPointName: 'Parking Gate',
    action: 'granted',
    timestamp: '2024-01-15T14:25:00Z',
    location: 'Underground Parking',
    accessMethod: 'mobile'
  },
  {
    id: '3',
    userId: '5',
    userName: 'Unknown User',
    accessPointId: '3',
    accessPointName: 'Executive Floor',
      action: 'denied',
    timestamp: '2024-01-15T14:20:00Z',
    reason: 'Insufficient permissions',
    location: 'Building A - Floor 15',
    accessMethod: 'card'
  },
  {
    id: '4',
    userId: '3',
    userName: 'Mike Wilson',
    accessPointId: '4',
    accessPointName: 'Server Room',
    action: 'denied',
    timestamp: '2024-01-15T14:15:00Z',
    reason: 'Unauthorized access attempt',
    location: 'Building B - Basement',
    accessMethod: 'card'
  }
];

// Emergency Timeout Countdown Display Component (Inline)
const EmergencyTimeoutCountdownDisplay: React.FC<{ startTimestamp: string; durationSeconds: number }> = ({ startTimestamp, durationSeconds }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      const startTime = new Date(startTimestamp).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    const startTime = new Date(startTimestamp).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, durationSeconds - elapsed);
    setTimeRemaining(remaining);

    return () => clearInterval(interval);
  }, [startTimestamp, durationSeconds]);

  const isCritical = timeRemaining < 300; // Less than 5 minutes

  return (
    <span className={`text-lg font-bold ${isCritical ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
      {AccessControlUtilities.formatDuration(timeRemaining)}
    </span>
  );
};

const AccessControlModule: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>(mockAccessPoints);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>(mockAccessEvents);
  
  // Modal states for admin functionality
  const [showCreateAccessPoint, setShowCreateAccessPoint] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Visitor Registration State
  const [showVisitorRegistration, setShowVisitorRegistration] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    photoUrl: '',
    idDocumentUrl: '',
    expectedCheckOutTime: '',
    accessPointIds: [] as string[]
  });
  
  // Bulk Operations State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkOperationsModal, setShowBulkOperationsModal] = useState(false);
  
  // Report Generation State
  const [showReportGenerationModal, setShowReportGenerationModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    startDate: '',
    endDate: '',
    eventTypes: [] as string[],
    userIds: [] as string[],
    accessPointIds: [] as string[],
    format: 'pdf' as 'pdf' | 'csv'
  });
  
  // Access Point Grouping State
  const [accessPointGroups, setAccessPointGroups] = useState<AccessPointGroup[]>([]);
  const [showAccessPointGroupModal, setShowAccessPointGroupModal] = useState(false);
  const [accessPointGroupForm, setAccessPointGroupForm] = useState({
    name: '',
    description: '',
    accessPointIds: [] as string[]
  });
  
  // Role-to-Zone Mapping State
  const [roleZoneMappings, setRoleZoneMappings] = useState<RoleZoneMapping[]>([]);
  const [showRoleZoneModal, setShowRoleZoneModal] = useState(false);
  const [roleZoneForm, setRoleZoneForm] = useState({
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'guest',
    zoneName: '',
    accessPointIds: [] as string[]
  });
  
  // Hardware Late-Sync State
  const [syncingAccessPointId, setSyncingAccessPointId] = useState<string | null>(null);
  
  // Form dirty state tracking
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingModalClose, setPendingModalClose] = useState<(() => void) | null>(null);
  
  // Search and filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [accessPointSearchQuery, setAccessPointSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'manager' | 'employee' | 'guest'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [accessPointTypeFilter, setAccessPointTypeFilter] = useState<'all' | 'door' | 'gate' | 'elevator' | 'turnstile'>('all');
  const [accessPointStatusFilter, setAccessPointStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'disabled'>('all');
  
  // Form states
  const [accessPointForm, setAccessPointForm] = useState({
    name: '',
    location: '',
    type: 'door' as 'door' | 'gate' | 'elevator' | 'turnstile',
    accessMethod: 'card' as 'card' | 'biometric' | 'pin' | 'mobile',
    status: 'active' as 'active' | 'maintenance' | 'disabled',
    description: ''
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'guest',
    accessLevel: 'standard' as 'standard' | 'elevated' | 'restricted',
    phone: '',
    employeeId: '',
    accessSchedule: {
      days: [] as string[],
      startTime: '00:00',
      endTime: '23:59'
    } as AccessSchedule,
    autoRevokeAtCheckout: false
  });

  const [temporaryAccessForm, setTemporaryAccessForm] = useState({
    userId: '',
    accessPointIds: [] as string[],
    startTime: '',
    endTime: '',
    reason: ''
  });

  const [showTemporaryAccessModal, setShowTemporaryAccessModal] = useState(false);
  const [showEmergencyOverrideModal, setShowEmergencyOverrideModal] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState<'normal' | 'lockdown' | 'unlock'>('normal');
  const [emergencyController, setEmergencyController] = useState<{
    mode: 'lockdown' | 'unlock';
    initiatedBy: string;
    timestamp: string;
    priority: number;
    timeoutDuration?: number; // in seconds (for emergency timeout)
    timeoutTimer?: NodeJS.Timeout; // Timer ID for auto-relock
  } | null>(null);
  
  // Held-Open Alarm System State
  const [heldOpenAlerts, setHeldOpenAlerts] = useState<HeldOpenAlert[]>([]);
  const emergencyTimeoutDuration = 30 * 60; // 30 minutes in seconds (configurable)
  
  const [metrics, setMetrics] = useState<AccessMetrics>({
    totalAccessPoints: 24,
    activeAccessPoints: 22,
    totalUsers: 156,
    activeUsers: 142,
    todayAccessEvents: 1247,
    deniedAccessEvents: 23,
    averageResponseTime: '0.8s',
    systemUptime: '99.9%',
    topAccessPoints: [
      { name: 'Main Entrance', count: 1247 },
      { name: 'Parking Gate', count: 234 },
      { name: 'Guest Elevator', count: 456 }
    ],
    recentAlerts: 3,
    securityScore: 94,
    lastSecurityScan: '2024-01-15T10:00:00Z'
  });

  // Admin handler functions
  const handleCreateAccessPoint = useCallback(async () => {
    // Form validation
    if (!accessPointForm.name.trim()) {
      showError('Access point name is required');
      return;
    }
    if (!accessPointForm.location.trim()) {
      showError('Location is required');
      return;
    }

    showLoading('Creating access point...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAccessPoint: AccessPoint = {
        id: `ap-${Date.now()}`,
        ...accessPointForm,
        lastAccess: new Date().toISOString(),
        accessCount: 0,
        permissions: [],
        securityLevel: 'medium',
        isOnline: true
      };
      
      setAccessPoints(prev => [...prev, newAccessPoint]);
      setShowCreateAccessPoint(false);
      setAccessPointForm({
        name: '',
        location: '',
        type: 'door',
        accessMethod: 'card',
        status: 'active',
        description: ''
      });
      showSuccess('Access point created successfully!');
    } catch (error) {
      showError('Failed to create access point');
    }
  }, [accessPointForm]);

  const handleCreateUser = useCallback(async () => {
    // Form validation
    if (!userForm.name.trim()) {
      showError('User name is required');
      return;
    }
    if (!userForm.email.trim()) {
      showError('Email is required');
      return;
    }
    if (!userForm.department.trim()) {
      showError('Department is required');
      return;
    }

    // SECURITY FIX 2: Check banned individuals before creating user
    showLoading('Checking banned individuals database...');
    try {
      const bannedCheck = await apiService.getBannedIndividuals({
        name: userForm.name,
        email: userForm.email,
        identification_number: userForm.employeeId || undefined
      });
      
      if (bannedCheck.success && bannedCheck.data && bannedCheck.data.length > 0) {
        const bannedPerson = bannedCheck.data[0];
        showError(
          `Security Alert: This individual is banned. Reason: ${bannedPerson.reason}. ` +
          `Ban Status: ${bannedPerson.status}. Contact security administrator.`
        );
        return;
      }
    } catch (error) {
      // If banned check fails, log but don't block user creation (could be network issue)
      console.warn('Banned individuals check failed:', error);
      ErrorHandlerService.logError(error, 'handleCreateUser_bannedCheck');
    }

    showLoading('Creating user...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...userForm,
        avatar: userForm.name.charAt(0).toUpperCase(),
        status: 'active',
        lastAccess: new Date().toISOString(),
        accessLevel: userForm.accessLevel,
        accessCount: 0,
        permissions: []
      };
      
      setUsers(prev => [...prev, newUser]);
      setShowCreateUser(false);
      setIsFormDirty(false);
      setUserForm({
        name: '',
        email: '',
        department: '',
        role: 'employee',
        accessLevel: 'standard',
        phone: '',
        employeeId: '',
        accessSchedule: {
          days: [],
          startTime: '00:00',
          endTime: '23:59'
        },
        autoRevokeAtCheckout: false
      });
      showSuccess('User created successfully!');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleCreateUser');
      showError('Failed to create user');
    }
  }, [userForm]);

  const handleEditUser = useCallback(async (user: User) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      accessLevel: user.accessLevel,
      phone: user.phone || '',
      employeeId: user.employeeId || '',
      accessSchedule: user.accessSchedule || {
        days: [],
        startTime: '00:00',
        endTime: '23:59'
      },
      autoRevokeAtCheckout: user.autoRevokeAtCheckout || false
    });
    setShowEditUser(true);
  }, []);

  const handleUpdateUser = useCallback(async () => {
    if (!selectedUser) return;

    // SECURITY FIX 1: Role-based authorization - only Admins can promote to Admin
    const currentUserRole = currentUser?.roles?.[0]?.toLowerCase() || 'employee';
    const isAdmin = currentUserRole === 'admin';
    const isChangingRole = userForm.role !== selectedUser.role;
    const isChangingAccessLevel = userForm.accessLevel !== selectedUser.accessLevel;
    const isPromotingToAdmin = userForm.role === 'admin' && selectedUser.role !== 'admin';
    
    if (isPromotingToAdmin && !isAdmin) {
      showError('Unauthorized: Only administrators can promote users to Admin role');
      return;
    }
    
    // Prevent managers from promoting themselves to admin
    if (isPromotingToAdmin && selectedUser.id === currentUser?.user_id) {
      showError('Unauthorized: You cannot promote yourself to Admin role');
      return;
    }

    showLoading('Updating user...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userForm }
          : user
      ));
      
      setShowEditUser(false);
      setSelectedUser(null);
      setIsFormDirty(false);
      showSuccess('User updated successfully!');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleUpdateUser');
      showError('Failed to update user');
    }
  }, [selectedUser, userForm, currentUser]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    showLoading('Deleting user...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      showSuccess('User deleted successfully!');
    } catch (error) {
      showError('Failed to delete user');
    }
  }, []);

  const handleToggleAccessPoint = useCallback(async (pointId: string) => {
    // SECURITY FIX 3: Check if hardware is online before sending commands
    const accessPoint = accessPoints.find(p => p.id === pointId);
    if (!accessPoint) {
      showError('Access point not found');
      return;
    }

    if (accessPoint.isOnline === false) {
      showError(
        `Hardware Disconnected: Cannot control "${accessPoint.name}". ` +
        `The access point is offline. Please check network connectivity and hardware status.`
      );
      return;
    }

    showLoading('Updating access point...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAccessPoints(prev => prev.map(point => 
        point.id === pointId 
          ? { ...point, status: point.status === 'active' ? 'disabled' : 'active' }
          : point
      ));
      
      showSuccess('Access point status updated!');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleToggleAccessPoint');
      showError('Failed to update access point');
    }
  }, [accessPoints]);

  // Emergency Override Handlers with Conflict Resolution
  const handleEmergencyLockdown = useCallback(async () => {
    const confirmed = window.confirm('⚠️ EMERGENCY LOCKDOWN\n\nThis will lock ALL access points. Are you sure?');
    if (!confirmed) return;

    // SECURITY FIX 4: Master Emergency Controller with conflict resolution
    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 1; // Lockdown has priority 1 (highest priority)

    // Check for existing emergency mode and resolve conflicts
    if (emergencyMode === 'unlock' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();
      
      // If existing unlock is less than 5 seconds old, allow override (newer takes precedence)
      if (timeDiff < 5000 && currentPriority >= emergencyController.priority) {
        // Allow override - proceed with lockdown
      } else if (timeDiff < 5000 && currentPriority < emergencyController.priority) {
        showError(
          `Emergency Conflict: Unlock was initiated ${Math.round(timeDiff/1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Lockdown requires higher priority. Contact security administrator.`
        );
        return;
      }
    }

    showLoading('Initiating emergency lockdown...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmergencyMode('lockdown');
      setEmergencyController({
        mode: 'lockdown',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority
      });
      setAccessPoints(prev => prev.map(point => ({ ...point, status: 'disabled' as const })));
      showSuccess('Emergency lockdown activated! All access points are now locked.');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleEmergencyLockdown');
      showError('Failed to initiate lockdown');
    }
  }, [emergencyMode, emergencyController, currentUser]);

  const handleEmergencyUnlock = useCallback(async () => {
    const confirmed = window.confirm('⚠️ EMERGENCY UNLOCK\n\nThis will unlock ALL access points. Are you sure?');
    if (!confirmed) return;

    // SECURITY FIX 4: Master Emergency Controller with conflict resolution
    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 0; // Unlock has lower priority than lockdown

    // Check for existing emergency mode and resolve conflicts
    if (emergencyMode === 'lockdown' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();
      
      // Lockdown has higher priority - block unlock unless lockdown is old
      if (timeDiff < 10000) { // 10 seconds grace period
        showError(
          `Emergency Conflict: Lockdown was initiated ${Math.round(timeDiff/1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Unlock requires authorization override. Contact security administrator.`
        );
        return;
      }
    }

    showLoading('Initiating emergency unlock...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmergencyMode('unlock');
      setEmergencyController({
        mode: 'unlock',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority,
        timeoutDuration: emergencyTimeoutDuration // Store timeout duration
      });
      setAccessPoints(prev => prev.map(point => ({ ...point, status: 'active' as const })));
      showSuccess(
        `Emergency unlock activated! All access points are now unlocked. ` +
        `Auto-relock will occur in ${AccessControlUtilities.formatDuration(emergencyTimeoutDuration)} if not manually restored.`
      );
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleEmergencyUnlock');
      showError('Failed to initiate unlock');
    }
  }, [emergencyMode, emergencyController, currentUser, emergencyTimeoutDuration]);

  const handleNormalMode = useCallback(async () => {
    showLoading('Restoring normal mode...');
    try {
      // Clear emergency timeout timer if exists
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmergencyMode('normal');
      setEmergencyController(null);
      showSuccess('Normal mode restored.');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleNormalMode');
      showError('Failed to restore normal mode');
    }
  }, [emergencyController]);

  // CRITICAL FIX 1: Held-Open Alarm Monitoring System
  useEffect(() => {
    const checkHeldOpenAlarms = () => {
      const newAlerts: HeldOpenAlert[] = [];
      
      accessPoints.forEach(point => {
        if (point.sensorStatus === 'held-open' && point.lastStatusChange) {
          const alert = AccessControlUtilities.checkHeldOpenAlarm(
            point.id,
            point.name,
            point.location,
            point.sensorStatus,
            point.lastStatusChange
          );
          
          if (alert) {
            // Check if alert already exists for this access point
            const existingAlert = heldOpenAlerts.find(a => a.accessPointId === point.id && !a.acknowledged);
            if (!existingAlert) {
              newAlerts.push(alert);
              
              // Show critical alert if held open > 5 minutes
              if (alert.severity === 'critical') {
                showError(
                  `🚨 CRITICAL: Door "${point.name}" has been held open for ${AccessControlUtilities.formatDuration(alert.duration)}. ` +
                  `Security risk detected!`
                );
              }
            }
          }
        }
      });
      
      if (newAlerts.length > 0) {
        setHeldOpenAlerts(prev => [...prev, ...newAlerts]);
      }
      
      // Auto-acknowledge alerts when door closes
      setHeldOpenAlerts(prev => prev.map(alert => {
        const point = accessPoints.find(ap => ap.id === alert.accessPointId);
        if (point && point.sensorStatus !== 'held-open') {
          return { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() };
        }
        return alert;
      }));
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkHeldOpenAlarms, 30000);
    checkHeldOpenAlarms(); // Initial check
    
    return () => clearInterval(interval);
  }, [accessPoints, heldOpenAlerts]);

  // CRITICAL FIX 2: Emergency Timeout Mechanism
  useEffect(() => {
    if (emergencyMode === 'unlock' && emergencyController && !emergencyController.timeoutTimer) {
      // Set timeout for auto-relock
      const timeoutMs = (emergencyController.timeoutDuration || emergencyTimeoutDuration) * 1000;
      const timeoutTimer = setTimeout(() => {
        showError('⚠️ Emergency unlock timeout reached. Auto-relocking all access points for security.');
        handleNormalMode();
      }, timeoutMs);
      
      // Update controller with timer ID
      setEmergencyController(prev => prev ? { ...prev, timeoutTimer } : null);
      
      return () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };
    }
  }, [emergencyMode, emergencyController, emergencyTimeoutDuration, handleNormalMode]);

  // CRITICAL FIX 3: Hardware Late-Sync - Monitor access points coming back online
  useEffect(() => {
    accessPoints.forEach(point => {
      // If access point just came back online and has cached events
      if (point.isOnline && point.cachedEvents && point.cachedEvents.length > 0) {
        const unsyncedEvents = point.cachedEvents.filter(e => !e.synced);
        if (unsyncedEvents.length > 0) {
          // Show notification that cached events are available for sync
          showSuccess(
            `Access point "${point.name}" is back online. ${unsyncedEvents.length} cached event(s) available for sync.`
          );
        }
      }
    });
  }, [accessPoints]);

  // Temporary Access Handlers
  const handleGrantTemporaryAccess = useCallback(async () => {
    if (!temporaryAccessForm.userId || temporaryAccessForm.accessPointIds.length === 0) {
      showError('Please select a user and at least one access point');
      return;
    }
    if (!temporaryAccessForm.startTime || !temporaryAccessForm.endTime) {
      showError('Please set start and end times');
      return;
    }

    // SECURITY FIX 5: Validate time range (endTime must be after startTime)
    const timeRangeValidation = ValidationService.timeRange(
      temporaryAccessForm.startTime,
      temporaryAccessForm.endTime
    );
    if (!timeRangeValidation.valid) {
      showError(timeRangeValidation.error || 'Invalid time range');
      return;
    }

    showLoading('Granting temporary access...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTemporaryAccess: TemporaryAccess = {
        id: `temp-${Date.now()}`,
        ...temporaryAccessForm,
        grantedBy: currentUser?.email || currentUser?.username || 'Unknown User',
        createdAt: new Date().toISOString()
      };

      setUsers(prev => prev.map(user => 
        user.id === temporaryAccessForm.userId
          ? { 
              ...user, 
              temporaryAccesses: [...(user.temporaryAccesses || []), newTemporaryAccess]
            }
          : user
      ));

      setShowTemporaryAccessModal(false);
      setIsFormDirty(false);
      setTemporaryAccessForm({
        userId: '',
        accessPointIds: [],
        startTime: '',
        endTime: '',
        reason: ''
      });
      showSuccess('Temporary access granted successfully!');
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleGrantTemporaryAccess');
      showError('Failed to grant temporary access');
    }
  }, [temporaryAccessForm, currentUser]);

  // Visitor Registration Handler
  const handleRegisterVisitor = useCallback(async () => {
    if (!visitorForm.name.trim()) {
      showError('Visitor name is required');
      return;
    }
    if (!visitorForm.phone.trim()) {
      showError('Visitor phone is required');
      return;
    }
    if (!visitorForm.expectedCheckOutTime) {
      showError('Expected checkout time is required');
      return;
    }
    if (visitorForm.accessPointIds.length === 0) {
      showError('Please select at least one access point');
      return;
    }

    const toastId = showLoading('Registering visitor and generating badge...');
    try {
      // Check banned individuals
      const bannedCheck = await apiService.getBannedIndividuals({
        name: visitorForm.name,
        email: visitorForm.email || undefined,
        phone: visitorForm.phone
      });
      
      if (bannedCheck.success && bannedCheck.data && bannedCheck.data.length > 0) {
        const bannedPerson = bannedCheck.data[0];
        dismissLoadingAndShowError(
          toastId,
          `Security Alert: This visitor is banned. Reason: ${bannedPerson.reason}. Contact security administrator.`
        );
        ErrorHandlerService.logError(new Error('Banned Visitor Registration Attempt'), 'handleRegisterVisitor');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate badge ID
      const badgeId = AccessControlUtilities.generateBadgeId();
      
      // Create visitor user
      const visitorUser: User = {
        id: `visitor-${Date.now()}`,
        name: visitorForm.name,
        email: visitorForm.email || '',
        role: 'guest',
        department: visitorForm.company || 'Visitor',
        status: 'active',
        accessLevel: 'restricted',
        accessCount: 0,
        avatar: visitorForm.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        permissions: [],
        phone: visitorForm.phone,
        employeeId: badgeId,
        autoRevokeAtCheckout: true,
        temporaryAccesses: [{
          id: `temp-${Date.now()}`,
          userId: `visitor-${Date.now()}`,
          accessPointIds: visitorForm.accessPointIds,
          startTime: new Date().toISOString(),
          endTime: visitorForm.expectedCheckOutTime,
          reason: `Visitor access - ${visitorForm.company || 'No company'}`,
          grantedBy: currentUser?.email || 'System',
          createdAt: new Date().toISOString()
        }]
      };

      setUsers(prev => [...prev, visitorUser]);
      
      // Simulate badge printing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowVisitorRegistration(false);
      setIsFormDirty(false);
      setVisitorForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        photoUrl: '',
        idDocumentUrl: '',
        expectedCheckOutTime: '',
        accessPointIds: []
      });
      
      dismissLoadingAndShowSuccess(toastId, `Visitor "${visitorForm.name}" registered successfully! Badge ID: ${badgeId}. Badge printed.`);
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleRegisterVisitor');
      dismissLoadingAndShowError(toastId, 'Failed to register visitor');
    }
  }, [visitorForm, currentUser]);

  // Bulk Operations Handlers
  const handleBulkAction = useCallback(async (action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    if (selectedUsers.size === 0) {
      showError('Please select at least one user');
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(
        `⚠️ Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    const toastId = showLoading(`Performing bulk ${action} on ${selectedUsers.size} user(s)...`);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (action === 'delete') {
        setUsers(prev => prev.filter(user => !selectedUsers.has(user.id)));
      } else {
        setUsers(prev => prev.map(user => {
          if (selectedUsers.has(user.id)) {
            if (action === 'activate') return { ...user, status: 'active' as const };
            if (action === 'deactivate') return { ...user, status: 'inactive' as const };
            if (action === 'suspend') return { ...user, status: 'suspended' as const };
          }
          return user;
        }));
      }
      
      setSelectedUsers(new Set());
      setShowBulkOperationsModal(false);
      dismissLoadingAndShowSuccess(toastId, `Bulk ${action} completed successfully!`);
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleBulkAction');
      dismissLoadingAndShowError(toastId, `Failed to perform bulk ${action}`);
    }
  }, [selectedUsers]);

  // Report Generation Handler
  const handleGenerateReport = useCallback(async () => {
    if (!reportForm.startDate || !reportForm.endDate) {
      showError('Please select start and end dates');
      return;
    }

    const toastId = showLoading('Generating report...');
    try {
      // Simulate API call to backend
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In production, this would be:
      // const response = await apiService.generateAccessReport(reportForm);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `access-report-${reportForm.startDate}-${reportForm.endDate}.${reportForm.format}`;
      // link.click();
      
      setShowReportGenerationModal(false);
      dismissLoadingAndShowSuccess(
        toastId,
        `Report generated successfully! Format: ${reportForm.format.toUpperCase()}. ` +
        `Date range: ${reportForm.startDate} to ${reportForm.endDate}.`
      );
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleGenerateReport');
      dismissLoadingAndShowError(toastId, 'Failed to generate report');
    }
  }, [reportForm]);

  // Hardware Late-Sync Handler
  const handleSyncCachedEvents = useCallback(async (accessPointId: string) => {
    const accessPoint = accessPoints.find(ap => ap.id === accessPointId);
    if (!accessPoint || !accessPoint.cachedEvents || accessPoint.cachedEvents.length === 0) {
      showError('No cached events found for this access point');
      return;
    }

    const unsyncedEvents = accessPoint.cachedEvents.filter(e => !e.synced);
    if (unsyncedEvents.length === 0) {
      showSuccess('All events are already synced');
      return;
    }

    setSyncingAccessPointId(accessPointId);
    const toastId = showLoading(`Syncing ${unsyncedEvents.length} cached event(s) from "${accessPoint.name}"...`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Convert cached events to access events and add to main array
      const newAccessEvents: AccessEvent[] = unsyncedEvents.map(cached => ({
        id: cached.id,
        userId: cached.userId || 'unknown',
        userName: cached.userName || 'Unknown User',
        accessPointId: cached.accessPointId,
        accessPointName: cached.accessPointName,
        action: cached.action,
        timestamp: cached.timestamp,
        location: accessPoint.location,
        accessMethod: accessPoint.accessMethod
      }));
      
      setAccessEvents(prev => [...newAccessEvents, ...prev]);
      
      // Mark cached events as synced
      setAccessPoints(prev => prev.map(ap => 
        ap.id === accessPointId
          ? { 
              ...ap, 
              cachedEvents: ap.cachedEvents?.map(e => ({ ...e, synced: true })) || []
            }
          : ap
      ));
      
      setSyncingAccessPointId(null);
      dismissLoadingAndShowSuccess(toastId, `Successfully synced ${unsyncedEvents.length} event(s) from "${accessPoint.name}"`);
    } catch (error) {
      ErrorHandlerService.logError(error, 'handleSyncCachedEvents');
      setSyncingAccessPointId(null);
      dismissLoadingAndShowError(toastId, 'Failed to sync cached events');
    }
  }, [accessPoints]);

  // Time-based Access Validation with UTC Timezone Handling + Priority Stack
  const isAccessAllowed = useCallback((user: User, accessPointId: string): boolean => {
    // SECURITY FIX 6: Use UTC time instead of browser-local time to prevent timezone mismatches
    const now = new Date();
    
    // CRITICAL FIX: Access Priority Stack (Permanent > Temporary > Emergency)
    // Priority 1: Emergency Override (lowest priority - only if no other access)
    // Priority 2: Permanent/Scheduled Access (highest priority - never expires)
    // Priority 3: Temporary Access (medium priority - expires)
    
    // Check emergency mode (lowest priority - only applies if no scheduled/temporary access)
    const hasEmergencyOverride = emergencyMode === 'unlock';
    const isEmergencyLockdown = emergencyMode === 'lockdown';
    
    if (isEmergencyLockdown) return false;

    // Priority 1: Check Permanent/Scheduled Access (highest priority - never expires)
    let hasPermanentAccess = false;
    if (user.accessSchedule) {
      const schedule = user.accessSchedule;
      const scheduleTimezone = schedule.timezone || 'UTC';
      
      // Get current day in schedule timezone
      const currentDayInTZ = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        timeZone: scheduleTimezone 
      }).toLowerCase();
      
      if (schedule.days.includes(currentDayInTZ)) {
        // Parse schedule times (assumed to be in schedule timezone)
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
        
        // Get current time in schedule timezone
        const currentTimeInTZ = new Date(now.toLocaleString('en-US', { timeZone: scheduleTimezone }));
        const currentHourInTZ = currentTimeInTZ.getHours();
        const currentMinInTZ = currentTimeInTZ.getMinutes();
        
        const currentTotalMinutes = currentHourInTZ * 60 + currentMinInTZ;
        const startTotalMinutes = startHour * 60 + startMin;
        const endTotalMinutes = endHour * 60 + endMin;

        if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
          hasPermanentAccess = true;
        }
      }
    }
    
    // Also check if user has permanent access via permissions (role-based)
    const accessPoint = accessPoints.find(ap => ap.id === accessPointId);
    if (accessPoint && user.permissions) {
      // Check if any of the user's permissions match the access point permissions
      const hasPermissionMatch = accessPoint.permissions.some(perm => user.permissions.includes(perm));
      if (hasPermissionMatch) {
        hasPermanentAccess = true;
      }
    }

    // Priority 2: Check Temporary Access (medium priority - expires but doesn't override permanent)
    let hasTemporaryAccess = false;
    if (user.temporaryAccesses) {
      const activeTempAccess = user.temporaryAccesses.find(temp => {
        const start = new Date(temp.startTime);
        const end = new Date(temp.endTime);
        // ISO timestamps are already in UTC, so direct comparison works
        return now >= start && now <= end && temp.accessPointIds.includes(accessPointId);
      });
      if (activeTempAccess) {
        hasTemporaryAccess = true;
      }
    }

    // Priority Stack Resolution: Permanent > Temporary > Emergency
    // If permanent access exists, it always takes precedence (never expires)
    if (hasPermanentAccess) return true;
    
    // If temporary access exists, use it (even if expired, permanent would have been checked first)
    if (hasTemporaryAccess) return true;
    
    // Only use emergency override if no permanent or temporary access exists
    if (hasEmergencyOverride) return true;

    return false;
  }, [emergencyMode, accessPoints]);

  // Memoized filtered arrays for performance (Gold Standard)
  const filteredUsers = useMemo(() => {
    let filtered = (users || []).filter(u => u);
    
    // Apply search filter
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query))
      );
    }
    
    // Apply role filter
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }
    
    // Apply status filter
    if (userStatusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === userStatusFilter);
    }
    
    return filtered;
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  const filteredAccessPoints = useMemo(() => {
    let filtered = (accessPoints || []).filter(ap => ap);
    
    // Apply search filter
    if (accessPointSearchQuery.trim()) {
      const query = accessPointSearchQuery.toLowerCase();
      filtered = filtered.filter(point => 
        point.name.toLowerCase().includes(query) ||
        point.location.toLowerCase().includes(query) ||
        point.type.toLowerCase().includes(query) ||
        point.accessMethod.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (accessPointTypeFilter !== 'all') {
      filtered = filtered.filter(point => point.type === accessPointTypeFilter);
    }
    
    // Apply status filter
    if (accessPointStatusFilter !== 'all') {
      filtered = filtered.filter(point => point.status === accessPointStatusFilter);
    }
    
    return filtered;
  }, [accessPoints, accessPointSearchQuery, accessPointTypeFilter, accessPointStatusFilter]);

  // Enhanced Tab Content Rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
  return (
          <div className="space-y-6">
            {/* Security Alert Banner - TOP PRIORITY */}
            <Card className="backdrop-blur-xl bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <i className="fas fa-shield-alt text-white text-lg" />
        </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900">Security Alert</h3>
                      <p className="text-red-700 text-sm">Unauthorized access attempt detected at Executive Floor - 2 minutes ago</p>
                      <p className="text-xs text-red-600 mt-1">
                        <i className="fas fa-link mr-1" />
                        Auto-linked to Incident Log #1234
                      </p>
              </div>
              </div>
                  <div className="flex space-x-2">
          <Button
                      size="sm"
                      onClick={() => {
                        showSuccess('Security response initiated');
                        // Integration: Create incident in Incident Log
                        navigate('/modules/event-log');
                      }}
                    >
                      <i className="fas fa-shield-alt mr-1" />
                      Secure Area
          </Button>
                <Button
                      size="sm"
                      variant="outline"
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Alert acknowledged')}
                    >
                      <i className="fas fa-check mr-1" />
                      Acknowledge
                </Button>
            </div>
        </div>
              </CardContent>
            </Card>

            {/* Module Integration Status */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-plug text-white" />
                  </div>
                  System Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Incident Log</span>
                    </div>
                    <span className="text-xs text-green-600 font-semibold">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Patrol Module</span>
                    </div>
                    <span className="text-xs text-green-600 font-semibold">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-clock text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-slate-700">PMS Integration</span>
                    </div>
                    <span className="text-xs text-yellow-600 font-semibold">Pending</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  <i className="fas fa-info-circle mr-1" />
                  Failed access attempts automatically create incidents. Access violations trigger patrol assignments.
                </p>
              </CardContent>
            </Card>

        {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Access Points */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">TOTAL</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  <i className="fas fa-door-open text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Access Points</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.totalAccessPoints}
                </h3>
                    <div className="flex items-center text-xs text-slate-500">
                      <i className="fas fa-check-circle text-green-400 mr-1" />
                      {metrics.activeAccessPoints} active
                    </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  <i className="fas fa-users text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.activeUsers}
                </h3>
                    <div className="flex items-center text-xs text-slate-500">
                      <i className="fas fa-user-check text-green-400 mr-1" />
                      {metrics.totalUsers} total
                    </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Events */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">TODAY</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  <i className="fas fa-chart-line text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Access Events</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.todayAccessEvents}
                </h3>
                    <div className="flex items-center text-xs text-slate-500">
                      <i className="fas fa-clock text-blue-400 mr-1" />
                      {metrics.averageResponseTime} avg response
                    </div>
              </div>
            </CardContent>
          </Card>

              {/* Security Score */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">SECURE</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                      <i className="fas fa-shield-alt text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Security Score</p>
                <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.securityScore}%
                </h3>
                    <div className="flex items-center text-xs text-slate-500">
                      <i className="fas fa-sync text-blue-400 mr-1" />
                      Last scan: {new Date(metrics.lastSecurityScan).toLocaleDateString()}
                    </div>
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Emergency Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-shield-alt text-white" />
                    </div>
                    Emergency Actions
                  </div>
                  {emergencyMode !== 'normal' && (
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${
                      emergencyMode === 'lockdown' 
                        ? 'text-red-800 bg-red-100' 
                        : 'text-orange-800 bg-orange-100'
                    }`}>
                      {emergencyMode === 'lockdown' ? '🔒 LOCKDOWN ACTIVE' : '🔓 UNLOCK ACTIVE'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="destructive"
                    className="h-16 flex-col"
                    onClick={handleEmergencyLockdown}
                    disabled={emergencyMode === 'lockdown'}
                  >
                    <i className="fas fa-lock text-xl mb-2" />
                    Emergency Lockdown
                  </Button>
                  <Button
                    variant="primary"
                    className="h-16 flex-col"
                    onClick={handleEmergencyUnlock}
                    disabled={emergencyMode === 'unlock'}
                  >
                    <i className="fas fa-unlock text-xl mb-2" />
                    Emergency Unlock
                  </Button>
                  {emergencyMode !== 'normal' && (
                    <Button
                      variant="primary"
                      className="h-16 flex-col"
                      onClick={handleNormalMode}
                    >
                      <i className="fas fa-check-circle text-xl mb-2" />
                      Restore Normal
                    </Button>
                  )}
                  {emergencyMode === 'normal' && (
                    <Button
                      variant="primary"
                      className="h-16 flex-col"
                      onClick={() => showSuccess('Security scan initiated')}
                    >
                      <i className="fas fa-search text-xl mb-2" />
                      Security Scan
                    </Button>
                  )}
                </div>
                {emergencyMode !== 'normal' && (
                  <div className="mt-4 space-y-3">
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <p className="text-sm text-amber-800">
                      <i className="fas fa-exclamation-triangle mr-2" />
                      <strong>Emergency Mode Active:</strong> All access points are {emergencyMode === 'lockdown' ? 'locked' : 'unlocked'}. 
                      Remember to restore normal mode when the emergency is resolved.
                    </p>
                  </div>
                  {/* CRITICAL FIX: Emergency Timeout Countdown Display */}
                          {/* CRITICAL FIX: Emergency Timeout Countdown Display */}
                          {emergencyMode === 'unlock' && emergencyController && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-red-900">
                          <i className="fas fa-clock mr-2"></i>
                          Auto-Relock Countdown
                        </p>
                        <EmergencyTimeoutCountdownDisplay 
                          startTimestamp={emergencyController.timestamp}
                          durationSeconds={emergencyController.timeoutDuration || emergencyTimeoutDuration}
                        />
                      </div>
                      <p className="text-xs text-red-700">
                        Access points will automatically relock after timeout. Click "Restore Normal" to extend or disable timeout.
                      </p>
                    </div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>

            {/* CRITICAL FIX: Held-Open Alarm Display */}
            {heldOpenAlerts.filter(a => !a.acknowledged).length > 0 && (
              <Card className="bg-red-50 border-2 border-red-300 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mr-2 shadow-lg animate-pulse">
                      <i className="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    🚨 Held-Open Alarm ({heldOpenAlerts.filter(a => !a.acknowledged).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {heldOpenAlerts.filter(a => !a.acknowledged).map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border-2 ${
                        alert.severity === 'critical' ? 'bg-red-100 border-red-500' : 'bg-orange-100 border-orange-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'warning'} size="sm">
                                {alert.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                              </Badge>
                              <span className="font-semibold text-slate-900">{alert.accessPointName}</span>
                            </div>
                            <p className="text-sm text-slate-700 mb-1">
                              <i className="fas fa-map-marker-alt mr-2"></i>
                              {alert.location}
                            </p>
                            <p className="text-sm text-slate-600">
                              <i className="fas fa-clock mr-2"></i>
                              Held open for: <strong>{AccessControlUtilities.formatDuration(alert.duration)}</strong>
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              Opened at: {new Date(alert.openedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setHeldOpenAlerts(prev => prev.map(a => 
                                a.id === alert.id 
                                  ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: currentUser?.email || 'System' }
                                  : a
                              ));
                              showSuccess(`Held-open alarm for "${alert.accessPointName}" acknowledged`);
                            }}
                          >
                            <i className="fas fa-check mr-1"></i>
                            Acknowledge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real-Time Status Overview */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-broadcast-tower text-white" />
                    </div>
                    Real-Time Status
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    LIVE
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Online Access Points</span>
                      <span className="text-lg font-bold text-green-600">{metrics.activeAccessPoints}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${(metrics.activeAccessPoints / metrics.totalAccessPoints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Active Users</span>
                      <span className="text-lg font-bold text-slate-900">{metrics.activeUsers}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(metrics.activeUsers / metrics.totalUsers) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">System Uptime</span>
                      <span className="text-lg font-bold text-green-600">{metrics.systemUptime}</span>
                    </div>
                    <div className="text-xs text-slate-500">Last 30 days</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Access Events */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-history text-white" />
                  </div>
                  Recent Access Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.action === 'granted' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <i className={`fas ${
                            event.action === 'granted' ? 'fa-check text-green-700' : 'fa-times text-red-700'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{event.userName}</h4>
                          <p className="text-sm text-slate-600">{event.accessPointName}</p>
                          <p className="text-xs text-slate-500">{event.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          event.action === 'granted' 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {event.action}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'access-points':
        return (
          <div className="space-y-6">
            {/* Access Points Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Access Points Management</h2>
                <p className="text-slate-600">Manage doors, gates, elevators, and access methods</p>
                  </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowCreateAccessPoint(true);
                    setIsFormDirty(false);
                  }}
                >
                    <i className="fas fa-plus mr-2" />
                    Add Access Point
                  </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Bulk operations')}
                >
                  <i className="fas fa-tasks mr-2" />
                  Bulk Operations
                </Button>
                            </div>
                            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <SearchBar
                    value={accessPointSearchQuery}
                    onChange={setAccessPointSearchQuery}
                    placeholder="Search access points..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type Filter</label>
                  <select
                    value={accessPointTypeFilter}
                    onChange={(e) => setAccessPointTypeFilter(e.target.value as typeof accessPointTypeFilter)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="door">Door</option>
                    <option value="gate">Gate</option>
                    <option value="elevator">Elevator</option>
                    <option value="turnstile">Turnstile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status Filter</label>
                  <select
                    value={accessPointStatusFilter}
                    onChange={(e) => setAccessPointStatusFilter(e.target.value as typeof accessPointStatusFilter)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              
              {/* Active Filter Badges */}
              {(accessPointSearchQuery || accessPointTypeFilter !== 'all' || accessPointStatusFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-600 font-medium">Active filters:</span>
                  {accessPointSearchQuery && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setAccessPointSearchQuery('')}
                    >
                      Search: "{accessPointSearchQuery}"
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  {accessPointTypeFilter !== 'all' && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setAccessPointTypeFilter('all')}
                    >
                      Type: {accessPointTypeFilter}
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  {accessPointStatusFilter !== 'all' && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setAccessPointStatusFilter('all')}
                    >
                      Status: {accessPointStatusFilter}
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAccessPointSearchQuery('');
                      setAccessPointTypeFilter('all');
                      setAccessPointStatusFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Access Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccessPoints.length > 0 ? (
                filteredAccessPoints.map((point) => (
                <Card key={point.id} className={`bg-white border-[1.5px] shadow-sm hover:shadow-md transition-all duration-200 relative ${
                  point.isOnline === false ? 'border-red-300 opacity-75' : 'border-slate-200'
                }`}>
                  {/* Offline Hardware Overlay */}
                  {point.isOnline === false && (
                    <div className="absolute inset-0 bg-red-50/80 border-2 border-red-300 rounded-lg flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="text-center p-4">
                        <i className="fas fa-unlink text-red-600 text-3xl mb-2"></i>
                        <p className="text-sm font-semibold text-red-900">Hardware Disconnected</p>
                        <p className="text-xs text-red-700 mt-1">Access point is offline</p>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {point.isOnline === false && (
                          <Badge variant="destructive" size="sm">
                            <i className="fas fa-unlink mr-1"></i>
                            Offline
                          </Badge>
                        )}
                        <Badge
                          variant={
                            point.status === 'active' ? 'success' :
                            point.status === 'maintenance' ? 'warning' :
                            'destructive'
                          }
                          size="sm"
                        >
                          {point.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-slate-600">
                        <i className="fas fa-map-marker-alt mr-2 text-slate-600" />
                        {point.location}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <i className="fas fa-cog mr-2 text-slate-600" />
                        {point.type} • {point.accessMethod}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <i className="fas fa-shield-alt mr-2 text-slate-600" />
                        Security: {point.securityLevel}
                      </div>
                      {/* Sensor Status */}
                      {point.sensorStatus && (
                        <div className="flex items-center text-sm">
                          <i className={`fas mr-2 ${
                            point.sensorStatus === 'closed' ? 'fa-lock text-green-600' :
                            point.sensorStatus === 'open' ? 'fa-unlock text-blue-600' :
                            point.sensorStatus === 'forced' ? 'fa-exclamation-triangle text-red-600' :
                            'fa-clock text-yellow-600'
                          }`} />
                          <span className={`font-medium ${
                            point.sensorStatus === 'closed' ? 'text-green-700' :
                            point.sensorStatus === 'open' ? 'text-blue-700' :
                            point.sensorStatus === 'forced' ? 'text-red-700' :
                            'text-yellow-700'
                          }`}>
                            Sensor: {point.sensorStatus.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {/* Power Source & Battery */}
                      {point.powerSource && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <i className={`fas mr-2 ${
                              point.powerSource === 'mains' ? 'fa-plug text-green-600' : 'fa-battery-half text-yellow-600'
                            }`} />
                            <span>Power: {point.powerSource === 'mains' ? 'Mains' : 'Battery'}</span>
                          </div>
                          {point.powerSource === 'battery' && point.batteryLevel !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    point.batteryLevel > 50 ? 'bg-green-500' :
                                    point.batteryLevel > 20 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${point.batteryLevel}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${
                                point.batteryLevel > 50 ? 'text-green-700' :
                                point.batteryLevel > 20 ? 'text-yellow-700' :
                                'text-red-700'
                              }`}>
                                {point.batteryLevel}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Access Count:</span>
                      <span className="font-semibold text-slate-900">{point.accessCount}</span>
                    </div>

                    {/* CRITICAL FIX: Hardware Late-Sync Button */}
                    {point.isOnline && point.cachedEvents && point.cachedEvents.filter(e => !e.synced).length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-exclamation-circle text-yellow-600"></i>
                            <span className="text-sm font-medium text-yellow-900">
                              {point.cachedEvents.filter(e => !e.synced).length} cached event(s) available
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncCachedEvents(point.id)}
                            disabled={syncingAccessPointId === point.id}
                            className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                          >
                            {syncingAccessPointId === point.id ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-1"></i>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-sync mr-1"></i>
                                Sync Events
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => showSuccess(`Managing ${point.name}`)}
                      >
                        <i className="fas fa-edit mr-1" />
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleAccessPoint(point.id)}
                        disabled={point.isOnline === false}
                        title={point.isOnline === false ? 'Access point is offline' : `Toggle ${point.name}`}
                      >
                        <i className={`fas ${point.status === 'active' ? 'fa-lock' : 'fa-unlock'} mr-1`} />
                        {point.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <EmptyState
                      icon="fas fa-search"
                      title={accessPointSearchQuery || accessPointTypeFilter !== 'all' || accessPointStatusFilter !== 'all' 
                        ? "No access points found" 
                        : "No access points configured"}
                      description={accessPointSearchQuery || accessPointTypeFilter !== 'all' || accessPointStatusFilter !== 'all'
                        ? `No access points match your filters. Try adjusting your search or filters.`
                        : "Add your first access point to start managing access control"}
                      action={
                        !accessPointSearchQuery && accessPointTypeFilter === 'all' && accessPointStatusFilter === 'all' ? {
                          label: 'Add Access Point',
                          onClick: () => setShowCreateAccessPoint(true),
                          variant: 'primary' as const
                        } : undefined
                      }
                    />
                  </div>
                )}
              </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <p className="text-slate-600">Manage user access levels, permissions, and roles</p>
                  </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowCreateUser(true);
                    setIsFormDirty(false);
                  }}
                >
                  <i className="fas fa-user-plus mr-2" />
                    Add User
                  </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setTemporaryAccessForm({ userId: '', accessPointIds: [], startTime: '', endTime: '', reason: '' });
                    setShowTemporaryAccessModal(true);
                    setIsFormDirty(false);
                  }}
                >
                  <i className="fas fa-clock mr-2" />
                  Grant Temporary Access
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => {
                    if (selectedUsers.size === 0) {
                      showError('Please select at least one user');
                      return;
                    }
                    setShowBulkOperationsModal(true);
                  }}
                  disabled={selectedUsers.size === 0}
                >
                  <i className="fas fa-users-cog mr-2" />
                  Bulk Operations {selectedUsers.size > 0 && `(${selectedUsers.size})`}
                </Button>
              </div>
            </div>

            {/* Visitor Badge Quick Actions */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-id-badge text-white" />
                  </div>
                  Visitor Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setVisitorForm({
                        name: '',
                        email: '',
                        phone: '',
                        company: '',
                        photoUrl: '',
                        idDocumentUrl: '',
                        expectedCheckOutTime: '',
                        accessPointIds: []
                      });
                      setIsFormDirty(false);
                      setShowVisitorRegistration(true);
                    }}
                  >
                    <i className="fas fa-user-plus mr-2" />
                    Register Visitor
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      // Print badge for most recently registered visitor
                      const lastVisitor = users.filter(u => u.role === 'guest').sort((a, b) => {
                        const aTime = a.lastAccess ? new Date(a.lastAccess).getTime() : 0;
                        const bTime = b.lastAccess ? new Date(b.lastAccess).getTime() : 0;
                        return bTime - aTime;
                      })[0];
                      
                      if (lastVisitor) {
                        showSuccess(`Printing badge for visitor: ${lastVisitor.name} (Badge ID: ${lastVisitor.employeeId})`);
                      } else {
                        showError('No visitors found. Please register a visitor first.');
                      }
                    }}
                  >
                    <i className="fas fa-print mr-2" />
                    Print Badge
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setTemporaryAccessForm({ userId: '', accessPointIds: [], startTime: '', endTime: '', reason: 'Visitor access' });
                      setShowTemporaryAccessModal(true);
                    }}
                  >
                    <i className="fas fa-clock mr-2" />
                    Grant Visitor Access
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  <i className="fas fa-info-circle mr-1" />
                  Visitor badges automatically expire. Integration with Banned Individuals database active.
                </p>
              </CardContent>
            </Card>

            {/* Search and Filter Bar */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <SearchBar
                    value={userSearchQuery}
                    onChange={setUserSearchQuery}
                    placeholder="Search users by name, email, department..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Filter</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status Filter</label>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as typeof userStatusFilter)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              {/* Active Filter Badges */}
              {(userSearchQuery || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-600 font-medium">Active filters:</span>
                  {userSearchQuery && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setUserSearchQuery('')}
                    >
                      Search: "{userSearchQuery}"
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  {userRoleFilter !== 'all' && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setUserRoleFilter('all')}
                    >
                      Role: {userRoleFilter}
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  {userStatusFilter !== 'all' && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setUserStatusFilter('all')}
                    >
                      Status: {userStatusFilter}
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserRoleFilter('all');
                      setUserStatusFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Users Table */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-users text-white" />
                    </div>
                    Active Users
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedUsers.size > 0 && (
                      <span className="text-sm font-medium text-[#2563eb]">
                        {selectedUsers.size} selected
                      </span>
                    )}
                    <span className="text-sm font-normal text-slate-600">
                      {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length > 0 && (
                  <div className="mb-4 pb-3 border-b border-slate-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="mr-2 w-4 h-4 text-[#2563eb] border-slate-300 rounded focus:ring-[#2563eb]"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Select All ({filteredUsers.length})
                      </span>
                    </label>
                  </div>
                )}
                <div className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user.id} className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors ${
                        selectedUsers.has(user.id) ? 'ring-2 ring-[#2563eb] bg-blue-50' : ''
                      }`}>
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.id);
                              } else {
                                newSelected.delete(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                            className="mr-2 w-4 h-4 text-[#2563eb] border-slate-300 rounded focus:ring-[#2563eb]"
                          />
                          <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 text-white">
                            {user.avatar}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-slate-900">{user.name}</h4>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            <p className="text-xs text-slate-500">{user.department} • {user.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              user.status === 'active' ? 'success' :
                              user.status === 'inactive' ? 'secondary' :
                              'destructive'
                            }
                            size="sm"
                          >
                            {user.status}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {user.accessLevel}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleEditUser(user);
                                setIsFormDirty(false);
                              }}
                            >
                              <i className="fas fa-edit mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete user "${user.name}"? This cannot be undone.`)) {
                                  handleDeleteUser(user.id);
                                }
                              }}
                            >
                              <i className="fas fa-trash mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon="fas fa-search"
                      title={userSearchQuery || userRoleFilter !== 'all' || userStatusFilter !== 'all'
                        ? "No users found"
                        : "No users configured"}
                      description={userSearchQuery || userRoleFilter !== 'all' || userStatusFilter !== 'all'
                        ? `No users match your filters. Try adjusting your search or filters.`
                        : "Add your first user to start managing access control"}
                      action={
                        !userSearchQuery && userRoleFilter === 'all' && userStatusFilter === 'all' ? {
                          label: 'Add User',
                          onClick: () => {
                            setShowCreateUser(true);
                            setIsFormDirty(false);
                          },
                          variant: 'primary' as const
                        } : undefined
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'events':
        return (
          <div className="space-y-6">
            {/* Access Events Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Access Events</h2>
                <p className="text-slate-600">Monitor real-time access logs and security events</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => showSuccess('Exporting events')}
                >
                  <i className="fas fa-download mr-2" />
                  Export Events
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Filtering events')}
                >
                  <i className="fas fa-filter mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Events Table */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-list-alt text-white" />
                  </div>
                  Recent Access Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.action === 'granted' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <i className={`fas ${
                            event.action === 'granted' ? 'fa-check text-green-700' : 'fa-times text-red-700'
                          }`} />
                            </div>
                            <div>
                          <h4 className="font-semibold text-slate-900">{event.userName}</h4>
                          <p className="text-sm text-slate-600">{event.accessPointName}</p>
                          <p className="text-xs text-slate-500">{event.location} • {event.accessMethod}</p>
                          {event.reason && (
                            <p className="text-xs text-red-700 mt-1">{event.reason}</p>
                          )}
                            </div>
                          </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          event.action === 'granted' 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {event.action}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                        </p>
                          </div>
                        </div>
                  ))}
                          </div>
                      </CardContent>
                    </Card>
          </div>
        );

      case 'ai-analytics':
        return (
          <ErrorBoundary>
            <div className="space-y-6">
              {/* AI Analytics Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">AI Analytics</h2>
                  <p className="text-slate-600">Behavior analysis, anomaly detection, and predictive insights</p>
                </div>
              </div>
              
              {/* AI Behavior Analysis Panel - Wrapped in ErrorBoundary for graceful failure */}
              <BehaviorAnalysisPanel events={accessEvents} users={users} />
            </div>
          </ErrorBoundary>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            {/* Reports Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
                <p className="text-slate-600">Access patterns, compliance reports, and analytics</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => showSuccess('Generating report...')}
                >
                  <i className="fas fa-file-pdf mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Exporting CSV...')}
                >
                  <i className="fas fa-file-csv mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Access Pattern Report */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening Access Pattern Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-chart-line text-white" />
                    </div>
                    Access Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Peak times, location trends, and usage patterns</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Peak Hour:</span>
                      <span className="font-semibold text-slate-900">2:00 PM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Most Active:</span>
                      <span className="font-semibold text-slate-900">Main Entrance</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Failed Access Report */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening Failed Access Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-exclamation-triangle text-white" />
                    </div>
                    Failed Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Denied attempts, security violations, and alerts</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Today:</span>
                      <span className="font-semibold text-red-600">{metrics.deniedAccessEvents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">This Week:</span>
                      <span className="font-semibold text-slate-900">142</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Report */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening Compliance Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-shield-check text-white" />
                    </div>
                    Compliance Audit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Security audit trail and compliance reports</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Last Audit:</span>
                      <span className="font-semibold text-slate-900">{new Date(metrics.lastSecurityScan).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Score:</span>
                      <span className="font-semibold text-green-600">{metrics.securityScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Activity Report */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening User Activity Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-users text-white" />
                    </div>
                    User Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Individual user access history and patterns</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Users:</span>
                      <span className="font-semibold text-slate-900">{metrics.totalUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Active Today:</span>
                      <span className="font-semibold text-green-600">{metrics.activeUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Access Point Utilization */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening Access Point Utilization Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-door-open text-white" />
                    </div>
                    Point Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Usage statistics and performance metrics</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Points:</span>
                      <span className="font-semibold text-slate-900">{metrics.totalAccessPoints}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Utilization:</span>
                      <span className="font-semibold text-blue-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time-Based Analysis */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => showSuccess('Opening Time-Based Analysis Report...')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-clock text-white" />
                    </div>
                    Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Hourly, daily, and weekly access trends</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Peak Day:</span>
                      <span className="font-semibold text-slate-900">Friday</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Avg. Daily:</span>
                      <span className="font-semibold text-blue-600">1,247</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'configuration':
        return (
          <div className="space-y-6">
            {/* Configuration Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Configuration</h2>
                <p className="text-slate-600">System settings, permissions, and security policies</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => showSuccess('Saving configuration')}
                >
                  <i className="fas fa-save mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Resetting settings')}
                >
                  <i className="fas fa-undo mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Configuration Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Settings */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-shield-alt text-white" />
                    </div>
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Biometric Authentication</h4>
                      <p className="text-sm text-slate-600">Enable biometric access for high-security areas</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Access Timeouts</h4>
                      <p className="text-sm text-slate-600">Configure automatic access expiration</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Emergency Override</h4>
                      <p className="text-sm text-slate-600">Emergency access protocols</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>

              {/* System Settings */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                      <i className="fas fa-cog text-white" />
                    </div>
                System Settings
              </CardTitle>
            </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Access Logging</h4>
                      <p className="text-sm text-slate-600">Configure access event logging</p>
                </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Notification Settings</h4>
                      <p className="text-sm text-slate-600">Access alert notifications</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">Backup & Recovery</h4>
                      <p className="text-sm text-slate-600">System backup configuration</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Access Point Grouping Section */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <i className="fas fa-layer-group text-white" />
              </div>
              Access Point Grouping
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAccessPointGroupForm({ name: '', description: '', accessPointIds: [] });
                setIsFormDirty(false);
                setShowAccessPointGroupModal(true);
              }}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Group
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Group access points together (e.g., "Floor 4", "Housekeeping Closets") for bulk permission management.
          </p>
          {accessPointGroups.length > 0 ? (
            <div className="space-y-3">
              {accessPointGroups.map((group) => (
                <div key={group.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{group.name}</h4>
                      <p className="text-sm text-slate-600 mb-2">{group.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          <i className="fas fa-door-open mr-1"></i>
                          {group.accessPointIds.length} access point{group.accessPointIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Created: {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`Delete group "${group.name}"? This will not delete the access points themselves.`)) {
                            setAccessPointGroups(prev => prev.filter(g => g.id !== group.id));
                            showSuccess(`Group "${group.name}" deleted`);
                          }
                        }}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fas fa-layer-group"
              title="No Access Point Groups"
              description="Create groups to manage multiple access points together (e.g., 'Floor 4', 'Housekeeping Closets')"
              action={{
                label: 'Create First Group',
                onClick: () => {
                  setAccessPointGroupForm({ name: '', description: '', accessPointIds: [] });
                  setIsFormDirty(false);
                  setShowAccessPointGroupModal(true);
                },
                variant: 'primary'
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Role-to-Zone Mapping Section */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <i className="fas fa-route text-white" />
              </div>
              Role-to-Zone Mapping
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setRoleZoneForm({ role: 'employee', zoneName: '', accessPointIds: [] });
                setIsFormDirty(false);
                setShowRoleZoneModal(true);
              }}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Mapping
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Map roles (e.g., "Housekeeping", "Security") to access zones for automatic permission assignment.
          </p>
          {roleZoneMappings.length > 0 ? (
            <div className="space-y-3">
              {roleZoneMappings.map((mapping) => (
                <div key={mapping.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" size="sm" className="bg-[#2563eb] text-white">
                          {mapping.role}
                        </Badge>
                        <span className="font-semibold text-slate-900">→</span>
                        <Badge variant="outline" size="sm">
                          {mapping.zoneName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" size="sm">
                          <i className="fas fa-door-open mr-1"></i>
                          {mapping.accessPointIds.length} access point{mapping.accessPointIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Updated: {new Date(mapping.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`Delete role-zone mapping for "${mapping.role}" → "${mapping.zoneName}"?`)) {
                            setRoleZoneMappings(prev => prev.filter(m => m.id !== mapping.id));
                            showSuccess(`Role-zone mapping deleted`);
                          }
                        }}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fas fa-route"
              title="No Role-Zone Mappings"
              description="Create mappings to automatically assign access points to users based on their role (e.g., 'Housekeeping' → 'Service Zone')"
              action={{
                label: 'Create First Mapping',
                onClick: () => {
                  setRoleZoneForm({ role: 'employee', zoneName: '', accessPointIds: [] });
                  setIsFormDirty(false);
                  setShowRoleZoneModal(true);
                },
                variant: 'primary'
              }}
            />
          )}
        </CardContent>
      </Card>
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-key text-white text-2xl" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Access Control
              </h1>
              <p className="text-slate-600 font-medium">
                Advanced access management and security control
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Sticky */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 border-b border-white/20 shadow-lg">
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

      {/* Create Access Point Modal */}
      <Modal
        isOpen={showCreateAccessPoint}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowCreateAccessPoint(false);
          setIsFormDirty(false);
        }}
        title="Create Access Point"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowCreateAccessPoint(false);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleCreateAccessPoint}
            >
              Create Access Point
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div>
                <label htmlFor="ap-name" className="block text-sm font-medium text-slate-700 mb-2">Access Point Name</label>
                <input
                  type="text"
                  id="ap-name"
                  value={accessPointForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAccessPointForm(prev => ({ ...prev, name: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter access point name"
                />
              </div>
              
              <div>
                <label htmlFor="ap-location" className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  id="ap-location"
                  value={accessPointForm.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAccessPointForm(prev => ({ ...prev, location: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter location"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ap-type" className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    id="ap-type"
                    value={accessPointForm.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setAccessPointForm(prev => ({ ...prev, type: e.target.value as 'door' | 'gate' | 'elevator' | 'turnstile' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="door">Door</option>
                    <option value="gate">Gate</option>
                    <option value="elevator">Elevator</option>
                    <option value="turnstile">Turnstile</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ap-method" className="block text-sm font-medium text-slate-700 mb-2">Access Method</label>
                  <select
                    id="ap-method"
                    value={accessPointForm.accessMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setAccessPointForm(prev => ({ ...prev, accessMethod: e.target.value as 'card' | 'biometric' | 'pin' | 'mobile' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="card">Card</option>
                    <option value="biometric">Biometric</option>
                    <option value="pin">PIN</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="ap-description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  id="ap-description"
                  value={accessPointForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setAccessPointForm(prev => ({ ...prev, description: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
            </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowCreateUser(false);
          setIsFormDirty(false);
        }}
        title="Create User"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowCreateUser(false);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="user-name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, name: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="user-email"
                    value={userForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, email: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-department" className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <input
                    type="text"
                    id="user-department"
                    value={userForm.department}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter department"
                  />
                </div>
                
                <div>
                  <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <select
                    id="user-role"
                    value={userForm.role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'employee' | 'guest' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-access-level" className="block text-sm font-medium text-slate-700 mb-2">Access Level</label>
                  <select
                    id="user-access-level"
                    value={userForm.accessLevel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setUserForm(prev => ({ ...prev, accessLevel: e.target.value as 'standard' | 'elevated' | 'restricted' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="elevated">Elevated</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="user-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    id="user-phone"
                    value={userForm.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, phone: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="user-employee-id" className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  id="user-employee-id"
                  value={userForm.employeeId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setUserForm(prev => ({ ...prev, employeeId: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>

              {/* Time-Based Access Schedule */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Access Schedule (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Allowed Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userForm.accessSchedule.days.includes(day)}
                            onChange={(e) => {
                              setUserForm(prev => ({
                                ...prev,
                                accessSchedule: {
                                  ...prev.accessSchedule,
                                  days: e.target.checked
                                    ? [...prev.accessSchedule.days, day]
                                    : prev.accessSchedule.days.filter(d => d !== day)
                                }
                              }));
                              setIsFormDirty(true);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-slate-700 capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="access-start-time" className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        id="access-start-time"
                        value={userForm.accessSchedule.startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setUserForm(prev => ({
                            ...prev,
                            accessSchedule: { ...prev.accessSchedule, startTime: e.target.value }
                          }));
                          setIsFormDirty(true);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="access-end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                      <input
                        type="time"
                        id="access-end-time"
                        value={userForm.accessSchedule.endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setUserForm(prev => ({
                            ...prev,
                            accessSchedule: { ...prev.accessSchedule, endTime: e.target.value }
                          }));
                          setIsFormDirty(true);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-revoke-checkout"
                      checked={userForm.autoRevokeAtCheckout}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setUserForm(prev => ({ ...prev, autoRevokeAtCheckout: e.target.checked }));
                        setIsFormDirty(true);
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="auto-revoke-checkout" className="text-sm text-slate-700">
                      Auto-revoke access at checkout (for guests)
                    </label>
                  </div>
                </div>
              </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditUser}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowEditUser(false);
          setSelectedUser(null);
          setIsFormDirty(false);
        }}
        title="Edit User"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowEditUser(false);
                setSelectedUser(null);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleUpdateUser}
            >
              Update User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="edit-user-name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, name: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-user-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="edit-user-email"
                    value={userForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, email: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-department" className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <input
                    type="text"
                    id="edit-user-department"
                    value={userForm.department}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter department"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-user-role" className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <select
                    id="edit-user-role"
                    value={userForm.role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'employee' | 'guest' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-access-level" className="block text-sm font-medium text-slate-700 mb-2">Access Level</label>
                  <select
                    id="edit-user-access-level"
                    value={userForm.accessLevel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setUserForm(prev => ({ ...prev, accessLevel: e.target.value as 'standard' | 'elevated' | 'restricted' }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="elevated">Elevated</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-user-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    id="edit-user-phone"
                    value={userForm.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setUserForm(prev => ({ ...prev, phone: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-user-employee-id" className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  id="edit-user-employee-id"
                  value={userForm.employeeId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setUserForm(prev => ({ ...prev, employeeId: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>
        </div>
      </Modal>

      {/* Temporary Access Grant Modal */}
      <Modal
        isOpen={showTemporaryAccessModal}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowTemporaryAccessModal(false);
          setIsFormDirty(false);
        }}
        title="Grant Temporary Access"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowTemporaryAccessModal(false);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleGrantTemporaryAccess}
            >
              Grant Access
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <div>
                <label htmlFor="temp-user" className="block text-sm font-medium text-slate-700 mb-2">User</label>
                <select
                  id="temp-user"
                  value={temporaryAccessForm.userId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemporaryAccessForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Access Points</label>
                <div className="border border-slate-300 rounded-md p-3 max-h-40 overflow-y-auto">
                  {accessPoints.map(point => (
                    <label key={point.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={temporaryAccessForm.accessPointIds.includes(point.id)}
                        onChange={(e) => {
                          setTemporaryAccessForm(prev => ({
                            ...prev,
                            accessPointIds: e.target.checked
                              ? [...prev.accessPointIds, point.id]
                              : prev.accessPointIds.filter(id => id !== point.id)
                          }));
                          setIsFormDirty(true);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">{point.name} - {point.location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="temp-start-time" className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    id="temp-start-time"
                    value={temporaryAccessForm.startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setTemporaryAccessForm(prev => ({ ...prev, startTime: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="temp-end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    id="temp-end-time"
                    value={temporaryAccessForm.endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setTemporaryAccessForm(prev => ({ ...prev, endTime: e.target.value }));
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="temp-reason" className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  id="temp-reason"
                  value={temporaryAccessForm.reason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setTemporaryAccessForm(prev => ({ ...prev, reason: e.target.value }));
                      setIsFormDirty(true);
                    }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter reason for temporary access"
                />
              </div>
        </div>
      </Modal>

      {/* Visitor Registration Modal */}
      <Modal
        isOpen={showVisitorRegistration}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowVisitorRegistration(false);
          setIsFormDirty(false);
        }}
        title="Register Visitor"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowVisitorRegistration(false);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleRegisterVisitor}
            >
              <i className="fas fa-user-plus mr-2"></i>
              Register & Print Badge
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="visitor-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                id="visitor-name"
                value={visitorForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setVisitorForm(prev => ({ ...prev, name: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter visitor name"
                required
              />
            </div>
            <div>
              <label htmlFor="visitor-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
              <input
                type="tel"
                id="visitor-phone"
                value={visitorForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setVisitorForm(prev => ({ ...prev, phone: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="visitor-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                id="visitor-email"
                value={visitorForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setVisitorForm(prev => ({ ...prev, email: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email (optional)"
              />
            </div>
            <div>
              <label htmlFor="visitor-company" className="block text-sm font-medium text-slate-700 mb-2">Company</label>
              <input
                type="text"
                id="visitor-company"
                value={visitorForm.company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setVisitorForm(prev => ({ ...prev, company: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name (optional)"
              />
            </div>
          </div>
          <div>
            <label htmlFor="visitor-checkout" className="block text-sm font-medium text-slate-700 mb-2">Expected Checkout Time *</label>
            <input
              type="datetime-local"
              id="visitor-checkout"
              value={visitorForm.expectedCheckOutTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setVisitorForm(prev => ({ ...prev, expectedCheckOutTime: e.target.value }));
                setIsFormDirty(true);
              }}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Access Points *</label>
            <div className="border border-slate-300 rounded-md p-3 max-h-40 overflow-y-auto">
              {accessPoints.map(point => (
                <label key={point.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={visitorForm.accessPointIds.includes(point.id)}
                    onChange={(e) => {
                      setVisitorForm(prev => ({
                        ...prev,
                        accessPointIds: e.target.checked
                          ? [...prev.accessPointIds, point.id]
                          : prev.accessPointIds.filter(id => id !== point.id)
                      }));
                      setIsFormDirty(true);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">{point.name} - {point.location}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-[#2563eb] p-4 rounded">
            <p className="text-sm text-slate-700">
              <i className="fas fa-info-circle mr-2 text-[#2563eb]"></i>
              Visitor will be checked against Banned Individuals database. Badge will auto-expire at checkout time.
            </p>
          </div>
        </div>
      </Modal>

      {/* Bulk Operations Modal */}
      <Modal
        isOpen={showBulkOperationsModal}
        onClose={() => {
          setShowBulkOperationsModal(false);
          setSelectedUsers(new Set());
        }}
        title={`Bulk Operations (${selectedUsers.size} selected)`}
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBulkOperationsModal(false);
                setSelectedUsers(new Set());
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="primary"
                onClick={() => handleBulkAction('activate')}
                disabled={selectedUsers.size === 0}
              >
                <i className="fas fa-check mr-2"></i>
                Activate
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleBulkAction('deactivate')}
                disabled={selectedUsers.size === 0}
              >
                <i className="fas fa-pause mr-2"></i>
                Deactivate
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleBulkAction('suspend')}
                disabled={selectedUsers.size === 0}
              >
                <i className="fas fa-ban mr-2"></i>
                Suspend
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                disabled={selectedUsers.size === 0}
              >
                <i className="fas fa-trash mr-2"></i>
                Delete
              </Button>
            </div>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Selected users: {selectedUsers.size}. Choose an action to apply to all selected users.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Warning:</strong> Bulk operations cannot be undone. Please review your selection carefully.
            </p>
          </div>
        </div>
      </Modal>

      {/* Report Generation Modal */}
      <Modal
        isOpen={showReportGenerationModal}
        onClose={() => {
          if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
          }
          setShowReportGenerationModal(false);
          setIsFormDirty(false);
        }}
        title="Generate Access Report"
        size="lg"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                  return;
                }
                setShowReportGenerationModal(false);
                setIsFormDirty(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleGenerateReport}
            >
              <i className={`fas fa-file-${reportForm.format === 'pdf' ? 'pdf' : 'csv'} mr-2`}></i>
              Generate {reportForm.format.toUpperCase()} Report
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="report-start-date" className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
              <input
                type="date"
                id="report-start-date"
                value={reportForm.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setReportForm(prev => ({ ...prev, startDate: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="report-end-date" className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
              <input
                type="date"
                id="report-end-date"
                value={reportForm.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setReportForm(prev => ({ ...prev, endDate: e.target.value }));
                  setIsFormDirty(true);
                }}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Types</label>
            <div className="flex flex-wrap gap-2">
              {['granted', 'denied', 'timeout'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportForm.eventTypes.includes(type)}
                    onChange={(e) => {
                      setReportForm(prev => ({
                        ...prev,
                        eventTypes: e.target.checked
                          ? [...prev.eventTypes, type]
                          : prev.eventTypes.filter(t => t !== type)
                      }));
                      setIsFormDirty(true);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-[#2563eb] p-4 rounded">
            <p className="text-sm text-slate-700">
              <i className="fas fa-info-circle mr-2 text-[#2563eb]"></i>
              Report will include all access events within the selected date range and filters.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccessControlModule;