/**
 * Performance Monitor for PROPER 2.9
 * Tracks and reports performance metrics for modules
 */

import { ModuleEventBus, ModuleEvent } from '../events';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  errorCount: number;
  apiCallCount: number;
  lastUpdated: number;
}

interface ModulePerformance {
  [moduleName: string]: PerformanceMetrics;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: ModulePerformance = {};
  private eventBus: ModuleEventBus;

  private constructor() {
    this.eventBus = ModuleEventBus.getInstance();
    this.setupEventListeners();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupEventListeners() {
    // Listen for module lifecycle events
    this.eventBus.subscribe('module.loaded', (event) => {
      this.recordModuleLoad(event.module, event.data.loadTime || 0);
    });

    this.eventBus.subscribe('module.error', (event) => {
      this.recordError(event.module, event.data.error || 'Unknown error');
    });

    this.eventBus.subscribe('module.render', (event) => {
      this.recordRender(event.module, event.data.renderTime || 0);
    });
  }

  recordModuleLoad(moduleName: string, loadTime: number) {
    if (!this.metrics[moduleName]) {
      this.metrics[moduleName] = this.createDefaultMetrics();
    }

    this.metrics[moduleName].loadTime = loadTime;
    this.metrics[moduleName].lastUpdated = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Module Load: ${moduleName}`, { loadTime: `${loadTime}ms` });
    }
  }

  recordRender(moduleName: string, renderTime: number) {
    if (!this.metrics[moduleName]) {
      this.metrics[moduleName] = this.createDefaultMetrics();
    }

    this.metrics[moduleName].renderTime = renderTime;
    this.metrics[moduleName].lastUpdated = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Module Render: ${moduleName}`, { renderTime: `${renderTime}ms` });
    }
  }

  recordError(moduleName: string, error: string) {
    if (!this.metrics[moduleName]) {
      this.metrics[moduleName] = this.createDefaultMetrics();
    }

    this.metrics[moduleName].errorCount++;
    this.metrics[moduleName].lastUpdated = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.error(`📊 Module Error: ${moduleName}`, { error, count: this.metrics[moduleName].errorCount });
    }
  }

  recordApiCall(moduleName: string) {
    if (!this.metrics[moduleName]) {
      this.metrics[moduleName] = this.createDefaultMetrics();
    }

    this.metrics[moduleName].apiCallCount++;
    this.metrics[moduleName].lastUpdated = Date.now();
  }

  recordMemoryUsage(moduleName: string, memoryUsage: number) {
    if (!this.metrics[moduleName]) {
      this.metrics[moduleName] = this.createDefaultMetrics();
    }

    this.metrics[moduleName].memoryUsage = memoryUsage;
    this.metrics[moduleName].lastUpdated = Date.now();
  }

  getMetrics(moduleName?: string): PerformanceMetrics | ModulePerformance {
    if (moduleName) {
      return this.metrics[moduleName] || this.createDefaultMetrics();
    }
    return { ...this.metrics };
  }

  getModuleStats(moduleName: string) {
    const metrics = this.metrics[moduleName];
    if (!metrics) {
      return null;
    }

    return {
      moduleName,
      averageRenderTime: metrics.renderTime,
      averageLoadTime: metrics.loadTime,
      totalErrors: metrics.errorCount,
      totalApiCalls: metrics.apiCallCount,
      memoryUsage: metrics.memoryUsage,
      lastActivity: new Date(metrics.lastUpdated).toISOString(),
      health: this.calculateHealth(metrics)
    };
  }

  getAllStats() {
    const moduleNames = Object.keys(this.metrics);
    const stats = moduleNames.map(name => this.getModuleStats(name)).filter(Boolean);

    const overallStats = {
      totalModules: moduleNames.length,
      averageRenderTime: this.calculateAverage(moduleNames.map(name => this.metrics[name].renderTime)),
      averageLoadTime: this.calculateAverage(moduleNames.map(name => this.metrics[name].loadTime)),
      totalErrors: moduleNames.reduce((sum, name) => sum + this.metrics[name].errorCount, 0),
      totalApiCalls: moduleNames.reduce((sum, name) => sum + this.metrics[name].apiCallCount, 0),
      averageMemoryUsage: this.calculateAverage(moduleNames.map(name => this.metrics[name].memoryUsage)),
      modules: stats
    };

    return overallStats;
  }

  clearMetrics(moduleName?: string) {
    if (moduleName) {
      delete this.metrics[moduleName];
    } else {
      this.metrics = {};
    }
  }

  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      stats: this.getAllStats()
    };
  }

  private createDefaultMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      loadTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      apiCallCount: 0,
      lastUpdated: Date.now()
    };
  }

  private calculateHealth(metrics: PerformanceMetrics): 'excellent' | 'good' | 'warning' | 'critical' {
    const { renderTime, loadTime, errorCount } = metrics;

    if (errorCount > 10 || renderTime > 1000 || loadTime > 5000) {
      return 'critical';
    }

    if (errorCount > 5 || renderTime > 500 || loadTime > 2000) {
      return 'warning';
    }

    if (errorCount > 0 || renderTime > 200 || loadTime > 1000) {
      return 'good';
    }

    return 'excellent';
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

// Create and export the singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export the class for testing
export { PerformanceMonitor };

// Default export for convenience
export default PerformanceMonitor;
