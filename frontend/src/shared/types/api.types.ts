export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface RequestConfig {
  cache?: boolean;
  timeout?: number;
  retries?: number;
  priority?: 'high' | 'medium' | 'low';
  signal?: AbortSignal;
}

export interface ApiMetrics {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  cached?: boolean;
  retryCount?: number;
  error?: string;
} 