import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import ModuleShell from '../components/Layout/ModuleShell';
import { useNotifications } from '../contexts/NotificationsContext';
import { cn } from '../utils/cn';

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
  const { notifications, markAllAsRead, markAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    showSuccess('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    showSuccess('All notifications marked as read');
  };

  const handleDeleteNotification = (id: string) => {
    removeNotification(id);
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
      info: 'text-blue-400',
      warning: 'text-amber-400',
      error: 'text-red-400',
      success: 'text-emerald-400',
      emergency: 'text-red-400'
    };
    return colors[type as keyof typeof colors] || 'text-[color:var(--text-sub)]';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const colors = {
      low: 'bg-white/5 text-[color:var(--text-sub)] border border-white/5',
      medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      high: 'bg-red-500/10 text-red-400 border border-red-500/20',
      critical: 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    return colors[priority as keyof typeof colors] || 'bg-white/5 text-[color:var(--text-sub)] border border-white/5';
  };

  const getCategoryBadgeClass = (category: string) => {
    const colors = {
      incident: 'bg-red-500/10 text-red-400 border border-red-500/20',
      system: 'bg-white/5 text-[color:var(--text-sub)] border border-white/5',
      security: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      maintenance: 'bg-slate-500/10 text-[color:var(--text-sub)] border border-white/5',
      team: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      guest: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    };
    return colors[category as keyof typeof colors] || 'bg-white/5 text-[color:var(--text-sub)] border border-white/5';
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
    { id: 'guest', label: 'Guest', icon: 'fas fa-user', count: notifications.filter(n => n.category === 'guest').length },
    { id: 'settings', label: 'Settings', icon: 'fas fa-sliders-h', count: 0 }
  ];

  const renderNotifications = () => (
    <div className="space-y-4">
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon="fas fa-bell-slash"
          title="No notifications"
          description="You're all caught up. No new alerts to show."
          className="bg-black/20 border-dashed border-2 border-white/5 rounded-3xl p-12"
        />
      ) : (
        filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "bg-[color:var(--surface-card)] border border-white/5 shadow-2xl transition-all duration-200",
              notification.read ? 'opacity-80' : 'border-blue-500/20'
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/5",
                    notification.read ? 'bg-white/5' : 'bg-blue-500/10'
                  )}
                >
                  <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-black uppercase tracking-tight ${notification.read ? 'text-[color:var(--text-sub)]' : 'text-[color:var(--text-main)]'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest", getPriorityBadgeClass(notification.priority))}>
                        {notification.priority}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest", getCategoryBadgeClass(notification.category))}>
                        {notification.category}
                      </Badge>
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${notification.read ? 'text-[color:var(--text-sub)]' : 'text-[color:var(--text-sub)]'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] opacity-70">
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
                          variant="glass"
                          className="text-[9px] font-black uppercase tracking-widest"
                          onClick={() => {
                            handleMarkAsRead(notification.id);
                            if (notification.actionUrl) {
                              navigate(notification.actionUrl);
                            } else if (notification.actionText) {
                              showSuccess(`Opening ${notification.actionText}`);
                            }
                          }}
                        >
                          <i className="fas fa-external-link-alt mr-1" />
                          {notification.actionText || 'Open'}
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
                        onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <i className="fas fa-check mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-red-400 hover:border-red-500/30"
                        onClick={() => handleDeleteNotification(notification.id)}
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
      <Card className="bg-[color:var(--surface-card)] border border-white/5 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <i className="fas fa-cog mr-3 text-blue-400" />
              Notification Settings
            </CardTitle>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant="glass"
              className="text-[9px] font-black uppercase tracking-widest"
            >
              <i className="fas fa-edit mr-2" />
              {editMode ? 'Cancel' : 'Edit Settings'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h4 className="font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4 text-[10px]">Notification Channels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px]">Email Notifications</span>
                  <p className="text-[9px] text-[color:var(--text-sub)]">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px]">SMS Notifications</span>
                  <p className="text-[9px] text-[color:var(--text-sub)]">Receive notifications via text message</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px]">Push Notifications</span>
                  <p className="text-[9px] text-[color:var(--text-sub)]">Receive notifications on mobile devices</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px]">Desktop Notifications</span>
                  <p className="text-[9px] text-[color:var(--text-sub)]">Receive notifications on desktop</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={(e) => setSettings({ ...settings, desktopNotifications: e.target.checked })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Notification Categories */}
          <div>
            <h4 className="font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4 text-[10px]">Notification Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px] capitalize">{category}</span>
                    <p className="text-[9px] text-[color:var(--text-sub)]">
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
                    className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h4 className="font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4 text-[10px]">Quiet Hours</h4>
            <div className="p-4 border border-white/5 rounded-lg bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[color:var(--text-main)] font-black uppercase tracking-widest text-[9px]">Enable Quiet Hours</span>
                  <p className="text-[9px] text-[color:var(--text-sub)]">Pause non-emergency notifications during specified hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                  disabled={!editMode}
                  className="w-5 h-5 text-blue-400 rounded bg-[color:var(--console-dark)] border-white/10"
                />
              </div>
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-[color:var(--console-dark)] text-[color:var(--text-main)] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-[color:var(--console-dark)] text-[color:var(--text-main)] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Override */}
          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div>
              <span className="text-red-400 font-black uppercase tracking-widest text-[9px]">Emergency Override</span>
              <p className="text-[9px] text-red-300">Always receive emergency notifications regardless of other settings</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emergencyOverride}
              onChange={(e) => setSettings({ ...settings, emergencyOverride: e.target.checked })}
              disabled={!editMode}
              className="w-5 h-5 text-red-400 rounded bg-[color:var(--console-dark)] border-red-500/30"
            />
          </div>

          {editMode && (
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setEditMode(false);
                  showSuccess('Notification settings updated successfully');
                }}
                variant="glass"
                className="text-[9px] font-black uppercase tracking-widest"
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
    <ModuleShell
      title="Notifications"
      subtitle="Stay informed with real-time alerts and updates"
      tabs={tabs.map((tab) => ({
        id: tab.id,
        label: (
          <span className="flex items-center gap-2">
            <i className={tab.icon} />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <Badge
                variant="outline"
                className="text-[8px] font-black uppercase tracking-widest border-white/5 bg-white/10 text-[color:var(--text-sub)]"
              >
                {tab.count}
              </Badge>
            )}
          </span>
        )
      }))}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-exclamation-triangle mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-check-circle mr-2" />
            {success}
          </div>
        )}

        {/* Action Bar */}
        {activeTab !== 'settings' && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-[color:var(--text-main)]">
                {activeTab === 'all' ? 'All Notifications' : 
                 activeTab === 'unread' ? 'Unread Notifications' :
                 `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications`}
              </h2>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/5 bg-white/10 text-[color:var(--text-sub)]">
                {filteredNotifications.length} total
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
                  onClick={handleMarkAllAsRead}
                >
                  <i className="fas fa-check-double mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
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
    </ModuleShell>
  );
};

export default Notifications;


