import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

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
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// API service functions
class AuthAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async login(credentials: LoginCredentials): Promise<{ user: User } & AuthTokens> {
    return this.request('/auth/login', {
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
      console.error("Failed to parse user from storage:", err);
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
  console.log('🔄 AuthProvider rendering...');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use ref to avoid circular dependencies
  const isInitialized = useRef(false);

  console.log('📊 AuthProvider state:', { 
    userExists: !!user, 
    loading, 
    isAuthenticated,
    isInitialized: isInitialized.current 
  });

  // Define logout first to avoid circular dependency
  const logout = useCallback(async (): Promise<void> => {
    console.log('🚪 Logout called');
    try {
      if (isAuthenticated) {
        await AuthAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      TokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  }, [isAuthenticated]);

  // Define refreshToken with proper dependencies
  const refreshToken = useCallback(async (): Promise<boolean> => {
    console.log('🔄 RefreshToken called');
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
          console.error('Failed to get updated user:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  // Initialize auth state on mount - ONLY ONCE
  useEffect(() => {
    console.log('🚀 AuthProvider useEffect running, isInitialized:', isInitialized.current);
    
    if (isInitialized.current) {
      console.log('⏭️ Already initialized, skipping...');
      return;
    }
    
    isInitialized.current = true;
    console.log('✅ Starting auth initialization...');

    const initializeAuth = async (): Promise<void> => {
      try {
        console.log('🔍 Checking saved tokens...');
        const savedUser = TokenManager.getUser();
        const accessToken = TokenManager.getAccessToken();

        console.log('💾 Saved data:', { 
          hasSavedUser: !!savedUser, 
          hasAccessToken: !!accessToken 
        });

        if (savedUser && accessToken && !TokenManager.isTokenExpired(accessToken)) {
          console.log('✅ Valid tokens found, setting authenticated');
          setUser(savedUser);
          setIsAuthenticated(true);
        } else if (accessToken && TokenManager.isTokenExpired(accessToken)) {
          console.log('🔄 Token expired, attempting refresh...');
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
                setIsAuthenticated(true);
              } catch (error) {
                console.error('Failed to get updated user:', error);
              }
            }
          } catch (error) {
            console.log('❌ Refresh failed, clearing tokens');
            TokenManager.clearTokens();
          }
        } else {
          console.log('❌ No valid tokens found');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        TokenManager.clearTokens();
      } finally {
        console.log('✅ Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - run only once

  // Auto-refresh token before expiration - only when authenticated
  useEffect(() => {
    console.log('⏰ Auto-refresh effect, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('⏭️ Not authenticated, skipping auto-refresh setup');
      return;
    }

    console.log('⏰ Setting up auto-refresh interval');
    const interval = setInterval(async () => {
      console.log('⏰ Auto-refresh triggered');
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
            console.error('Failed to get updated user:', error);
          }
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        logout();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      console.log('🧹 Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    console.log('🔑 Login attempt');
    try {
      setLoading(true);
      
      const response = await AuthAPI.login(credentials);
      
      // Store tokens and user data
      TokenManager.setTokens(response);
      TokenManager.setUser(response.user);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
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
      console.error('User update failed:', error);
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
    refreshToken,
    updateUser,
  };

  console.log('📤 AuthProvider providing value:', { 
    userExists: !!value.user, 
    loading: value.loading, 
    isAuthenticated: value.isAuthenticated 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 