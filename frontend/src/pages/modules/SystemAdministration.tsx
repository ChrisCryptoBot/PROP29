import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
}

interface Integration {
  id: number;
  name: string;
  type: string;
  endpoint: string;
  status: string;
  lastSync: string;
}

interface NewUser {
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

interface NewIntegration {
  name: string;
  type: string;
  endpoint: string;
  status: string;
}

const SystemAdministration = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    role: 'user',
    department: '',
    status: 'active'
  });
  const [newIntegration, setNewIntegration] = useState<NewIntegration>({
    name: '',
    type: '',
    endpoint: '',
    status: 'active'
  });

  // 7 tabs as per original module (matching AdminTabs.tsx)
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'roles', label: 'Roles' },
    { id: 'properties', label: 'Properties' },
    { id: 'system', label: 'System' },
    { id: 'security', label: 'Security' },
    { id: 'audit', label: 'Audit Log' }
  ];

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUser = (user: NewUser): string | null => {
    if (!user.name.trim()) return 'Name is required';
    if (!user.email.trim()) return 'Email is required';
    if (!validateEmail(user.email)) return 'Invalid email format';
    if (!user.department.trim()) return 'Department is required';
    return null;
  };

  const validateIntegration = (integration: NewIntegration): string | null => {
    if (!integration.name.trim()) return 'Integration name is required';
    if (!integration.type.trim()) return 'Type is required';
    if (!integration.endpoint.trim()) return 'Endpoint is required';
    return null;
  };

  // Constants
  const ERROR_TIMEOUT = 5000;
  const API_TIMEOUT = 1000;

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), ERROR_TIMEOUT);
  }, []);

  const showSuccess = useCallback((message: string) => {
    // In a real app, this would use a toast notification
    alert(message);
  }, []);

  useEffect(() => {
    // Load initial data with error handling
    try {
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'IT', status: 'active', lastLogin: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', department: 'Security', status: 'active', lastLogin: '2024-01-14' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user', department: 'Operations', status: 'inactive', lastLogin: '2024-01-10' }
      ]);

      setIntegrations([
        { id: 1, name: 'Security Cameras', type: 'Camera System', endpoint: '192.168.1.100', status: 'active', lastSync: '2024-01-15 10:30' },
        { id: 2, name: 'Access Control', type: 'Door System', endpoint: '192.168.1.101', status: 'active', lastSync: '2024-01-15 10:25' },
        { id: 3, name: 'Fire Alarm', type: 'Safety System', endpoint: '192.168.1.102', status: 'inactive', lastSync: '2024-01-14 15:45' }
      ]);
    } catch (err) {
      showError('Failed to load initial data');
    }
  }, []);

  const handleAddUser = () => {
    const validationError = validateUser(newUser);
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const user: User = {
        id: users.length + 1,
        ...newUser,
        lastLogin: 'Never'
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: 'user', department: '', status: 'active' });
      setShowAddUserModal(false);
      showSuccess('User created successfully');
    } catch (err) {
      showError('Failed to create user');
    }
  };

  const handleAddIntegration = () => {
    const validationError = validateIntegration(newIntegration);
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const integration: Integration = {
        id: integrations.length + 1,
        ...newIntegration,
        lastSync: new Date().toISOString()
      };
      setIntegrations([...integrations, integration]);
      setNewIntegration({ name: '', type: '', endpoint: '', status: 'active' });
      setShowAddIntegrationModal(false);
      showSuccess('Integration created successfully');
    } catch (err) {
      showError('Failed to create integration');
    }
  };

  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...selectedUser } : user
      ));
      setShowEditUserModal(false);
      setSelectedUser(null);
    }
  };

  const handleExportAuditLog = () => {
    // Create CSV content
    const csvContent = "Timestamp,Level,Message\n" +
      "[2024-01-15 10:30:15],INFO,User login successful\n" +
      "[2024-01-15 10:25:42],WARN,High memory usage detected\n" +
      "[2024-01-15 10:20:18],ERROR,Database connection timeout\n" +
      "[2024-01-15 10:15:33],INFO,Backup completed successfully";
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSaveSettings = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showSuccess('Settings saved successfully!');
    }, API_TIMEOUT);
  }, [showSuccess]);

  // Memoized computed values
  const activeUsersCount = useMemo(() => 
    users.filter(user => user.status === 'active').length, [users]
  );

  const activeIntegrationsCount = useMemo(() => 
    integrations.filter(integration => integration.status === 'active').length, [integrations]
  );

  // Advanced system metrics
  const systemMetrics = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: activeUsersCount,
    inactiveUsers: users.length - activeUsersCount,
    totalIntegrations: integrations.length,
    activeIntegrations: activeIntegrationsCount,
    inactiveIntegrations: integrations.length - activeIntegrationsCount,
    systemHealth: 98,
    uptime: '99.9%',
    responseTime: '45ms',
    memoryUsage: 62,
    diskUsage: 38,
    cpuUsage: 23,
    networkLatency: '12ms',
    lastBackup: '2 hours ago',
    securityScore: 95,
    complianceStatus: 'Compliant'
  }), [users, activeUsersCount, integrations, activeIntegrationsCount]);

  // Real-time system alerts
  const systemAlerts = useMemo(() => [
    {
      id: 1,
      type: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage is at 85%',
      timestamp: '5 minutes ago',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      title: 'Backup Completed',
      message: 'Daily backup completed successfully',
      timestamp: '2 hours ago',
      severity: 'low'
    },
    {
      id: 3,
      type: 'success',
      title: 'Security Scan',
      message: 'No vulnerabilities detected',
      timestamp: '1 hour ago',
      severity: 'low'
    }
  ], []);

  // Recent activity data
  const recentActivity = useMemo(() => [
    {
      id: 1,
      user: 'John Doe',
      action: 'Updated user permissions',
      timestamp: '2 minutes ago',
      type: 'user_management'
    },
    {
      id: 2,
      user: 'System',
      action: 'Integration sync completed',
      timestamp: '5 minutes ago',
      type: 'system'
    },
    {
      id: 3,
      user: 'Jane Smith',
      action: 'Modified security settings',
      timestamp: '10 minutes ago',
      type: 'security'
    }
  ], []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* System Alerts Banner */}
            {systemAlerts.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-exclamation-triangle text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900">System Alerts</h3>
                      <p className="text-amber-700 text-sm">{systemAlerts.length} active alerts requiring attention</p>
                    </div>
                  </div>
          <Button 
                    size="sm" 
                    className="!bg-amber-600 hover:!bg-amber-700 text-white"
                    onClick={() => showSuccess('Viewing all alerts')}
                  >
                    <i className="fas fa-eye mr-1" />
                    View All
          </Button>
        </div>
              </div>
            )}

            {/* Key Metrics - Enhanced Gold Standard Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Users with Enhanced Metrics */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-users text-white text-lg"></i>
              </div>
                  <Badge variant="success" className="text-xs">+12%</Badge>
              </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{systemMetrics.totalUsers}</div>
                <div className="text-slate-600 font-medium">Total Users</div>
                <div className="text-sm text-slate-500 mt-1">{systemMetrics.activeUsers} active, {systemMetrics.inactiveUsers} inactive</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-arrow-up mr-1"></i>
                  <span>+2 this week</span>
            </div>
            </div>

              {/* Active Integrations with Status */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-plug text-white text-lg"></i>
                  </div>
                  <Badge variant="success" className="text-xs">All Online</Badge>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{systemMetrics.activeIntegrations}</div>
                <div className="text-slate-600 font-medium">Active Integrations</div>
                <div className="text-sm text-slate-500 mt-1">{systemMetrics.inactiveIntegrations} offline</div>
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <i className="fas fa-sync-alt mr-1"></i>
                  <span>Last sync: 2 min ago</span>
          </div>
        </div>

              {/* System Health with Real-time Metrics */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-heartbeat text-white text-lg"></i>
                  </div>
                  <Badge variant="success" className="text-xs">Excellent</Badge>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{systemMetrics.systemHealth}%</div>
                <div className="text-slate-600 font-medium">System Health</div>
                <div className="text-sm text-slate-500 mt-1">Uptime: {systemMetrics.uptime}</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-check-circle mr-1"></i>
                  <span>All systems operational</span>
                </div>
              </div>

              {/* Security Score with Compliance */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-shield-alt text-white text-lg"></i>
                </div>
                  <Badge variant="success" className="text-xs">{systemMetrics.complianceStatus}</Badge>
              </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{systemMetrics.securityScore}</div>
                <div className="text-slate-600 font-medium">Security Score</div>
                <div className="text-sm text-slate-500 mt-1">Response time: {systemMetrics.responseTime}</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-lock mr-1"></i>
                  <span>All systems secure</span>
          </div>
        </div>
      </div>

            {/* System Performance Metrics - Enhanced Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Database Performance */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-database text-white text-lg"></i>
                </div>
                  <Badge variant="success" className="text-xs">Optimal</Badge>
              </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{systemMetrics.responseTime}</div>
                <div className="text-slate-600 font-medium">Response Time</div>
                <div className="text-sm text-slate-500 mt-1">Memory: {systemMetrics.memoryUsage}%</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-check-circle mr-1"></i>
                  <span>All queries optimized</span>
              </div>
              </div>

              {/* API Performance */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-code text-white text-lg"></i>
                </div>
                  <Badge variant="success" className="text-xs">Healthy</Badge>
              </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{systemMetrics.networkLatency}</div>
                <div className="text-slate-600 font-medium">Network Latency</div>
                <div className="text-sm text-slate-500 mt-1">Uptime: {systemMetrics.uptime}</div>
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <i className="fas fa-sync-alt mr-1"></i>
                  <span>All endpoints responding</span>
              </div>
              </div>

              {/* Backup & Recovery */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-cloud-upload-alt text-white text-lg"></i>
                </div>
                  <Badge variant="success" className="text-xs">Current</Badge>
              </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{systemMetrics.lastBackup}</div>
                <div className="text-slate-600 font-medium">Last Backup</div>
                <div className="text-sm text-slate-500 mt-1">Disk usage: {systemMetrics.diskUsage}%</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-shield-alt mr-1"></i>
                  <span>Backup verified</span>
              </div>
              </div>

          {/* System Resources */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-tachometer-alt text-white text-lg"></i>
                </div>
                  <Badge variant="success" className="text-xs">Normal</Badge>
              </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{systemMetrics.cpuUsage}%</div>
                <div className="text-slate-600 font-medium">CPU Usage</div>
                <div className="text-sm text-slate-500 mt-1">Memory: {systemMetrics.memoryUsage}%</div>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="fas fa-chart-line mr-1"></i>
                  <span>Performance optimal</span>
              </div>
              </div>
        </div>

            {/* Recent System Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess('Viewing all activity')}
                  >
                    View All
                  </Button>
                      </div>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'user_management' ? 'bg-blue-500' :
                          activity.type === 'system' ? 'bg-green-500' :
                          activity.type === 'security' ? 'bg-red-500' : 'bg-slate-500'
                        }`}></div>
                        <div>
                          <span className="text-slate-700 font-medium">{activity.user}</span>
                          <span className="text-slate-600 ml-2">{activity.action}</span>
                      </div>
                </div>
                      <div className="text-xs text-slate-500">{activity.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">System Alerts</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess('Viewing all alerts')}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'warning' ? 'bg-yellow-500' :
                          alert.type === 'info' ? 'bg-blue-500' :
                          alert.type === 'success' ? 'bg-green-500' : 'bg-slate-500'
                        }`}></div>
                        <div>
                          <div className="text-slate-700 font-medium">{alert.title}</div>
                          <div className="text-slate-600 text-sm">{alert.message}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'warning' : 'success'
                        } className="text-xs">
                          {alert.severity}
                      </Badge>
                        <div className="text-xs text-slate-500 mt-1">{alert.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
          </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            {/* User Management Header with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">User Management</h3>
                <p className="text-slate-600">Manage platform users, roles, and permissions</p>
                  </div>
              <div className="flex items-center space-x-3">
                  <Button
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Exporting user data')}
                  >
                  <i className="fas fa-download mr-2"></i>
                  Export
                  </Button>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Bulk operations')}
                >
                  <i className="fas fa-users mr-2"></i>
                  Bulk Actions
                </Button>
                <Button 
                  onClick={() => setShowAddUserModal(true)}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add User
                </Button>
                            </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                            <div>
                    <p className="text-sm text-slate-600">Total Users</p>
                    <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                            </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Active Users</p>
                    <p className="text-2xl font-bold text-slate-800">{activeUsersCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-check text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Online Now</p>
                    <p className="text-2xl font-bold text-slate-800">{Math.floor(activeUsersCount * 0.3)}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-circle text-white text-xs"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">New This Week</p>
                    <p className="text-2xl font-bold text-slate-800">+{Math.floor(users.length * 0.1)}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-plus text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* User Management Table */}
            <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl overflow-hidden">
              {/* Table Header with Search and Filters */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                      <i className="fas fa-search absolute left-3 top-3 text-slate-400"></i>
                    </div>
                    <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                      <option>All Roles</option>
                      <option>Admin</option>
                      <option>Manager</option>
                      <option>User</option>
                    </select>
                    <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                          </div>
                          <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Refreshing user data')}
                    >
                      <i className="fas fa-sync-alt mr-1"></i>
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">{user.name}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-slate-600 border-slate-300">
                            {user.role}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              onClick={() => openEditUserModal(user)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              onClick={() => showSuccess(`Viewing ${user.name}'s profile`)}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => showSuccess(`Deactivating ${user.name}`)}
                            >
                              <i className="fas fa-user-times"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                        </div>

              {/* Table Footer with Pagination */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{users.length}</span> of <span className="font-medium">{users.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      disabled
                    >
                      Previous
                    </Button>
                    <Button 
                      size="sm" 
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    >
                      1
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      disabled
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            {/* Role Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                <h3 className="text-2xl font-bold text-slate-800">Role Management</h3>
                <p className="text-slate-600">Manage user roles and permissions across the platform</p>
                          </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Creating new role')}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create Role
                </Button>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Importing roles')}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Import
                </Button>
              </div>
            </div>

            {/* Role Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Total Roles</p>
                    <p className="text-2xl font-bold text-slate-800">3</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-shield-alt text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Active Roles</p>
                    <p className="text-2xl font-bold text-slate-800">3</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Custom Roles</p>
                    <p className="text-2xl font-bold text-slate-800">0</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-cog text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Permission Sets</p>
                    <p className="text-2xl font-bold text-slate-800">12</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-key text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Administrator Role */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-crown text-white text-lg"></i>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Administrator</h4>
                  <p className="text-sm text-slate-600 mb-4">Full system access and control across all modules</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Users</span>
                      <span className="text-slate-900 font-semibold">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Permissions</span>
                      <span className="text-slate-900 font-semibold">All (100%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Modules</span>
                      <span className="text-slate-900 font-semibold">All</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Editing Administrator role')}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Administrator permissions')}
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </Button>
                        </div>
                      </CardContent>
                    </Card>

              {/* Staff Role */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-user-tie text-white text-lg"></i>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Staff</h4>
                  <p className="text-sm text-slate-600 mb-4">Department management and team oversight</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Users</span>
                      <span className="text-slate-900 font-semibold">15</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Permissions</span>
                      <span className="text-slate-900 font-semibold">Limited (75%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Modules</span>
                      <span className="text-slate-900 font-semibold">Most</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Editing Staff role')}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Staff permissions')}
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </Button>
                </div>
              </CardContent>
            </Card>

              {/* Viewer Role */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-eye text-white text-lg"></i>
          </div>
                    <Badge variant="secondary">Read Only</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Viewer</h4>
                  <p className="text-sm text-slate-600 mb-4">Read-only access to system data</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Users</span>
                      <span className="text-slate-900 font-semibold">8</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Permissions</span>
                      <span className="text-slate-900 font-semibold">Read (25%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Modules</span>
                      <span className="text-slate-900 font-semibold">Limited</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Editing Viewer role')}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Viewer permissions')}
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Permission Matrix */}
            <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-slate-800">Permission Matrix</h4>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Editing permission matrix')}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Matrix
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Module</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Admin</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Staff</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Dashboard', 'Users', 'Roles', 'Properties', 'System', 'Security', 'Audit'].map((module) => (
                      <tr key={module}>
                        <td className="py-3 px-4 font-medium text-slate-800">{module}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success">Full</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={module === 'System' || module === 'Security' ? 'secondary' : 'success'}>
                            {module === 'System' || module === 'Security' ? 'Limited' : 'Full'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={module === 'Dashboard' || module === 'Users' ? 'success' : 'secondary'}>
                            {module === 'Dashboard' || module === 'Users' ? 'Read' : 'None'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            {/* Property Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Property & Integration Management</h3>
                <p className="text-slate-600">Manage multiple properties and system integrations</p>
                  </div>
              <div className="flex items-center space-x-3">
                  <Button
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Adding new property')}
                  >
                  <i className="fas fa-building mr-2"></i>
                  Add Property
                  </Button>
                <Button 
                  onClick={() => setShowAddIntegrationModal(true)}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Integration
                </Button>
                          </div>
                        </div>

            {/* Property Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Total Properties</p>
                    <p className="text-2xl font-bold text-slate-800">3</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-building text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Active Properties</p>
                    <p className="text-2xl font-bold text-slate-800">3</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Rooms</p>
                    <p className="text-2xl font-bold text-slate-800">450</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-bed text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-slate-800">78%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-pie text-white"></i>
                  </div>
                </div>
              </div>
            </div>
            {/* Property Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Downtown Hotel */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-building text-white text-lg"></i>
                    </div>
                    <Badge variant="success">Operational</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Downtown Hotel</h4>
                  <p className="text-sm text-slate-600 mb-4">Main business district location</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rooms</span>
                      <span className="text-slate-900 font-semibold">150</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Occupancy</span>
                      <span className="text-slate-900 font-semibold">85%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Revenue</span>
                      <span className="text-slate-900 font-semibold">$45K</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                            <Button
                              size="sm"
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Managing Downtown Hotel')}
                            >
                      <i className="fas fa-cog mr-1"></i>
                      Manage
                            </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Downtown Hotel analytics')}
                    >
                      <i className="fas fa-chart-bar mr-1"></i>
                      Analytics
                    </Button>
                        </div>
                      </CardContent>
                    </Card>

              {/* Resort Complex */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-umbrella-beach text-white text-lg"></i>
                    </div>
                    <Badge variant="success">Operational</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Resort Complex</h4>
                  <p className="text-sm text-slate-600 mb-4">Luxury beachfront resort</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rooms</span>
                      <span className="text-slate-900 font-semibold">200</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Occupancy</span>
                      <span className="text-slate-900 font-semibold">72%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Revenue</span>
                      <span className="text-slate-900 font-semibold">$68K</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Managing Resort Complex')}
                    >
                      <i className="fas fa-cog mr-1"></i>
                      Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Resort Complex analytics')}
                    >
                      <i className="fas fa-chart-bar mr-1"></i>
                      Analytics
                    </Button>
                </div>
              </CardContent>
            </Card>

              {/* Business Center */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-briefcase text-white text-lg"></i>
          </div>
                    <Badge variant="success">Operational</Badge>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Business Center</h4>
                  <p className="text-sm text-slate-600 mb-4">Corporate office complex</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rooms</span>
                      <span className="text-slate-900 font-semibold">100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Occupancy</span>
                      <span className="text-slate-900 font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Revenue</span>
                      <span className="text-slate-900 font-semibold">$32K</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Managing Business Center')}
                    >
                      <i className="fas fa-cog mr-1"></i>
                      Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing Business Center analytics')}
                    >
                      <i className="fas fa-chart-bar mr-1"></i>
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Management */}
            <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-800">System Integrations</h4>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Testing all integrations')}
                    >
                      <i className="fas fa-play mr-1"></i>
                      Test All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Syncing all integrations')}
                    >
                      <i className="fas fa-sync-alt mr-1"></i>
                      Sync All
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Integration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Endpoint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Sync</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {integrations.map((integration) => (
                      <tr key={integration.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                              <i className="fas fa-plug text-white text-sm"></i>
                          </div>
                          <div>
                              <div className="text-sm font-medium text-slate-900">{integration.name}</div>
                              <div className="text-xs text-slate-500">ID: {integration.id}</div>
                          </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-slate-600 border-slate-300">
                            {integration.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                          {integration.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              integration.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <Badge variant={integration.status === 'active' ? 'success' : 'destructive'}>
                              {integration.status}
                          </Badge>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {integration.lastSync}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              onClick={() => showSuccess(`Testing ${integration.name}`)}
                            >
                              <i className="fas fa-play mr-1"></i>
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                              onClick={() => showSuccess(`Configuring ${integration.name}`)}
                            >
                              <i className="fas fa-cog mr-1"></i>
                              Config
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => showSuccess(`Disabling ${integration.name}`)}
                            >
                              <i className="fas fa-power-off mr-1"></i>
                              Disable
                            </Button>
                      </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Integration Table Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{integrations.length}</span> of <span className="font-medium">{integrations.length}</span> integrations
                      </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Exporting integration data')}
                    >
                      <i className="fas fa-download mr-1"></i>
                      Export
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Viewing integration logs')}
                    >
                      <i className="fas fa-file-alt mr-1"></i>
                      Logs
                    </Button>
                      </div>
                      </div>
                    </div>
                      </div>
                      </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            {/* System Configuration Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">System Configuration</h3>
                <p className="text-slate-600">Manage core system settings and performance optimization</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Restarting system services')}
                >
                  <i className="fas fa-redo mr-2"></i>
                  Restart Services
                </Button>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Running system diagnostics')}
                >
                  <i className="fas fa-stethoscope mr-2"></i>
                  Diagnostics
                </Button>
              </div>
            </div>

            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">System Uptime</p>
                    <p className="text-2xl font-bold text-slate-800">99.9%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-server text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">CPU Usage</p>
                    <p className="text-2xl font-bold text-slate-800">23%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-microchip text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-slate-800">62%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-memory text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Disk Usage</p>
                    <p className="text-2xl font-bold text-slate-800">38%</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-hdd text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">General Settings</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-cog text-white text-sm"></i>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">System Name</label>
                      <input
                        type="text"
                        defaultValue="Proper 2.9 Security System"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="CST">Central Time</option>
                        <option value="MST">Mountain Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date Format</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              {/* System Configuration */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">System Configuration</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-sliders-h text-white text-sm"></i>
                      </div>
                      </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Auto Backup</span>
                        <p className="text-xs text-slate-500">Automatically backup system data</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Maintenance Mode</span>
                        <p className="text-xs text-slate-500">Enable maintenance mode</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Debug Mode</span>
                        <p className="text-xs text-slate-500">Enable debug logging</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Auto Updates</span>
                        <p className="text-xs text-slate-500">Automatically install updates</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Performance Settings */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Performance Settings</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-tachometer-alt text-white text-sm"></i>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cache TTL (seconds)</label>
                    <input
                      type="number"
                      defaultValue="3600"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Connections</label>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
              </div>
            </CardContent>
          </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Resetting to defaults')}
              >
                <i className="fas fa-undo mr-2"></i>
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSaveSettings} 
                disabled={loading} 
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                <i className="fas fa-save mr-2"></i>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Security Center Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Security Center</h3>
                <p className="text-slate-600">Manage security settings and access controls</p>
              </div>
                        <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Running security scan')}
                >
                  <i className="fas fa-shield-alt mr-2"></i>
                  Security Scan
                </Button>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Generating security report')}
                >
                  <i className="fas fa-file-alt mr-2"></i>
                  Security Report
                </Button>
                          </div>
            </div>

            {/* Security Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Security Score</p>
                    <p className="text-2xl font-bold text-slate-800">95</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-shield-alt text-white"></i>
                        </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-slate-800">12</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Failed Logins</p>
                    <p className="text-2xl font-bold text-slate-800">3</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Last Scan</p>
                    <p className="text-2xl font-bold text-slate-800">2h</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-search text-white"></i>
                  </div>
                </div>
                        </div>
                      </div>

            {/* Security Configuration Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Authentication Settings */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">Authentication</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-key text-white text-sm"></i>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                        <span className="text-slate-700 font-medium">Two-Factor Authentication</span>
                        <p className="text-xs text-slate-500">Require 2FA for all users</p>
                        </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                        <span className="text-slate-700 font-medium">Password Complexity</span>
                        <p className="text-xs text-slate-500">Enforce strong passwords</p>
                        </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                        <span className="text-slate-700 font-medium">Session Timeout</span>
                        <p className="text-xs text-slate-500">Auto-logout after inactivity</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Password Expiry</span>
                        <p className="text-xs text-slate-500">Require password changes</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

              {/* Access Control Settings */}
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">Access Control</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-lock text-white text-sm"></i>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">IP Whitelist</span>
                        <p className="text-xs text-slate-500">Restrict access by IP address</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Login Attempts Limit</span>
                        <p className="text-xs text-slate-500">Block after failed attempts</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Audit Logging</span>
                        <p className="text-xs text-slate-500">Log all security events</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-700 font-medium">Geolocation Blocking</span>
                        <p className="text-xs text-slate-500">Block suspicious locations</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    </div>
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Security Policies */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Security Policies</h4>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-shield text-white text-sm"></i>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password Min Length</label>
                    <input
                      type="number"
                      defaultValue="8"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Timeout (min)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Login Attempts</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
                  <Button
                variant="outline" 
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Resetting security settings')}
                  >
                <i className="fas fa-undo mr-2"></i>
                Reset to Defaults
                  </Button>
              <Button 
                onClick={() => showSuccess('Saving security settings')}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                <i className="fas fa-save mr-2"></i>
                Save Settings
              </Button>
                            </div>
          </div>
        );


      case 'audit':
        return (
          <div className="space-y-6">
            {/* Audit Log Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                <h3 className="text-2xl font-bold text-slate-800">Audit Log</h3>
                <p className="text-slate-600">Monitor system activity and security events</p>
                            </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Clearing audit logs')}
                >
                  <i className="fas fa-trash mr-2"></i>
                  Clear Logs
                </Button>
                <Button 
                  variant="outline" 
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={handleExportAuditLog}
                >
                  <i className="fas fa-download mr-2"></i>
                  Export Logs
                </Button>
                          </div>
                        </div>

            {/* Audit Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Total Events</p>
                    <p className="text-2xl font-bold text-slate-800">1,247</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-list text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">Security Events</p>
                    <p className="text-2xl font-bold text-slate-800">23</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-shield-alt text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">User Actions</p>
                    <p className="text-2xl font-bold text-slate-800">856</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user text-white"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-sm text-slate-600">System Events</p>
                    <p className="text-2xl font-bold text-slate-800">368</p>
                          </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <i className="fas fa-cog text-white"></i>
                        </div>
                </div>
          </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white border-[1.5px] border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-800">System Audit Trail</h4>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                      <option>All Events</option>
                      <option>Security Events</option>
                      <option>User Actions</option>
                      <option>System Events</option>
                    </select>
                    <Button
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('Refreshing audit logs')}
                    >
                      <i className="fas fa-sync-alt mr-1"></i>
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">2024-01-15 10:30:15</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">Login</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">admin@system.com</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">User login successful</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">Success</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">192.168.1.100</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">2024-01-15 10:25:42</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="warning">System</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">System</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">High memory usage detected</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="warning">Warning</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">127.0.0.1</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">2024-01-15 10:20:18</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">Error</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">System</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Database connection timeout</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">Error</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">127.0.0.1</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">2024-01-15 10:15:33</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">System</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">System</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Backup completed successfully</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">Success</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">127.0.0.1</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">2024-01-15 10:10:22</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">Security</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">unknown@external.com</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Failed login attempt</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">Failed</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">203.0.113.42</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Audit Log Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">1,247</span> events
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      disabled
                    >
                      Previous
                    </Button>
                    <Button 
                      size="sm" 
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    >
                      1
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      Next
                    </Button>
              </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-cogs text-white text-2xl" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                System Administration
              </h1>
              <p className="text-slate-600 font-medium">
                Master control panel for the entire Proper 2.9 platform
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
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
        {renderTabContent()}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                </select>
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                  Create User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, role: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                    value={selectedUser.department}
                    onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                    placeholder="Enter department"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                    value={selectedUser.status}
                    onChange={(e) => setSelectedUser(prev => prev ? ({ ...prev, status: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
              </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                  Update User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddIntegrationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Integration</h3>
              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Integration Name</label>
                  <input
                    type="text"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter integration name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newIntegration.type}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="">Select type</option>
                    <option value="Camera System">Camera System</option>
                    <option value="Door System">Door System</option>
                    <option value="Safety System">Safety System</option>
                    <option value="IoT Device">IoT Device</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint</label>
                  <input
                    type="text"
                    value={newIntegration.endpoint}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="Enter endpoint URL or IP"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
              </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddIntegrationModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIntegration} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                  Create Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemAdministration;
