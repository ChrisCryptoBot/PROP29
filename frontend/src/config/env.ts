/**
 * Environment Configuration
 * Centralized access to environment variables with type safety
 */

interface EnvConfig {
  API_BASE_URL: string;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'production' | 'staging' | 'test';
  VERSION: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  ENABLE_DEBUG: boolean;
}

function getEnvVar(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Environment variable ${key} is not set, using default: ${defaultValue}`);
    }
    return defaultValue;
  }
  return value;
}

function getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

const rawApiBaseUrl = getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:8000/api');
// Use full backend URL so requests hit the API server (e.g. 8000), not the dev server (3000)
const normalizedApiBaseUrl = rawApiBaseUrl.startsWith('http') ? rawApiBaseUrl.replace(/\/+$/, '') : `http://localhost:8000${rawApiBaseUrl.startsWith('/') ? '' : '/'}${rawApiBaseUrl}`;

const rawWsUrl = getEnvVar('REACT_APP_WS_URL', 'ws://localhost:8000/ws');
// WebSocket must connect to the backend (8000), not the frontend dev server (3000)
const normalizedWsUrl = /:\d+/.test(rawWsUrl) && (rawWsUrl.includes(':3000') || rawWsUrl.includes('localhost:3000'))
  ? 'ws://localhost:8000/ws'
  : rawWsUrl.startsWith('ws') ? rawWsUrl.replace(/\/+$/, '') : `ws://localhost:8000${rawWsUrl.startsWith('/') ? rawWsUrl : '/ws'}`;

/** Backend origin (e.g. http://localhost:8000) for direct requests (e.g. HLS stream proxy). */
export const getBackendOrigin = (): string => {
  const base = normalizedApiBaseUrl;
  const withoutTrailing = base.replace(/\/+$/, '');
  if (withoutTrailing.endsWith('/api')) return withoutTrailing.replace(/\/api\/?$/, '');
  try {
    const u = new URL(base);
    return u.origin;
  } catch {
    return 'http://localhost:8000';
  }
};

export const env: EnvConfig = {
  API_BASE_URL: normalizedApiBaseUrl,
  WS_URL: normalizedWsUrl,
  ENVIRONMENT: (getEnvVar('REACT_APP_ENVIRONMENT', 'development') as EnvConfig['ENVIRONMENT']) || 'development',
  VERSION: getEnvVar('REACT_APP_VERSION', '2.9.0'),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG: getBooleanEnvVar('REACT_APP_ENABLE_DEBUG', process.env.NODE_ENV === 'development'),
} as const;

// Validate critical environment variables in production
if (env.IS_PRODUCTION) {
  if (!env.API_BASE_URL || env.API_BASE_URL === 'http://localhost:8000/api') {
    console.error('WARNING: API_BASE_URL is not properly configured for production!');
  }
  if (!env.WS_URL || env.WS_URL === 'ws://localhost:8000/ws') {
    console.error('WARNING: WS_URL is not properly configured for production!');
  }
}

export default env;
