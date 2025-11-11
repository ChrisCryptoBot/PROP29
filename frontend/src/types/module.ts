export interface ModuleDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  category: string;
  priority: number;
  dependencies: string[];
  permissions: string[];
  features: string[];
  api: {
    baseUrl: string;
    endpoints: string[];
  };
  ui: {
    component: string;
    icon: string;
    color: string;
    tabs: Array<{
      id: string;
      name: string;
      component: string;
    }>;
  };
  events: string[];
  settings: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    enableNotifications?: boolean;
    logRetention?: number;
    [key: string]: any;
  };
}

export interface ModuleRegistry {
  [moduleId: string]: ModuleDefinition;
}

export interface ModuleTab {
  id: string;
  name: string;
  component: string;
  isActive?: boolean;
}

export interface ModuleEvent {
  type: string;
  moduleId: string;
  data: any;
  timestamp: number;
}

export interface ModuleSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  enableNotifications: boolean;
  logRetention: number;
  [key: string]: any;
}

export interface ModuleAPI {
  baseUrl: string;
  endpoints: string[];
  get: (endpoint: string, params?: any) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
}

export interface ModuleContext {
  moduleId: string;
  module: ModuleDefinition;
  api: ModuleAPI;
  settings: ModuleSettings;
  events: {
    emit: (eventType: string, data: any) => void;
    on: (eventType: string, handler: (data: any) => void) => void;
    off: (eventType: string, handler: (data: any) => void) => void;
  };
} 