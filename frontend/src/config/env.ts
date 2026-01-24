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

const rawApiBaseUrl = getEnvVar('REACT_APP_API_BASE_URL', '/api');
const normalizedApiBaseUrl = (() => {
  if (typeof window === 'undefined') {
    return rawApiBaseUrl;
  }
  if (
    process.env.NODE_ENV === 'development' &&
    (rawApiBaseUrl.startsWith('http://localhost:8000') ||
      rawApiBaseUrl.startsWith('http://127.0.0.1:8000'))
  ) {
    return '/api';
  }
  return rawApiBaseUrl;
})();

export const env: EnvConfig = {
  API_BASE_URL: normalizedApiBaseUrl,
  WS_URL: getEnvVar('REACT_APP_WS_URL', 'ws://localhost:8000/ws'),
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
