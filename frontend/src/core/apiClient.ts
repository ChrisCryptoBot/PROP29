import type { ModuleAPI } from '../types/module';

class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  createModuleApi(moduleId: string): ModuleAPI {
    const moduleBaseUrl = `${this.baseUrl}/api/${moduleId}`;
    
    return {
      baseUrl: moduleBaseUrl,
      endpoints: [],
      get: async (endpoint: string, params?: any) => {
        const url = new URL(`${moduleBaseUrl}${endpoint}`);
        if (params) {
          Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
          );
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      },

      post: async (endpoint: string, data?: any) => {
        const response = await fetch(`${moduleBaseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      },

      put: async (endpoint: string, data?: any) => {
        const response = await fetch(`${moduleBaseUrl}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      },

      delete: async (endpoint: string) => {
        const response = await fetch(`${moduleBaseUrl}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      }
    };
  }

  private getAuthToken(): string {
    // Get token from localStorage or context
    return localStorage.getItem('authToken') || '';
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default ApiClient; 