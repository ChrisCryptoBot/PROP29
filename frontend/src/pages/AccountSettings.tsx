import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'director' | 'manager' | 'patrol_agent' | 'valet' | 'front_desk';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  avatar?: string;
  permissions: string[];
  shift: string;
  phone: string;
}

interface TeamSettings {
  teamName: string;
  hotelName: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  breakPolicy: {
    duration: number;
    frequency: number;
  };
  overtimePolicy: {
    enabled: boolean;
    maxHours: number;
    approvalRequired: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    emergencyAlerts: boolean;
  };
}

interface Integration {
  id: string;
  name: string;
  type: 'camera' | 'access_control' | 'alarm' | 'mobile' | 'reporting';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  endpoint: string;
}

const AccountSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('team');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@hotel.com',
      role: 'manager',
      department: 'Security Operations',
      status: 'active',
      lastActive: '2024-01-15T10:30:00Z',
      permissions: ['view_reports', 'manage_incidents', 'assign_tasks'],
      shift: 'morning',
      phone: '+1 (555) 123-4567'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@hotel.com',
      role: 'patrol_agent',
      department: 'Security Operations',
      status: 'active',
      lastActive: '2024-01-15T09:45:00Z',
      permissions: ['view_incidents', 'create_reports'],
      shift: 'afternoon',
      phone: '+1 (555) 234-5678'
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike.davis@hotel.com',
      role: 'valet',
      department: 'Guest Services',
      status: 'active',
      lastActive: '2024-01-15T08:15:00Z',
      permissions: ['manage_parking', 'guest_services'],
      shift: 'morning',
      phone: '+1 (555) 345-6789'
    },
    {
      id: '4',
      name: 'Lisa Wilson',
      email: 'lisa.wilson@hotel.com',
      role: 'front_desk',
      department: 'Front Desk',
      status: 'pending',
      lastActive: '2024-01-14T16:20:00Z',
      permissions: ['guest_checkin', 'visitor_management'],
      shift: 'afternoon',
      phone: '+1 (555) 456-7890'
    }
  ]);

  const [teamSettings, setTeamSettings] = useState<TeamSettings>({
    teamName: 'Grand Hotel Security Team',
    hotelName: 'Grand Hotel & Resort',
    timezone: 'America/New_York',
    workingHours: {
      start: '06:00',
      end: '22:00'
    },
    breakPolicy: {
      duration: 15,
      frequency: 4
    },
    overtimePolicy: {
      enabled: true,
      maxHours: 12,
      approvalRequired: true
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      emergencyAlerts: true
    }
  });

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Security Cameras',
      type: 'camera',
      status: 'connected',
      lastSync: '2024-01-15T10:30:00Z',
      endpoint: '192.168.1.100'
    },
    {
      id: '2',
      name: 'Access Control System',
      type: 'access_control',
      status: 'connected',
      lastSync: '2024-01-15T10:25:00Z',
      endpoint: '192.168.1.101'
    },
    {
      id: '3',
      name: 'Fire Alarm System',
      type: 'alarm',
      status: 'error',
      lastSync: '2024-01-14T15:45:00Z',
      endpoint: '192.168.1.102'
    },
    {
      id: '4',
      name: 'Mobile App Integration',
      type: 'mobile',
      status: 'connected',
      lastSync: '2024-01-15T10:30:00Z',
      endpoint: 'api.proper29.com'
    }
  ]);

  const [editMode, setEditMode] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: 'patrol_agent',
    department: '',
    phone: '',
    shift: 'morning',
    permissions: []
  });

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      director: 'Security Director',
      manager: 'Security Manager',
      patrol_agent: 'Patrol Agent',
      valet: 'Valet Staff',
      front_desk: 'Front Desk Staff'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      director: 'destructive',
      manager: 'warning',
      patrol_agent: 'success',
      valet: 'default',
      front_desk: 'secondary'
    };
    return roleColors[role as keyof typeof roleColors] || 'default';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      active: 'success',
      inactive: 'destructive',
      pending: 'warning'
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const getIntegrationStatusColor = (status: string) => {
    const statusColors = {
      connected: 'success',
      disconnected: 'destructive',
      error: 'warning'
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      showError('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const member: TeamMember = {
        id: (teamMembers.length + 1).toString(),
        name: newMember.name!,
        email: newMember.email!,
        role: newMember.role!,
        department: newMember.department!,
        status: 'pending',
        lastActive: new Date().toISOString(),
        permissions: newMember.permissions || [],
        shift: newMember.shift!,
        phone: newMember.phone!
      };

      setTeamMembers([...teamMembers, member]);
      setNewMember({
        name: '',
        email: '',
        role: 'patrol_agent',
        department: '',
        phone: '',
        shift: 'morning',
        permissions: []
      });
      setShowAddMemberModal(false);
      showSuccess('Team member added successfully');
    } catch (err) {
      showError('Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEditMode(null);
      showSuccess(`${section} updated successfully`);
    } catch (err) {
      showError(`Failed to update ${section}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'team', label: 'Team Management', icon: 'fas fa-users' },
    { id: 'settings', label: 'Team Settings', icon: 'fas fa-cog' },
    { id: 'integrations', label: 'Integrations', icon: 'fas fa-plug' },
    { id: 'permissions', label: 'Permissions', icon: 'fas fa-shield-alt' }
  ];

  const renderTeamManagement = () => (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-users text-white text-lg" />
              </div>
              <Badge variant="success" className="text-xs">Active</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{teamMembers.length}</h3>
              <p className="text-slate-600 text-sm">Total Members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-user-check text-white text-lg" />
              </div>
              <Badge variant="success" className="text-xs">Online</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{teamMembers.filter(m => m.status === 'active').length}</h3>
              <p className="text-slate-600 text-sm">Active Members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-clock text-white text-lg" />
              </div>
              <Badge variant="warning" className="text-xs">Pending</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{teamMembers.filter(m => m.status === 'pending').length}</h3>
              <p className="text-slate-600 text-sm">Pending Invites</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-building text-white text-lg" />
              </div>
              <Badge variant="default" className="text-xs">Teams</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{new Set(teamMembers.map(m => m.department)).size}</h3>
              <p className="text-slate-600 text-sm">Departments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-users mr-3 text-slate-600" />
              Team Members
            </CardTitle>
            <Button
              onClick={() => setShowAddMemberModal(true)}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-plus mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{member.name}</div>
                          <div className="text-sm text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleColor(member.role) as any}>
                        {getRoleDisplayName(member.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(member.status) as any}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(member.lastActive).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess(`Viewing ${member.name}'s profile`)}
                        >
                          <i className="fas fa-eye" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess(`Editing ${member.name}'s permissions`)}
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => showSuccess(`Removing ${member.name} from team`)}
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamSettings = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-cog mr-3 text-slate-600" />
              Team Settings
            </CardTitle>
            <Button
              onClick={() => setEditMode('settings')}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-edit mr-2" />
              Edit Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {editMode === 'settings' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamSettings.teamName}
                    onChange={(e) => setTeamSettings({ ...teamSettings, teamName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    value={teamSettings.hotelName}
                    onChange={(e) => setTeamSettings({ ...teamSettings, hotelName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                  <select
                    value={teamSettings.timezone}
                    onChange={(e) => setTeamSettings({ ...teamSettings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Working Hours</label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={teamSettings.workingHours.start}
                      onChange={(e) => setTeamSettings({
                        ...teamSettings,
                        workingHours: { ...teamSettings.workingHours, start: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center text-slate-500">to</span>
                    <input
                      type="time"
                      value={teamSettings.workingHours.end}
                      onChange={(e) => setTeamSettings({
                        ...teamSettings,
                        workingHours: { ...teamSettings.workingHours, end: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-3">Break Policy</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Break Duration (minutes)</label>
                      <input
                        type="number"
                        value={teamSettings.breakPolicy.duration}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          breakPolicy: { ...teamSettings.breakPolicy, duration: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Break Frequency (hours)</label>
                      <input
                        type="number"
                        value={teamSettings.breakPolicy.frequency}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          breakPolicy: { ...teamSettings.breakPolicy, frequency: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-3">Overtime Policy</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Enable Overtime</span>
                      <input
                        type="checkbox"
                        checked={teamSettings.overtimePolicy.enabled}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          overtimePolicy: { ...teamSettings.overtimePolicy, enabled: e.target.checked }
                        })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Max Hours per Day</label>
                      <input
                        type="number"
                        value={teamSettings.overtimePolicy.maxHours}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          overtimePolicy: { ...teamSettings.overtimePolicy, maxHours: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Approval Required</span>
                      <input
                        type="checkbox"
                        checked={teamSettings.overtimePolicy.approvalRequired}
                        onChange={(e) => setTeamSettings({
                          ...teamSettings,
                          overtimePolicy: { ...teamSettings.overtimePolicy, approvalRequired: e.target.checked }
                        })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setEditMode(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateSettings('Team settings')}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Team Name</label>
                  <p className="text-slate-900 font-medium">{teamSettings.teamName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Hotel Name</label>
                  <p className="text-slate-900 font-medium">{teamSettings.hotelName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Timezone</label>
                  <p className="text-slate-900 font-medium">{teamSettings.timezone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Working Hours</label>
                  <p className="text-slate-900 font-medium">
                    {teamSettings.workingHours.start} - {teamSettings.workingHours.end}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Break Policy</label>
                  <p className="text-slate-900 font-medium">
                    {teamSettings.breakPolicy.duration} min every {teamSettings.breakPolicy.frequency} hours
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Overtime Policy</label>
                  <p className="text-slate-900 font-medium">
                    {teamSettings.overtimePolicy.enabled ? 'Enabled' : 'Disabled'} 
                    {teamSettings.overtimePolicy.enabled && ` (Max ${teamSettings.overtimePolicy.maxHours}h/day)`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-plug mr-3 text-slate-600" />
              System Integrations
            </CardTitle>
            <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
              <i className="fas fa-plus mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <i className={`fas fa-${integration.type === 'camera' ? 'video' : integration.type === 'access_control' ? 'key' : integration.type === 'alarm' ? 'exclamation-triangle' : integration.type === 'mobile' ? 'mobile-alt' : 'chart-bar'} text-white`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{integration.name}</h4>
                      <p className="text-sm text-slate-600">{integration.endpoint}</p>
                    </div>
                  </div>
                  <Badge variant={getIntegrationStatusColor(integration.status) as any}>
                    {integration.status}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500 mb-3">
                  Last sync: {new Date(integration.lastSync).toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess(`Testing ${integration.name} connection`)}
                  >
                    <i className="fas fa-sync-alt mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess(`Configuring ${integration.name}`)}
                  >
                    <i className="fas fa-cog mr-1" />
                    Configure
                  </Button>
                  {integration.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => showSuccess(`Troubleshooting ${integration.name}`)}
                    >
                      <i className="fas fa-tools mr-1" />
                      Fix
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

  const renderPermissions = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-shield-alt mr-3 text-slate-600" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries({
              director: 'Security Director',
              manager: 'Security Manager',
              patrol_agent: 'Patrol Agent',
              valet: 'Valet Staff',
              front_desk: 'Front Desk Staff'
            }).map(([role, displayName]) => (
              <div key={role} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getRoleColor(role) as any}>
                      {displayName}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {teamMembers.filter(m => m.role === role).length} members
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess(`Editing permissions for ${displayName}`)}
                  >
                    <i className="fas fa-edit mr-1" />
                    Edit Permissions
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    'view_dashboard', 'manage_incidents', 'view_reports', 'assign_tasks',
                    'manage_users', 'system_settings', 'emergency_alerts', 'mobile_access',
                    'guest_services', 'parking_management', 'visitor_management', 'audit_logs'
                  ].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={role === 'director' || (role === 'manager' && ['view_dashboard', 'manage_incidents', 'view_reports', 'assign_tasks'].includes(permission))}
                        disabled
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 capitalize">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team':
        return renderTeamManagement();
      case 'settings':
        return renderTeamSettings();
      case 'integrations':
        return renderIntegrations();
      case 'permissions':
        return renderPermissions();
      default:
        return renderTeamManagement();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-cog text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
              <p className="text-slate-600 font-medium">Manage your team and system configurations</p>
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
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <i className={`${tab.icon} mr-2`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <i className="fas fa-exclamation-triangle mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <i className="fas fa-check-circle mr-2" />
            {success}
          </div>
        )}

        {renderTabContent()}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Add Team Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newMember.name || ''}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <select
                    value={newMember.role || 'patrol_agent'}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="patrol_agent">Patrol Agent</option>
                    <option value="manager">Security Manager</option>
                    <option value="valet">Valet Staff</option>
                    <option value="front_desk">Front Desk Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={newMember.department || ''}
                    onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newMember.phone || ''}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
