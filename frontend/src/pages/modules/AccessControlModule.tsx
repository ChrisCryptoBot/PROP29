import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';
import { BehaviorAnalysisPanel } from '../../components/AccessControlModule/BehaviorAnalysisPanel';
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
    securityLevel: 'high'
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
    securityLevel: 'medium'
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
    securityLevel: 'critical'
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
    securityLevel: 'critical'
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
    securityLevel: 'medium'
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

const AccessControlModule: React.FC = () => {
  const navigate = useNavigate();
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
      showSuccess('User updated successfully!');
    } catch (error) {
      showError('Failed to update user');
    }
  }, [selectedUser, userForm]);

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
      showError('Failed to update access point');
    }
  }, []);

  // Emergency Override Handlers
  const handleEmergencyLockdown = useCallback(async () => {
    const confirmed = window.confirm('⚠️ EMERGENCY LOCKDOWN\n\nThis will lock ALL access points. Are you sure?');
    if (!confirmed) return;

    showLoading('Initiating emergency lockdown...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmergencyMode('lockdown');
      setAccessPoints(prev => prev.map(point => ({ ...point, status: 'disabled' as const })));
      showSuccess('Emergency lockdown activated! All access points are now locked.');
    } catch (error) {
      showError('Failed to initiate lockdown');
    }
  }, []);

  const handleEmergencyUnlock = useCallback(async () => {
    const confirmed = window.confirm('⚠️ EMERGENCY UNLOCK\n\nThis will unlock ALL access points. Are you sure?');
    if (!confirmed) return;

    showLoading('Initiating emergency unlock...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmergencyMode('unlock');
      setAccessPoints(prev => prev.map(point => ({ ...point, status: 'active' as const })));
      showSuccess('Emergency unlock activated! All access points are now unlocked.');
    } catch (error) {
      showError('Failed to initiate unlock');
    }
  }, []);

  const handleNormalMode = useCallback(async () => {
    showLoading('Restoring normal mode...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmergencyMode('normal');
      showSuccess('Normal mode restored.');
    } catch (error) {
      showError('Failed to restore normal mode');
    }
  }, []);

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

    showLoading('Granting temporary access...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTemporaryAccess: TemporaryAccess = {
        id: `temp-${Date.now()}`,
        ...temporaryAccessForm,
        grantedBy: 'Current User', // In real app, get from auth context
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
      setTemporaryAccessForm({
        userId: '',
        accessPointIds: [],
        startTime: '',
        endTime: '',
        reason: ''
      });
      showSuccess('Temporary access granted successfully!');
    } catch (error) {
      showError('Failed to grant temporary access');
    }
  }, [temporaryAccessForm]);

  // Time-based Access Validation
  const isAccessAllowed = useCallback((user: User, accessPointId: string): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check emergency mode
    if (emergencyMode === 'lockdown') return false;
    if (emergencyMode === 'unlock') return true;

    // Check temporary access
    if (user.temporaryAccesses) {
      const activeTempAccess = user.temporaryAccesses.find(temp => {
        const start = new Date(temp.startTime);
        const end = new Date(temp.endTime);
        return now >= start && now <= end && temp.accessPointIds.includes(accessPointId);
      });
      if (activeTempAccess) return true;
    }

    // Check scheduled access
    if (user.accessSchedule) {
      const schedule = user.accessSchedule;
      if (!schedule.days.includes(currentDay)) return false;
      
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const currentMinutes = currentHour * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return false;
      }
    }

    return true;
  }, [emergencyMode]);

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
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
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
                <h3 className="text-2xl font-bold text-blue-600">
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
                <h3 className="text-2xl font-bold text-blue-600">
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
                <h3 className="text-2xl font-bold text-blue-600">
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
                <h3 className="text-2xl font-bold text-blue-600">
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
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-16 flex-col"
                    onClick={handleEmergencyLockdown}
                    disabled={emergencyMode === 'lockdown'}
                  >
                    <i className="fas fa-lock text-xl mb-2" />
                    Emergency Lockdown
                  </Button>
                  <Button
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-16 flex-col"
                    onClick={handleEmergencyUnlock}
                    disabled={emergencyMode === 'unlock'}
                  >
                    <i className="fas fa-unlock text-xl mb-2" />
                    Emergency Unlock
                  </Button>
                  {emergencyMode !== 'normal' && (
                    <Button
                      className="!bg-green-600 hover:!bg-green-700 text-white h-16 flex-col"
                      onClick={handleNormalMode}
                    >
                      <i className="fas fa-check-circle text-xl mb-2" />
                      Restore Normal
                    </Button>
                  )}
                  {emergencyMode === 'normal' && (
                    <Button
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-16 flex-col"
                      onClick={() => showSuccess('Security scan initiated')}
                    >
                      <i className="fas fa-search text-xl mb-2" />
                      Security Scan
                    </Button>
                  )}
                </div>
                {emergencyMode !== 'normal' && (
                  <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <p className="text-sm text-amber-800">
                      <i className="fas fa-exclamation-triangle mr-2" />
                      <strong>Emergency Mode Active:</strong> All access points are {emergencyMode === 'lockdown' ? 'locked' : 'unlocked'}. 
                      Remember to restore normal mode when the emergency is resolved.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      <span className="text-lg font-bold text-blue-600">{metrics.activeUsers}</span>
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
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  onClick={() => setShowCreateAccessPoint(true)}
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

            {/* Access Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessPoints.map((point) => (
                <Card key={point.id} className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        point.status === 'active' 
                          ? 'text-green-800 bg-green-100' 
                          : point.status === 'maintenance'
                          ? 'text-yellow-800 bg-yellow-100'
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {point.status}
                      </span>
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
                          </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Access Count:</span>
                      <span className="font-semibold text-slate-900">{point.accessCount}</span>
                          </div>

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
                        onClick={() => showSuccess(`Testing ${point.name}`)}
                      >
                        <i className="fas fa-test-tube mr-1" />
                        Test
                      </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  onClick={() => setShowCreateUser(true)}
                >
                  <i className="fas fa-user-plus mr-2" />
                    Add User
                  </Button>
                <Button
                  className="!bg-green-600 hover:!bg-green-700 text-white"
                  onClick={() => {
                    setTemporaryAccessForm({ userId: '', accessPointIds: [], startTime: '', endTime: '', reason: '' });
                    setShowTemporaryAccessModal(true);
                  }}
                >
                  <i className="fas fa-clock mr-2" />
                  Grant Temporary Access
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Bulk user operations')}
                >
                  <i className="fas fa-users-cog mr-2" />
                  Bulk Operations
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
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => showSuccess('Opening visitor registration...')}
                  >
                    <i className="fas fa-user-plus mr-2" />
                    Register Visitor
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => showSuccess('Printing visitor badge...')}
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

            {/* Users Table */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fas fa-users text-white" />
                  </div>
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.status === 'active' 
                            ? 'text-green-800 bg-green-100' 
                            : user.status === 'inactive'
                            ? 'text-slate-800 bg-slate-100'
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {user.status}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 rounded">
                          {user.accessLevel}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <i className="fas fa-edit mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <i className="fas fa-trash mr-1" />
                            Delete
                          </Button>
                          </div>
                        </div>
                          </div>
                  ))}
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
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
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
          <div className="space-y-6">
            {/* AI Analytics Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">AI Analytics</h2>
                <p className="text-slate-600">Behavior analysis, anomaly detection, and predictive insights</p>
              </div>
            </div>
            
            {/* AI Behavior Analysis Panel */}
            <BehaviorAnalysisPanel events={accessEvents} users={users} />
          </div>
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
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
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
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
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

      {/* Create Access Point Modal */}
      {showCreateAccessPoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Access Point</h2>
              <button 
                onClick={() => setShowCreateAccessPoint(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="ap-name" className="block text-sm font-medium text-slate-700 mb-2">Access Point Name</label>
                <input
                  type="text"
                  id="ap-name"
                  value={accessPointForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessPointForm(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessPointForm(prev => ({ ...prev, location: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAccessPointForm(prev => ({ ...prev, type: e.target.value as 'door' | 'gate' | 'elevator' | 'turnstile' }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAccessPointForm(prev => ({ ...prev, accessMethod: e.target.value as 'card' | 'biometric' | 'pin' | 'mobile' }))}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAccessPointForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateAccessPoint(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAccessPoint}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Create Access Point
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create User</h2>
              <button 
                onClick={() => setShowCreateUser(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="user-name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'employee' | 'guest' }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserForm(prev => ({ ...prev, accessLevel: e.target.value as 'standard' | 'elevated' | 'restricted' }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({
                          ...prev,
                          accessSchedule: { ...prev.accessSchedule, startTime: e.target.value }
                        }))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="access-end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                      <input
                        type="time"
                        id="access-end-time"
                        value={userForm.accessSchedule.endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({
                          ...prev,
                          accessSchedule: { ...prev.accessSchedule, endTime: e.target.value }
                        }))}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-revoke-checkout"
                      checked={userForm.autoRevokeAtCheckout}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, autoRevokeAtCheckout: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="auto-revoke-checkout" className="text-sm text-slate-700">
                      Auto-revoke access at checkout (for guests)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateUser(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Edit User</h2>
              <button 
                onClick={() => setShowEditUser(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="edit-user-name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'employee' | 'guest' }))}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserForm(prev => ({ ...prev, accessLevel: e.target.value as 'standard' | 'elevated' | 'restricted' }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEditUser(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Update User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Access Grant Modal */}
      {showTemporaryAccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Grant Temporary Access</h2>
              <button 
                onClick={() => setShowTemporaryAccessModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemporaryAccessForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="temp-end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    id="temp-end-time"
                    value={temporaryAccessForm.endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemporaryAccessForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="temp-reason" className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  id="temp-reason"
                  value={temporaryAccessForm.reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemporaryAccessForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter reason for temporary access"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowTemporaryAccessModal(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGrantTemporaryAccess}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Grant Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlModule;