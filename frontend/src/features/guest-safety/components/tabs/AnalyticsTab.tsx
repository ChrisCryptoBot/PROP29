/**
 * Guest Safety - Analytics Tab
 * Displays safety analytics and metrics
 */

import React, { useCallback, useEffect, useState } from 'react';
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
  const { metrics, loading, refreshIncidents, incidents } = useGuestSafetyContext();
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

  if (loading.incidents && incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading analytics">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
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

      {/* Compact metrics bar (gold standard — no KPI cards) */}
      {metrics.responseMetrics && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Guest safety analytics metrics">
          <span>Response <strong className="font-black text-white">{metrics.responseMetrics.avgResponseTime}</strong></span>
          <span className="text-white/30" aria-hidden="true">|</span>
          <span>Resolution <strong className="font-black text-white">{metrics.responseMetrics.resolutionRate}</strong></span>
          <span className="text-white/30" aria-hidden="true">|</span>
          <span>Satisfaction <strong className="font-black text-white">{metrics.responseMetrics.guestSatisfaction}</strong></span>
        </div>
      )}

      <section aria-labelledby="analytics-heading">
        <h3 id="analytics-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
            <i className="fas fa-chart-line text-white text-lg" />
          </div>
          Analytics
        </h3>
        <div className="rounded-md border border-white/5 p-6">
          {metrics.responseMetrics ? (
            <p className="text-sm text-[color:var(--text-sub)]">
              Response time, resolution rate, and guest satisfaction metrics are displayed above. Additional analytics will appear as more incident data is collected.
            </p>
          ) : (
            <EmptyState
              icon="fas fa-chart-line"
              title="No analytics data available"
              description="Analytics metrics will appear here as incidents are resolved and data is collected"
            />
          )}
        </div>
      </section>
    </div>
  );
};

