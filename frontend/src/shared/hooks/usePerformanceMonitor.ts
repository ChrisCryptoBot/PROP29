import { useCallback, useRef, useEffect } from 'react';

interface PerformanceMetrics {
  renderTime?: number;
  componentCount?: number;
  memoryUsage?: number;
  bundleSize?: number;
  apiCalls?: number;
  errorCount?: number;
}

interface PerformanceHook {
  startTiming: (label: string) => void;
  endTiming: (label: string) => number | null;
  recordMetric: (name: string, value: number, unit?: string) => void;
  recordRender: () => void;
  recordError: (error: Error) => void;
  getMetrics: () => PerformanceMetrics;
}

export const usePerformanceMonitor = (moduleName: string): PerformanceHook => {
  const timingsRef = useRef<Map<string, number>>(new Map());
  const renderCountRef = useRef(0);
  const renderStartRef = useRef<number>();
  const metricsRef = useRef<PerformanceMetrics>({});

  const startTiming = useCallback((label: string) => {
    timingsRef.current.set(label, performance.now());
  }, []);

  const endTiming = useCallback((label: string): number | null => {
    const startTime = timingsRef.current.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      timingsRef.current.delete(label);
      return duration;
    }
    return null;
  }, []);

  const recordMetric = useCallback((name: string, value: number, unit?: string) => {
    metricsRef.current[name as keyof PerformanceMetrics] = value;
  }, []);

  const recordRender = useCallback(() => {
    renderCountRef.current++;
    renderStartRef.current = performance.now();
  }, []);

  const recordError = useCallback((error: Error) => {
    metricsRef.current.errorCount = (metricsRef.current.errorCount || 0) + 1;
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => {
    return {
      ...metricsRef.current,
      renderTime: renderStartRef.current ? performance.now() - renderStartRef.current : undefined,
      componentCount: renderCountRef.current,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }, []);

  return {
    startTiming,
    endTiming,
    recordMetric,
    recordRender,
    recordError,
    getMetrics
  };
}; 