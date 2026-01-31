/**
 * Sound Monitoring - Overview Tab
 * Displays key metrics and recent sound alerts
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';
import type { SoundAlert } from '../../types/sound-monitoring.types';

interface OverviewTabProps {
  onViewAlert: (alert: SoundAlert) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onViewAlert,
}) => {
  const { soundAlerts, metrics } = useSoundMonitoringContext();

  // Handle null metrics (should never happen due to defaultMetrics, but TypeScript needs it)
  const safeMetrics = metrics || {
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedToday: 0,
    averageDecibelLevel: 0,
    peakDecibelLevel: 0,
    systemUptime: 0,
    falsePositiveRate: 0,
    responseTime: 0,
    zonesMonitored: 0,
    sensorsActive: 0
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="group" aria-label="Sound Monitoring key metrics">
        {/* Active Alerts */}
        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded shadow-sm">
              Live
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-exclamation-triangle text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Active Alerts</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Active alerts: ${safeMetrics.activeAlerts}`}>
                {safeMetrics.activeAlerts}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Requires urgent response</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Decibel Level */}
        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded shadow-sm">
              {safeMetrics.averageDecibelLevel}dB
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-volume-up text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Avg. Decibel Level</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Average decibel level: ${safeMetrics.averageDecibelLevel} dB`}>
                {safeMetrics.averageDecibelLevel}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Baseline environment levels</p>
            </div>
          </CardContent>
        </Card>

        {/* Zones Monitored */}
        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shadow-sm">
              Active
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-map-marker-alt text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Zones Monitored</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Zones monitored: ${safeMetrics.zonesMonitored}`}>
                {safeMetrics.zonesMonitored}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Facility coverage map</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Sensors */}
        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shadow-sm">
              Online
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-microchip text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Active Sensors</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Active sensors: ${safeMetrics.sensorsActive}`}>
                {safeMetrics.sensorsActive}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Hardware registry sync</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sound Alerts */}
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mr-3 shadow-lg" aria-hidden="true">
              <i className="fas fa-bell text-white text-lg" />
            </div>
            Recent Sound Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {soundAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group shadow-inner"
                onClick={() => onViewAlert(alert)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-volume-up text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{alert.type}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">{formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center">
                      <i className="fas fa-clock mr-1 opacity-50" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getSeverityBadgeClass(alert.severity))}>
                    {alert.severity}
                  </span>
                  <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getStatusBadgeClass(alert.status))}>
                    {alert.status}
                  </span>
                  <i className="fas fa-chevron-right text-slate-600 group-hover:text-blue-400 transition-colors ml-2" />
                </div>
              </div>
            ))}
            {soundAlerts.length === 0 && (
              <EmptyState
                icon="fas fa-volume-up"
                title="No sound alerts found"
                description="Acoustic monitoring active. No anomalies detected in the current registry. Environmental decibel levels within normal range."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

