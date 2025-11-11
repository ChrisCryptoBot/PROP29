import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'incident' | 'system' | 'security' | 'maintenance' | 'team' | 'guest';
  timestamp: string;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  actionText?: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  relatedTo?: {
    type: 'incident' | 'user' | 'system' | 'guest';
    id: string;
    name: string;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  categories: {
    incident: boolean;
    system: boolean;
    security: boolean;
    maintenance: boolean;
    team: boolean;
    guest: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  emergencyOverride: boolean;
}

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Security Incident Reported',
      message: 'Unauthorized access attempt detected at Main Entrance at 10:30 AM',
      type: 'error',
      priority: 'high',
      category: 'incident',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      actionable: true,
      actionUrl: '/modules/event-log',
      actionText: 'View Incident',
      sender: {
        name: 'Sarah Johnson',
        role: 'Patrol Agent'
      },
      relatedTo: {
        type: 'incident',
        id: 'INC-001',
        name: 'Main Entrance Access Violation'
      }
    },
    {
      id: '2',
      title: 'System Maintenance Scheduled',
      message: 'Camera system maintenance scheduled for tonight 11 PM - 1 AM',
      type: 'info',
      priority: 'medium',
      category: 'maintenance',
      timestamp: '2024-01-15T09:15:00Z',
      read: false,
      actionable: true,
      actionUrl: '/modules/admin',
      actionText: 'View Schedule',
      sender: {
        name: 'System Administrator',
        role: 'System'
      }
    },
    {
      id: '3',
      title: 'Team Member Check-in',
      message: 'Mike Davis completed his patrol route and checked in successfully',
      type: 'success',
      priority: 'low',
      category: 'team',
      timestamp: '2024-01-15T08:45:00Z',
      read: true,
      actionable: false,
      sender: {
        name: 'Mike Davis',
        role: 'Patrol Agent'
      },
      relatedTo: {
        type: 'user',
        id: '3',
        name: 'Mike Davis'
      }
    },
    {
      id: '4',
      title: 'Guest Service Request',
      message: 'Guest in Room 205 requesting assistance with lost luggage',
      type: 'info',
      priority: 'medium',
      category: 'guest',
      timestamp: '2024-01-15T08:20:00Z',
      read: false,
      actionable: true,
      actionUrl: '/modules/lost-and-found',
      actionText: 'Handle Request',
      sender: {
        name: 'Lisa Wilson',
        role: 'Front Desk Staff'
      },
      relatedTo: {
        type: 'guest',
        id: 'GUEST-205',
        name: 'Room 205 Guest'
      }
    },
    {
      id: '5',
      title: 'Emergency Alert',
      message: 'FIRE ALARM ACTIVATED - Building evacuation required immediately',
      type: 'emergency',
      priority: 'critical',
      category: 'security',
      timestamp: '2024-01-15T07:30:00Z',
      read: true,
      actionable: true,
      actionUrl: '/modules/emergency',
      actionText: 'Emergency Response',
      sender: {
        name: 'Fire Safety System',
        role: 'System'
      }
    },
    {
      id: '6',
      title: 'Access Control Update',
      message: 'New access card issued for temporary contractor - John Smith',
      type: 'info',
      priority: 'low',
      category: 'system',
      timestamp: '2024-01-15T07:00:00Z',
      read: true,
      actionable: false,
      sender: {
        name: 'Access Control System',
        role: 'System'
      }
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    desktopNotifications: true,
    categories: {
      incident: true,
      system: true,
      security: true,
      maintenance: true,
      team: true,
      guest: true
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00'
    },
    emergencyOverride: true
  });

  const [editMode, setEditMode] = useState(false);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    showSuccess('Notification marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showSuccess('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    showSuccess('Notification deleted');
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle',
      success: 'fas fa-check-circle',
      emergency: 'fas fa-exclamation-circle'
    };
    return icons[type as keyof typeof icons] || 'fas fa-bell';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      success: 'text-green-600',
      emergency: 'text-red-700'
    };
    return colors[type as keyof typeof colors] || 'text-slate-600';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'default',
      medium: 'warning',
      high: 'destructive',
      critical: 'destructive'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      incident: 'destructive',
      system: 'default',
      security: 'warning',
      maintenance: 'secondary',
      team: 'success',
      guest: 'outline'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'incident') return notification.category === 'incident';
    if (activeTab === 'system') return notification.category === 'system';
    if (activeTab === 'security') return notification.category === 'security';
    if (activeTab === 'maintenance') return notification.category === 'maintenance';
    if (activeTab === 'team') return notification.category === 'team';
    if (activeTab === 'guest') return notification.category === 'guest';
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All Notifications', icon: 'fas fa-bell', count: notifications.length },
    { id: 'unread', label: 'Unread', icon: 'fas fa-circle', count: notifications.filter(n => !n.read).length },
    { id: 'incident', label: 'Incidents', icon: 'fas fa-exclamation-triangle', count: notifications.filter(n => n.category === 'incident').length },
    { id: 'system', label: 'System', icon: 'fas fa-cog', count: notifications.filter(n => n.category === 'system').length },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt', count: notifications.filter(n => n.category === 'security').length },
    { id: 'maintenance', label: 'Maintenance', icon: 'fas fa-tools', count: notifications.filter(n => n.category === 'maintenance').length },
    { id: 'team', label: 'Team', icon: 'fas fa-users', count: notifications.filter(n => n.category === 'team').length },
    { id: 'guest', label: 'Guest', icon: 'fas fa-user', count: notifications.filter(n => n.category === 'guest').length }
  ];

  const renderNotifications = () => (
    <div className="space-y-4">
      {filteredNotifications.length === 0 ? (
        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bell-slash text-slate-400 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
            <p className="text-slate-600">You're all caught up! No new notifications to show.</p>
          </CardContent>
        </Card>
      ) : (
        filteredNotifications.map((notification) => (
          <Card key={notification.id} className={`bg-white border-[1.5px] shadow-sm hover:shadow-md transition-all duration-200 ${
            notification.read ? 'border-slate-200' : 'border-blue-200 bg-blue-50/30'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.read ? 'bg-slate-100' : 'bg-blue-100'
                }`}>
                  <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-semibold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                        {notification.priority}
                      </Badge>
                      <Badge variant={getCategoryColor(notification.category) as any} className="text-xs">
                        {notification.category}
                      </Badge>
                    </div>
                  </div>
                  <p className={`text-sm mb-3 ${notification.read ? 'text-slate-600' : 'text-slate-700'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>
                        <i className="fas fa-user mr-1" />
                        {notification.sender.name} ({notification.sender.role})
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1" />
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      {notification.relatedTo && (
                        <span>
                          <i className="fas fa-link mr-1" />
                          Related to: {notification.relatedTo.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.actionable && (
                        <Button
                          size="sm"
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => showSuccess(`Opening ${notification.actionText}`)}
                        >
                          <i className="fas fa-external-link-alt mr-1" />
                          {notification.actionText}
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <i className="fas fa-check mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <i className="fas fa-trash" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-cog mr-3 text-slate-600" />
              Notification Settings
            </CardTitle>
            <Button
              onClick={() => setEditMode(!editMode)}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-edit mr-2" />
              {editMode ? 'Cancel' : 'Edit Settings'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Notification Channels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-700 font-medium">Email Notifications</span>
                  <p className="text-xs text-slate-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-700 font-medium">SMS Notifications</span>
                  <p className="text-xs text-slate-500">Receive notifications via text message</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-700 font-medium">Push Notifications</span>
                  <p className="text-xs text-slate-500">Receive notifications on mobile devices</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-700 font-medium">Desktop Notifications</span>
                  <p className="text-xs text-slate-500">Receive notifications on desktop</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={(e) => setSettings({ ...settings, desktopNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Notification Categories */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Notification Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-700 font-medium capitalize">{category}</span>
                    <p className="text-xs text-slate-500">
                      {category === 'incident' && 'Security incidents and violations'}
                      {category === 'system' && 'System updates and maintenance'}
                      {category === 'security' && 'Security alerts and warnings'}
                      {category === 'maintenance' && 'Scheduled maintenance and repairs'}
                      {category === 'team' && 'Team member activities and updates'}
                      {category === 'guest' && 'Guest service requests and issues'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      categories: { ...settings.categories, [category]: e.target.checked }
                    })}
                    disabled={!editMode}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Quiet Hours</h4>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-slate-700 font-medium">Enable Quiet Hours</span>
                  <p className="text-xs text-slate-500">Pause non-emergency notifications during specified hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Override */}
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <span className="text-red-700 font-medium">Emergency Override</span>
              <p className="text-xs text-red-600">Always receive emergency notifications regardless of other settings</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emergencyOverride}
              onChange={(e) => setSettings({ ...settings, emergencyOverride: e.target.checked })}
              disabled={!editMode}
              className="w-5 h-5 text-red-600 rounded"
            />
          </div>

          {editMode && (
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setEditMode(false);
                  showSuccess('Notification settings updated successfully');
                }}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return renderSettings();
      default:
        return renderNotifications();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-bell text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold">
                  {notifications.filter(n => !n.read).length}
                </span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-600 font-medium">Stay informed with real-time alerts and updates</p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <i className={`${tab.icon} mr-2`} />
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {tab.count}
                  </Badge>
                )}
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

        {/* Action Bar */}
        {activeTab !== 'settings' && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {activeTab === 'all' ? 'All Notifications' : 
                 activeTab === 'unread' ? 'Unread Notifications' :
                 `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications`}
              </h2>
              <Badge variant="outline" className="text-slate-600">
                {filteredNotifications.length} total
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={markAllAsRead}
                >
                  <i className="fas fa-check-double mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Refreshing notifications')}
              >
                <i className="fas fa-sync-alt mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {renderTabContent()}
      </div>
    </div>
  );
};

export default Notifications;