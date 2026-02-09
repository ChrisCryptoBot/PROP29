/**
 * Sound Monitoring - Analytics Tab
 * Displays analytics and metrics
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';

export const AnalyticsTab: React.FC = () => {
  const { metrics } = useSoundMonitoringContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Sound monitoring metrics and performance
          </p>
        </div>
      </div>

      {/* Compact metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 border-b border-white/5 text-sm mb-6 font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Sound metrics">
        <span>Total alerts <strong className="font-black text-white ml-1">{metrics?.totalAlerts ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden>·</span>
        <span>Active <strong className="font-black text-white ml-1">{metrics?.activeAlerts ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden>·</span>
        <span>Resolved today <strong className="font-black text-white ml-1">{metrics?.resolvedToday ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden>·</span>
        <span>Avg dB <strong className="font-black text-white ml-1">{metrics?.averageDecibelLevel ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden>·</span>
        <span>Peak dB <strong className="font-black text-white ml-1">{metrics?.peakDecibelLevel ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden>·</span>
        <span>Zones <strong className="font-black text-white ml-1">{metrics?.zonesMonitored ?? 0}</strong></span>
      </div>

      {(!metrics || (metrics.totalAlerts === 0 && metrics.activeAlerts === 0 && metrics.zonesMonitored === 0)) ? (
        <EmptyState
          icon="fas fa-chart-bar"
          title="No analytics data"
          description="No sound monitoring data available. Connect hardware or enable ingestion to see analytics."
        />
      ) : (
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-chart-bar text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-white">Performance metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 border border-white/5 rounded-md">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                  <i className="fas fa-clock text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Response efficiency</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Average time</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white">{metrics?.responseTime ?? 0} <span className="text-sm opacity-50">MIN</span></p>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 rounded-md">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-md flex items-center justify-center border border-white/5">
                  <i className="fas fa-shield-alt text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">System reliability</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white">{metrics?.systemUptime ?? 0}<span className="text-sm opacity-50">%</span></p>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 rounded-md">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-amber-600 rounded-md flex items-center justify-center border border-white/5">
                  <i className="fas fa-bullseye text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Precision accuracy</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">False positive rate</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white">{metrics?.falsePositiveRate ?? 0}<span className="text-sm opacity-50">%</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};


