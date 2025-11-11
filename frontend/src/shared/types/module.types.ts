import React from 'react';
import { Permission } from './auth.types';

export interface ModuleManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  dependencies: string[];
  permissions: Permission[];
  routes: RouteConfig[];
  lazy: () => Promise<{ default: React.ComponentType }>;
  preload?: () => Promise<void>;
  metadata: ModuleMetadata;
}

export interface ModuleMetadata {
  category: string;
  tags: string[];
  author: string;
  bundle: BundleConfig;
  features?: string[];
  icon?: string;
  priority?: number;
}

export interface BundleConfig {
  maxSize: string;
  loadPriority: 'high' | 'medium' | 'low';
  preload?: boolean;
  chunks?: string[];
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  title?: string;
  description?: string;
  permissions?: Permission[];
  public?: boolean;
  hidden?: boolean;
}

export interface RouteMetadata {
  title?: string;
  description?: string;
  permissions?: Permission[];
  public?: boolean;
  hidden?: boolean;
}

export interface ModuleConfig {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  permissions: Permission[];
  routes: RouteConfig[];
  lazy: () => Promise<{ default: React.ComponentType }>;
  preload?: () => Promise<void>;
}

export interface ModuleState {
  name: string;
  enabled: boolean;
  permissions: Permission[];
  features: Record<string, boolean>;
  settings: Record<string, any>;
}

export interface ModulePerformance {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  errorCount: number;
  cacheHitRate: number;
} 

export interface ModuleMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  lastAccessed: number;
} 