export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: number;
  module?: string;
  icon?: string;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationConfig {
  maxNotifications: number;
  defaultDuration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showProgress: boolean;
  pauseOnHover: boolean;
} 