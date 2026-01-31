import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
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

  // Generate mock real-time data for charts
  const motionTrendData = useMemo<ChartDataPoint[]>(() => {
    const dataPoints: ChartDataPoint[] = [];
    const now = new Date();
    const intervalMinutes = timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : timeRange === '24h' ? 60 : 360;
    const totalPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 28;
    
    for (let i = totalPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * intervalMinutes * 60000));
      const baseValue = Math.sin((i / totalPoints) * Math.PI * 2) * 20 + 30;
      const randomVariation = (Math.random() - 0.5) * 10;
      const value = Math.max(0, Math.round(baseValue + randomVariation));
      
      dataPoints.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        value
      });
    }
    return dataPoints;
  }, [timeRange]);

  const alertTrendData = useMemo<ChartDataPoint[]>(() => {
    const dataPoints: ChartDataPoint[] = [];
    const now = new Date();
    const intervalMinutes = timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : timeRange === '24h' ? 60 : 360;
    const totalPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 28;
    
    for (let i = totalPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * intervalMinutes * 60000));
      const value = Math.floor(Math.random() * 5);
      
      dataPoints.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        value
      });
    }
    return dataPoints;
  }, [timeRange]);

  const cameraHeatMapData = useMemo<HeatMapData[]>(() => {
    return cameras.slice(0, 8).map(camera => {
      const activity = Math.floor(Math.random() * 100);
      return {
        camera: camera.name,
        activity,
        status: activity > 70 ? 'high' : activity > 30 ? 'medium' : 'low'
      };
    });
  }, [cameras, timeRange]);

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
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Real-time security metrics and trends
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded uppercase">LIVE</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-running text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Motion Events</p>
              <h3 className="text-3xl font-black text-white">{analytics.motionEvents}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Past {timeRange}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">ALERT</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-bell text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Alerts</p>
              <h3 className="text-3xl font-black text-white">{analytics.alertsTriggered}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Triggered</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">TIME</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-tachometer-alt text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Response</p>
              <h3 className="text-3xl font-black text-white">{analytics.averageResponseTime}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Resolution</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">PEAK</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-chart-area text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Peak Activity</p>
              <h3 className="text-3xl font-black text-white">{analytics.peakActivity}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Usage trends</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Motion Trend Chart */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 px-6 py-4">
            <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                <i className="fas fa-chart-line text-white text-sm" />
              </div>
              Motion Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 relative">
              {/* Simple SVG Chart */}
              <svg className="w-full h-full" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="motionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={30 * i} x2="400" y2={30 * i} stroke="#ffffff" strokeOpacity="0.05" />
                ))}
                {/* Chart line */}
                <polyline
                  fill="url(#motionGradient)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points={motionTrendData.map((point, i) => 
                    `${(i / (motionTrendData.length - 1)) * 400},${150 - (point.value / 50) * 120}`
                  ).join(' ')}
                />
                {/* Data points */}
                {motionTrendData.map((point, i) => (
                  <circle
                    key={i}
                    cx={(i / (motionTrendData.length - 1)) * 400}
                    cy={150 - (point.value / 50) * 120}
                    r="3"
                    fill="#3b82f6"
                  />
                ))}
              </svg>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{motionTrendData[0]?.time}</span>
              <span className="font-bold text-blue-400">Motion Events Over Time</span>
              <span>{motionTrendData[motionTrendData.length - 1]?.time}</span>
            </div>
          </CardContent>
        </Card>

        {/* Alert Frequency Chart */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 px-6 py-4">
            <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                <i className="fas fa-exclamation-triangle text-white text-sm" />
              </div>
              Alert Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 relative">
              {/* Bar Chart */}
              <svg className="w-full h-full" viewBox="0 0 400 150">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={30 * i} x2="400" y2={30 * i} stroke="#ffffff" strokeOpacity="0.05" />
                ))}
                {/* Bars */}
                {alertTrendData.map((point, i) => (
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
              </svg>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{alertTrendData[0]?.time}</span>
              <span className="font-bold text-red-400">Alerts Per Time Period</span>
              <span>{alertTrendData[alertTrendData.length - 1]?.time}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Activity Heat Map */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5">
              <i className="fas fa-fire text-white text-sm" />
            </div>
            Camera Activity Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cameraHeatMapData.map((camera, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:scale-105",
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
                  )} />
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
                  <span className="text-xs font-mono">{camera.activity}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



