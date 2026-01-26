/**
 * Guest Safety - Analytics Tab
 * Displays safety analytics and metrics
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { cn } from '../../../../utils/cn';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const AnalyticsTab: React.FC = () => {
  const { metrics, loading, refreshIncidents } = useGuestSafetyContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 60000; // 60 seconds for analytics

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshIncidents(); // Refresh incidents to update metrics
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Refresh failed. Showing last known state.');
    }
  }, [refreshIncidents]);

  useEffect(() => {
    const refresh = () => {
      refreshIncidents()
        .then(() => {
          setLastRefreshAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          setRefreshError('Auto-refresh failed. Showing last known state.');
        });
    };
    refresh();
    const intervalId = window.setInterval(refresh, 60000); // Refresh every 60 seconds
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshIncidents]);

  if (loading.metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Safety performance metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefreshedAt && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-10 px-3 rounded-full border flex items-center text-[9px] font-black uppercase tracking-widest",
                isStale
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
              aria-label={isStale ? 'Live data stale' : 'Live data synced'}
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
              aria-label="Refresh analytics"
              disabled={loading.incidents}
            >
              <i className={cn("fas fa-rotate-right mr-2", loading.incidents && "animate-spin")} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden" role="region" aria-label="Guest Safety Analytics Dashboard">
        <CardHeader className="bg-white/5 border-b border-white/5 py-6">
          <CardTitle className="flex items-center text-2xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-4 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
              <i className="fas fa-chart-line text-white text-xl" />
            </div>
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {metrics.responseMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl transition-all hover:bg-slate-900/70 group rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-clock text-white text-3xl" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mb-2">Average Response Time</p>
                <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.avgResponseTime}</h3>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-2 opacity-70">Response speed</p>
              </div>

              <div className="text-center p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl transition-all hover:bg-slate-900/70 group rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-check-double text-white text-3xl" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mb-2">Resolution Rate</p>
                <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.resolutionRate}</h3>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-2 opacity-70">Successfully resolved</p>
              </div>

              <div className="text-center p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl transition-all hover:bg-slate-900/70 group rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-shield-heart text-white text-3xl" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mb-2">Guest Satisfaction</p>
                <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.guestSatisfaction}</h3>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-2 opacity-70">Quality score</p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="fas fa-chart-line"
              title="No analytics data available"
              description="Analytics metrics will appear here as incidents are resolved and data is collected"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

