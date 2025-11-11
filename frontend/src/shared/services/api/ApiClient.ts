/**
 * Enhanced API Client for PROPER 2.9
 * Provides module-specific API instances with React Query integration
 */

import axios, { AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  data?: any;
}

export class ApiClient {
  private static instance: ApiClient;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Module-specific API factory
  createModuleApi(moduleName: string) {
    const baseUrl = `${this.baseURL}/${moduleName}`;
    
    return {
      // GET request
      get: async <T>(endpoint: string, params?: any): Promise<T> => {
        const config: AxiosRequestConfig = {
          method: 'GET',
          url: `${baseUrl}${endpoint}`,
          params,
          headers: this.defaultHeaders,
        };
        
        try {
          const response = await axios(config);
          return response.data;
        } catch (error: any) {
          throw this.handleError(error);
        }
      },

      // POST request
      post: async <T>(endpoint: string, data?: any): Promise<T> => {
        const config: AxiosRequestConfig = {
          method: 'POST',
          url: `${baseUrl}${endpoint}`,
          data,
          headers: this.defaultHeaders,
        };
        
        try {
          const response = await axios(config);
          return response.data;
        } catch (error: any) {
          throw this.handleError(error);
        }
      },

      // PUT request
      put: async <T>(endpoint: string, data?: any): Promise<T> => {
        const config: AxiosRequestConfig = {
          method: 'PUT',
          url: `${baseUrl}${endpoint}`,
          data,
          headers: this.defaultHeaders,
        };
        
        try {
          const response = await axios(config);
          return response.data;
        } catch (error: any) {
          throw this.handleError(error);
        }
      },

      // DELETE request
      delete: async <T>(endpoint: string): Promise<T> => {
        const config: AxiosRequestConfig = {
          method: 'DELETE',
          url: `${baseUrl}${endpoint}`,
          headers: this.defaultHeaders,
        };
        
        try {
          const response = await axios(config);
          return response.data;
        } catch (error: any) {
          throw this.handleError(error);
        }
      },

      // Bulk operations
      bulk: {
        get: async <T>(endpoints: string[]): Promise<T[]> => {
          return Promise.all(
            endpoints.map(endpoint => 
              this.request('GET', `${baseUrl}${endpoint}`)
            )
          );
        },
        
        post: async <T>(operations: Array<{endpoint: string, data: any}>): Promise<T[]> => {
          return Promise.all(
            operations.map(op => 
              this.request('POST', `${baseUrl}${op.endpoint}`, { data: op.data })
            )
          );
        }
      },

      // Cache management (placeholder for React Query integration)
      cache: {
        invalidate: (endpoint?: string) => {
          console.log(`Cache invalidated for ${moduleName}${endpoint || ''}`);
        },
        
        prefetch: async (endpoint: string, params?: any) => {
          console.log(`Prefetching ${moduleName}${endpoint}`);
          return this.request('GET', `${baseUrl}${endpoint}`, { params });
        },

        setData: <T>(endpoint: string, data: T, params?: any) => {
          console.log(`Cache data set for ${moduleName}${endpoint}`, data);
        }
      }
    };
  }

  private async request(method: string, url: string, options: any = {}) {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response?.status === 401) {
      // Handle authentication error
      console.error('Authentication error - redirecting to login');
      // In a real app, you'd redirect to login
    }
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An error occurred',
      data: error.response?.data
    };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Clear authentication token
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      headers: { ...this.defaultHeaders }
    };
  }
} 