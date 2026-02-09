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
      {/* Metrics bar (gold standard — no KPI card grid) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Sound monitoring metrics">
        <span>Active Alerts <strong className="font-black text-white">{safeMetrics.activeAlerts}</strong></span>
        <span className="text-white/30" aria-hidden>|</span>
        <span>Avg dB <strong className="font-black text-white">{safeMetrics.averageDecibelLevel}</strong></span>
        <span className="text-white/30" aria-hidden>|</span>
        <span>Zones <strong className="font-black text-white">{safeMetrics.zonesMonitored}</strong></span>
        <span className="text-white/30" aria-hidden>|</span>
        <span>Active Sensors <strong className="font-black text-white">{safeMetrics.sensorsActive}</strong></span>
      </div>

      {/* Recent Sound Alerts */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-bell text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Recent sound alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {soundAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onViewAlert(alert)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                    <i className="fas fa-volume-up text-white text-xl" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{alert.type}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)]">{formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}</p>
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
                  <i className="fas fa-chevron-right text-slate-500 ml-2" aria-hidden />
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

