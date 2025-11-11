export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Permission[];
  preferences: UserPreferences;
  profile: UserProfile;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    security: boolean;
    system: boolean;
    marketing: boolean;
  };
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  modules: string[];
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  address?: Address;
  department?: string;
  title?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
  sessionExpiry: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
} 