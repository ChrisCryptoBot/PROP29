import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'director' | 'manager' | 'patrol_agent' | 'valet' | 'front_desk';
  department: string;
  phone: string;
  employeeId: string;
  hireDate: string;
  avatar?: string;
  bio?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    theme: 'light' | 'dark' | 'auto';
  };
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'pending';
  }>;
  workSchedule: {
    shift: 'morning' | 'afternoon' | 'night' | 'rotating';
    daysOff: string[];
    overtimeEligible: boolean;
  };
}

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'John Smith',
    email: 'john.smith@hotel.com',
    role: 'manager',
    department: 'Security Operations',
    phone: '+1 (555) 123-4567',
    employeeId: 'SEC-001',
    hireDate: '2023-01-15',
    bio: 'Experienced security manager with 8 years in hotel security operations.',
    emergencyContact: {
      name: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      relationship: 'Spouse'
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light'
    },
    certifications: [
      {
        id: '1',
        name: 'Certified Protection Professional (CPP)',
        issuer: 'ASIS International',
        issueDate: '2023-03-15',
        expiryDate: '2026-03-15',
        status: 'active'
      },
      {
        id: '2',
        name: 'First Aid & CPR',
        issuer: 'American Red Cross',
        issueDate: '2023-06-01',
        expiryDate: '2025-06-01',
        status: 'active'
      }
    ],
    workSchedule: {
      shift: 'morning',
      daysOff: ['Saturday', 'Sunday'],
      overtimeEligible: true
    }
  });

  const [editMode, setEditMode] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfile>(profile);

  const rolePermissions = {
    director: {
      canEditTeam: true,
      canViewReports: true,
      canManageCertifications: true,
      canAccessSystemSettings: true
    },
    manager: {
      canEditTeam: true,
      canViewReports: true,
      canManageCertifications: true,
      canAccessSystemSettings: false
    },
    patrol_agent: {
      canEditTeam: false,
      canViewReports: false,
      canManageCertifications: false,
      canAccessSystemSettings: false
    },
    valet: {
      canEditTeam: false,
      canViewReports: false,
      canManageCertifications: false,
      canAccessSystemSettings: false
    },
    front_desk: {
      canEditTeam: false,
      canViewReports: false,
      canManageCertifications: false,
      canAccessSystemSettings: false
    }
  };

  const currentPermissions = rolePermissions[profile.role];

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile({ ...formData });
      setEditMode(null);
      showSuccess(`${section} updated successfully`);
    } catch (err) {
      showError(`Failed to update ${section}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditMode(null);
  };

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

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'fas fa-user' },
    { id: 'work', label: 'Work Details', icon: 'fas fa-briefcase' },
    { id: 'certifications', label: 'Certifications', icon: 'fas fa-certificate' },
    { id: 'preferences', label: 'Preferences', icon: 'fas fa-cog' },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' }
  ];

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-user text-white text-2xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                <Badge variant={getRoleColor(profile.role) as any}>
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
              <p className="text-slate-600 mb-1">{profile.email}</p>
              <p className="text-slate-500 text-sm">Employee ID: {profile.employeeId}</p>
            </div>
            <Button
              onClick={() => setEditMode('personal')}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-edit mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-user mr-3 text-slate-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode === 'personal' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSave('Personal information')}
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
                  <label className="text-sm font-medium text-slate-500">Full Name</label>
                  <p className="text-slate-900 font-medium">{profile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Email</label>
                  <p className="text-slate-900 font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Phone</label>
                  <p className="text-slate-900 font-medium">{profile.phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Bio</label>
                  <p className="text-slate-900 font-medium">{profile.bio || 'No bio provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Emergency Contact</label>
                  <p className="text-slate-900 font-medium">
                    {profile.emergencyContact.name} ({profile.emergencyContact.relationship})
                  </p>
                  <p className="text-slate-600 text-sm">{profile.emergencyContact.phone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkDetails = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-briefcase mr-3 text-slate-600" />
              Work Details
            </CardTitle>
            <Button
              onClick={() => setEditMode('work')}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-edit mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode === 'work' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Security Operations">Security Operations</option>
                  <option value="Guest Services">Guest Services</option>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Valet Services">Valet Services</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hire Date</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Shift</label>
                <select
                  value={formData.workSchedule.shift}
                  onChange={(e) => setFormData({
                    ...formData,
                    workSchedule: { ...formData.workSchedule, shift: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning (6 AM - 2 PM)</option>
                  <option value="afternoon">Afternoon (2 PM - 10 PM)</option>
                  <option value="night">Night (10 PM - 6 AM)</option>
                  <option value="rotating">Rotating</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Days Off</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.workSchedule.daysOff.includes(day)}
                        onChange={(e) => {
                          const daysOff = e.target.checked
                            ? [...formData.workSchedule.daysOff, day]
                            : formData.workSchedule.daysOff.filter(d => d !== day);
                          setFormData({
                            ...formData,
                            workSchedule: { ...formData.workSchedule, daysOff }
                          });
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSave('Work details')}
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
                  <label className="text-sm font-medium text-slate-500">Department</label>
                  <p className="text-slate-900 font-medium">{profile.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Employee ID</label>
                  <p className="text-slate-900 font-medium">{profile.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Hire Date</label>
                  <p className="text-slate-900 font-medium">
                    {new Date(profile.hireDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Shift</label>
                  <p className="text-slate-900 font-medium capitalize">
                    {profile.workSchedule.shift.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Days Off</label>
                  <p className="text-slate-900 font-medium">
                    {profile.workSchedule.daysOff.join(', ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Overtime Eligible</label>
                  <Badge variant={profile.workSchedule.overtimeEligible ? 'success' : 'secondary'}>
                    {profile.workSchedule.overtimeEligible ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCertifications = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-certificate mr-3 text-slate-600" />
              Certifications & Training
            </CardTitle>
            {currentPermissions.canManageCertifications && (
              <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-plus mr-2" />
                Add Certification
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.certifications.map((cert) => (
              <div key={cert.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{cert.name}</h4>
                    <p className="text-sm text-slate-600">Issued by: {cert.issuer}</p>
                  </div>
                  <Badge variant={cert.status === 'active' ? 'success' : cert.status === 'expired' ? 'destructive' : 'warning'}>
                    {cert.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="ml-2 text-slate-900">{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Expiry Date:</span>
                    <span className="ml-2 text-slate-900">{new Date(cert.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {cert.status === 'expired' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2" />
                    This certification has expired and needs to be renewed.
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-cog mr-3 text-slate-600" />
              Preferences
            </CardTitle>
            <Button
              onClick={() => setEditMode('preferences')}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-edit mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode === 'preferences' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                <select
                  value={formData.preferences.timezone}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, timezone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
                <select
                  value={formData.preferences.dateFormat}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, dateFormat: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                <select
                  value={formData.preferences.theme}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, theme: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSave('Preferences')}
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
                  <label className="text-sm font-medium text-slate-500">Language</label>
                  <p className="text-slate-900 font-medium">English</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Timezone</label>
                  <p className="text-slate-900 font-medium">America/New_York</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Date Format</label>
                  <p className="text-slate-900 font-medium">{profile.preferences.dateFormat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Theme</label>
                  <p className="text-slate-900 font-medium capitalize">{profile.preferences.theme}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-shield-alt mr-3 text-slate-600" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Change */}
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-3">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-key mr-2" />
                Update Password
              </Button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">
                <i className="fas fa-mobile-alt mr-2" />
                Manage 2FA
              </Button>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                <i className="fas fa-times mr-2" />
                Disable
              </Button>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-3">Active Sessions</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-desktop text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">Chrome on Windows</p>
                    <p className="text-sm text-slate-600">Current session • New York, NY</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-mobile-alt text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">Mobile App</p>
                    <p className="text-sm text-slate-600">Last active 2 hours ago • New York, NY</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  Revoke
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'work':
        return renderWorkDetails();
      case 'certifications':
        return renderCertifications();
      case 'preferences':
        return renderPreferences();
      case 'security':
        return renderSecurity();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-user-cog text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
              <p className="text-slate-600 font-medium">Manage your personal and work information</p>
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
      </div>
    </div>
  );
};

export default ProfileSettings;
