import React, { createContext, useContext, useMemo, useState } from 'react';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'emergency';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationCategory = 'incident' | 'system' | 'security' | 'maintenance' | 'team' | 'guest';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
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

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  criticalUnread: NotificationItem[];
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const seedNotifications: NotificationItem[] = [
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
];

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);

  const addNotification = (notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const value = useMemo(() => {
    const unreadCount = notifications.filter(item => !item.read).length;
    const criticalUnread = notifications.filter(item => !item.read && item.priority === 'critical');
    return {
      notifications,
      unreadCount,
      criticalUnread,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification
    };
  }, [notifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};
