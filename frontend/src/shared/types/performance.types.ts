export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  module?: string;
  category?: string;
}

export interface TimingMetric {
  label: string;
  duration: number;
  timestamp: number;
}

export interface RenderMetric {
  componentName: string;
  renderTime: number;
  renderCount: number;
  timestamp: number;
}

export interface MemoryMetric {
  used: number;
  total: number;
  limit: number;
  timestamp: number;
}

export interface NetworkMetric {
  url: string;
  method: string;
  size: number;
  duration: number;
  status: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface PerformanceReport {
  moduleName: string;
  score: number;
  metrics: PerformanceMetric[];
  issues: string[];
  recommendations: string[];
  timestamp: number;
} 