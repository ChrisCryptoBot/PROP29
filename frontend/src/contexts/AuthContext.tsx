import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '../services/logger';
import { env } from '../config/env';
import { clearAppCache } from '../utils/clearAppCache';

// Enhanced TypeScript interfaces
export interface User {
  user_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  roles: string[];
  profile_image_url?: string;
  preferred_language: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Clears all app cache (auth + feature caches) and signs out locally. Next load shows login. */
  clearCacheAndLogout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

// API service functions
class AuthAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${env.API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      logger.debug(`Fetching: ${url}`, { module: 'AuthAPI', action: 'request', endpoint, method: config.method });
      const response = await fetch(url, config);
      logger.debug(`Response status: ${response.status} ${response.statusText}`, { module: 'AuthAPI', action: 'request', endpoint, status: response.status });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isSessionCheck = response.status === 401 && (endpoint === '/users/me' || endpoint === '/auth/refresh');
        const msg = `HTTP ${response.status}: ${(errorData as { detail?: string }).detail || response.statusText}`;
        if (isSessionCheck) {
          logger.debug('Session invalid or expired (expected when not logged in or after restart)', { module: 'AuthAPI', action: 'request', endpoint, status: 401 });
        } else {
          logger.error('API request failed', new Error(msg), { module: 'AuthAPI', action: 'request', endpoint, errorData });
        }
        throw new Error((errorData as { detail?: string }).detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('Response data received', { module: 'AuthAPI', action: 'request', endpoint });
      return data;
    } catch (error) {
      const isSessionUnauthorized = error instanceof Error && (error.message === 'Invalid token' || error.message.startsWith('HTTP 401'));
      if (!isSessionUnauthorized) {
        logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthAPI', action: 'request', endpoint, url });
      }
      throw error;
    }
  }

  static async login(credentials: LoginCredentials): Promise<{ user: User } & AuthTokens> {
    logger.debug('AuthAPI.login called', { module: 'AuthAPI', action: 'login', email: credentials.email });
    return this.request<{ user: User } & AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async refreshToken(): Promise<AuthTokens> {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }

    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
  }

  static async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  static async getCurrentUser(): Promise<User> {
    return this.request('/users/me');
  }

  static async updateUser(userData: Partial<User>): Promise<User> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
}

// Token management utilities
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null; // nothing saved
    try {
      return JSON.parse(userStr);
    } catch (err) {
      logger.error("Failed to parse user from storage", err instanceof Error ? err : new Error(String(err)), { module: 'TokenManager', action: 'getUser' });
      // Clear invalid data
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use ref to avoid circular dependencies
  const isInitialized = useRef(false);

  // Define logout first to avoid circular dependency
  const logout = useCallback(async (): Promise<void> => {
    logger.info('Logout called', { module: 'AuthProvider', action: 'logout' });
    try {
      if (isAuthenticated) {
        await AuthAPI.logout();
      }
    } catch (error) {
      logger.error('Logout API call failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'logout' });
    } finally {
      // Clear local state regardless of API call success
      TokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  }, [isAuthenticated]);

  const clearCacheAndLogout = useCallback((): void => {
    logger.info('Clear cache and logout called', { module: 'AuthProvider', action: 'clearCacheAndLogout' });
    clearAppCache();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Cache cleared. Please sign in again.');
  }, []);

  // Define refreshToken with proper dependencies
  const refreshToken = useCallback(async (): Promise<boolean> => {
    logger.debug('RefreshToken called', { module: 'AuthProvider', action: 'refreshToken' });
    try {
      const response = await AuthAPI.refreshToken();
      TokenManager.setTokens(response);

      // Update user data if needed
      const currentUser = TokenManager.getUser();
      if (currentUser) {
        try {
          const updatedUser = await AuthAPI.getCurrentUser();
          TokenManager.setUser(updatedUser);
          setUser(updatedUser);
        } catch (error) {
          logger.error('Failed to get updated user', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'refreshToken' });
        }
      }

      return true;
    } catch (error) {
      logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'refreshToken' });
      logout();
      return false;
    }
  }, [logout]);

  // Initialize auth state on mount - ONLY ONCE. Always validate with backend so we never skip login on stale cache.
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    isInitialized.current = true;
    logger.debug('Starting auth initialization', { module: 'AuthProvider', action: 'useEffect-init' });

    const initializeAuth = async (): Promise<void> => {
      try {
        const accessToken = TokenManager.getAccessToken();

        if (!accessToken) {
          TokenManager.clearTokens();
          setLoading(false);
          return;
        }

        // Always validate with backend; never trust localStorage alone so refresh always shows login when token is invalid.
        const validateSession = async (): Promise<boolean> => {
          try {
            const currentUser = await AuthAPI.getCurrentUser();
            TokenManager.setUser(currentUser);
            setUser(currentUser);
            setIsAuthenticated(true);
            return true;
          } catch {
            return false;
          }
        };

        if (await validateSession()) {
          setLoading(false);
          return;
        }

        // Access token invalid or expired - try refresh once
        if (TokenManager.getRefreshToken()) {
          try {
            const response = await AuthAPI.refreshToken();
            TokenManager.setTokens(response);
            if (await validateSession()) {
              setLoading(false);
              return;
            }
          } catch {
            // Refresh failed, fall through to clear
          }
        }

        TokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } catch (error) {
        logger.error('Auth initialization failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'initializeAuth' });
        TokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - run only once

  // Auto-refresh token before expiration - only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    logger.debug('Setting up auto-refresh interval', { module: 'AuthProvider', action: 'useEffect-autoRefresh' });
    const interval = setInterval(async () => {
      logger.debug('Auto-refresh triggered', { module: 'AuthProvider', action: 'autoRefresh' });
      try {
        const response = await AuthAPI.refreshToken();
        TokenManager.setTokens(response);

        // Update user data if needed
        const currentUser = TokenManager.getUser();
        if (currentUser) {
          try {
            const updatedUser = await AuthAPI.getCurrentUser();
            TokenManager.setUser(updatedUser);
            setUser(updatedUser);
          } catch (error) {
            logger.error('Failed to get updated user', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'autoRefresh' });
          }
        }
      } catch (error) {
        logger.error('Auto-refresh failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'autoRefresh' });
        logout();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    logger.info('Login attempt', { module: 'AuthProvider', action: 'login', email: credentials.email });
    try {
      setLoading(true);

      const response = await AuthAPI.login(credentials);

      // Store tokens and user data
      TokenManager.setTokens(response);
      TokenManager.setUser(response.user);

      setUser(response.user);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      logger.info('Login successful', { module: 'AuthProvider', action: 'login', userId: response.user.user_id });
      return true;
    } catch (error) {
      logger.error('Login failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'login' });
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      const updatedUser = await AuthAPI.updateUser(userData);
      TokenManager.setUser(updatedUser);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      logger.error('User update failed', error instanceof Error ? error : new Error(String(error)), { module: 'AuthProvider', action: 'updateUser' });
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    clearCacheAndLogout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 
