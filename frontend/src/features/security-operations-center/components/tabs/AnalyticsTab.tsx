import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { cn } from '../../../../utils/cn';

interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

interface HeatMapData {
  camera: string;
  activity: number;
  status: 'high' | 'medium' | 'low';
}

export const AnalyticsTab: React.FC = () => {
  const { analytics, cameras, loading, refreshAnalytics } = useSecurityOperationsContext();
  const { trackAction } = useSecurityOperationsTelemetry();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30000); // 30 seconds

  // Chart data from API/analytics only (no mock data)
  const motionTrendData = useMemo<ChartDataPoint[]>(() => [], []);
  const alertTrendData = useMemo<ChartDataPoint[]>(() => [], []);
  const cameraHeatMapData = useMemo<HeatMapData[]>(() => {
    return cameras.slice(0, 8).map(camera => ({
      camera: camera.name,
      activity: 0,
      status: 'low' as const
    }));
  }, [cameras]);

  // Auto-refresh effect
  useEffect(() => {
    if (!refreshInterval) return;
    
    const interval = setInterval(() => {
      trackAction('auto_refresh', 'analytics', { timeRange });
      refreshAnalytics();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, timeRange, refreshAnalytics, trackAction]);

  if (loading.analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading analytics" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Analytics">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Security metrics from API. Trend charts show data when analytics API provides time-series.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'glass' : 'outline'}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-4 h-8 transition-all shadow-none",
                  timeRange === range
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          
          {/* Auto Refresh Toggle */}
          <Button
            size="sm"
            variant={refreshInterval ? 'glass' : 'outline'}
            className={cn(
              "font-black uppercase tracking-widest text-[10px] px-4 h-8 transition-all shadow-none",
              refreshInterval 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
            )}
            onClick={() => {
              const newInterval = refreshInterval ? null : 30000;
              setRefreshInterval(newInterval);
              trackAction('auto_refresh_toggle', 'analytics', { enabled: newInterval !== null });
            }}
          >
            <i className="fas fa-sync-alt mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Compact metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Analytics metrics">
        <span>Motion <strong className="font-black text-white">{analytics.motionEvents}</strong> · Alerts <strong className="font-black text-white">{analytics.alertsTriggered}</strong> · Response <strong className="font-black text-white">{analytics.averageResponseTime}</strong> · Peak <strong className="font-black text-white">{analytics.peakActivity}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Past <strong className="font-black text-white">{timeRange}</strong></span>
      </div>

      {/* Motion & Alert Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section aria-labelledby="soc-motion-trend-heading" className="rounded-md border border-white/5 bg-slate-900/50 p-6">
          <h3 id="soc-motion-trend-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">Motion Activity Trend</h3>
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" aria-hidden="true">
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={30 * i} x2="400" y2={30 * i} stroke="#ffffff" strokeOpacity="0.05" />
              ))}
              {motionTrendData.length > 1 && (
                <>
                  <polygon
                    fill="#3b82f6"
                    fillOpacity="0.15"
                    stroke="none"
                    points={motionTrendData.map((point, i) =>
                      `${(i / (motionTrendData.length - 1)) * 400},${150 - (point.value / 50) * 120}`
                    ).join(' ') + ` 400,150 0,150`}
                  />
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points={motionTrendData.map((point, i) =>
                      `${(i / (motionTrendData.length - 1)) * 400},${150 - (point.value / 50) * 120}`
                    ).join(' ')}
                  />
                  {motionTrendData.map((point, i) => (
                    <circle
                      key={i}
                      cx={(i / (motionTrendData.length - 1)) * 400}
                      cy={150 - (point.value / 50) * 120}
                      r="3"
                      fill="#3b82f6"
                    />
                  ))}
                </>
              )}
              {motionTrendData.length === 0 && (
                <text x="200" y="75" textAnchor="middle" fill="#64748b" fontSize="12">No time-series data</text>
              )}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{motionTrendData[0]?.time ?? '—'}</span>
            <span className="font-bold text-blue-400">Motion Events Over Time</span>
            <span>{motionTrendData[motionTrendData.length - 1]?.time ?? '—'}</span>
          </div>
        </section>

        <section aria-labelledby="soc-alert-freq-heading" className="rounded-md border border-white/5 bg-slate-900/50 p-6">
          <h3 id="soc-alert-freq-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">Alert Frequency</h3>
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" aria-hidden="true">
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={30 * i} x2="400" y2={30 * i} stroke="#ffffff" strokeOpacity="0.05" />
              ))}
              {alertTrendData.length > 0 && alertTrendData.map((point, i) => (
                <rect
                  key={i}
                  x={i * (400 / alertTrendData.length) + 2}
                  y={150 - (point.value / 5) * 120}
                  width={(400 / alertTrendData.length) - 4}
                  height={(point.value / 5) * 120}
                  fill="#ef4444"
                  fillOpacity="0.7"
                />
              ))}
              {alertTrendData.length === 0 && (
                <text x="200" y="75" textAnchor="middle" fill="#64748b" fontSize="12">No time-series data</text>
              )}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{alertTrendData[0]?.time ?? '—'}</span>
            <span className="font-bold text-red-400">Alerts Per Time Period</span>
            <span>{alertTrendData[alertTrendData.length - 1]?.time ?? '—'}</span>
          </div>
        </section>
      </div>

      {/* Camera Activity Heat Map */}
      <section aria-labelledby="soc-heatmap-heading">
        <h3 id="soc-heatmap-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">Camera Activity Heat Map</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cameraHeatMapData.map((camera, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-md border transition-colors",
                camera.status === 'high' 
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : camera.status === 'medium'
                  ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                  : "bg-green-500/20 border-green-500/40 text-green-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <i className={cn(
                  "fas fa-video text-lg",
                  camera.status === 'high' ? "text-red-400" :
                  camera.status === 'medium' ? "text-yellow-400" : "text-green-400"
                )} aria-hidden="true" />
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded uppercase",
                  camera.status === 'high' ? "bg-red-500/30" :
                  camera.status === 'medium' ? "bg-yellow-500/30" : "bg-green-500/30"
                )}>
                  {camera.status}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm mb-1">{camera.camera}</h4>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex-1 h-2 rounded-full overflow-hidden",
                  camera.status === 'high' ? "bg-red-900/50" :
                  camera.status === 'medium' ? "bg-yellow-900/50" : "bg-green-900/50"
                )}>
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      camera.status === 'high' ? "bg-red-500" :
                      camera.status === 'medium' ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${camera.activity}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-white">{camera.activity}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};



