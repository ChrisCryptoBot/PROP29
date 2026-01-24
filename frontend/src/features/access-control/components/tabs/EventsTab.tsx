/**
 * Events Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 2901-2974)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 */

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { cn } from '../../../../utils/cn';
import { Select } from '../../../../components/UI/Select';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Events Tab Component
 * Displays access events in a chronological list
 */
const EventsTabComponent: React.FC = () => {
  const {
    accessEvents,
    loading,
    refreshAccessEvents,
    exportAccessEvents,
    reviewAgentEvent,
    recordAuditEntry,
  } = useAccessControlContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | 'granted' | 'denied' | 'timeout'>('all');
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshAccessEvents();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Live refresh failed. Showing last known state.');
    }
  }, [refreshAccessEvents]);

  useEffect(() => {
    const refresh = () => {
      refreshAccessEvents()
        .then(() => {
          setLastRefreshAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          setRefreshError('Live refresh failed. Showing last known state.');
        });
    };
    refresh();
    const intervalId = window.setInterval(refresh, 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshAccessEvents]);

  const handleFilterLogs = useCallback(async () => {
    if (actionFilter === 'all') {
      await refreshAccessEvents();
      return;
    }
    await refreshAccessEvents({ action: actionFilter });
  }, [actionFilter, refreshAccessEvents]);

  // Memoize sorted events (most recent first)
  const sortedEvents = useMemo(() => {
    return [...accessEvents].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [accessEvents]);

  const pendingAgentEvents = useMemo(
    () => sortedEvents.filter((e) => (e as { review_status?: string }).review_status === 'pending'),
    [sortedEvents]
  );

  const handleReview = useCallback(
    async (eventId: string, action: 'approve' | 'reject') => {
      let reason: string | undefined;
      if (action === 'reject') {
        const v = window.prompt('Optional reason for rejection:');
        reason = typeof v === 'string' && v.trim() ? v.trim() : undefined;
      }
      try {
        await reviewAgentEvent(eventId, action, reason);
        recordAuditEntry({
          action: `Agent event ${action}d`,
          status: 'success',
          target: eventId,
          reason: reason ?? undefined,
          source: 'web_admin',
        });
      } catch {
        recordAuditEntry({
          action: `Agent event ${action} failed`,
          status: 'failure',
          target: eventId,
          source: 'web_admin',
        });
      }
    },
    [reviewAgentEvent, recordAuditEntry]
  );

  // Loading state
  if (loading.accessEvents && accessEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Access Events">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Access Logs</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            View and audit access events
          </p>
          {lastRefreshAt && (
            <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mt-2 opacity-60">
              Last synced: {lastRefreshAt.toLocaleTimeString()}
            </p>
          )}
          {refreshError && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1">
              {refreshError}
            </p>
          )}
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
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}
              aria-label={isStale ? 'Live data stale' : 'Live data synced'}
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
              aria-label="Refresh access events"
            >
              <i className="fas fa-rotate-right mr-2" aria-hidden="true" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              onClick={() => exportAccessEvents('csv')}
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 shadow-none"
              aria-label="Export access events"
            >
              <i className="fas fa-file-export mr-2" aria-hidden="true" />
              Export Logs
            </Button>
            <div className="w-48">
              <Select
                id="access-action-filter"
                label="Filter"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value as typeof actionFilter)}
                aria-label="Filter access events by action"
                className="text-[10px] font-black uppercase tracking-widest"
              >
                <option value="all">ALL ACTIONS</option>
                <option value="granted">GRANTED</option>
                <option value="denied">DENIED</option>
                <option value="timeout">TIMEOUT</option>
              </Select>
            </div>
            <Button
              variant="outline"
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] shadow-none"
              onClick={handleFilterLogs}
              aria-label="Filter access events"
            >
              <i className="fas fa-filter mr-2" aria-hidden="true" />
              Filter Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Pending agent events (hardware / mobile ingest) */}
      {pendingAgentEvents.length > 0 && (
        <Card className="bg-amber-950/20 border border-amber-500/20 shadow-2xl overflow-hidden" role="region" aria-label="Pending agent events">
          <CardHeader className="border-b border-amber-500/20 px-6 py-4">
            <CardTitle className="flex items-center text-xl text-amber-400 font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
                <i className="fas fa-mobile-alt text-white text-base" />
              </div>
              Pending agent events ({pendingAgentEvents.length})
            </CardTitle>
            <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-[0.2em] mt-2 italic">
              Submitted by mobile or hardware; approve or reject for audit.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3" role="list" aria-label="Pending agent events list">
              {pendingAgentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 border border-amber-500/10 rounded-2xl hover:bg-white/5 transition-all"
                  role="listitem"
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-600/80 to-slate-900 border border-white/5 shadow-2xl" aria-hidden="true">
                      <i className="fas fa-user-clock text-amber-400 text-lg" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-tight">{event.userName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{event.accessPointName}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {event.location} · {event.accessMethod}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="glass"
                      className="text-[10px] font-black uppercase tracking-widest px-4 border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 shadow-none"
                      onClick={() => handleReview(event.id, 'approve')}
                      aria-label={`Approve agent event ${event.id}`}
                    >
                      <i className="fas fa-check mr-2" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="glass"
                      className="text-[10px] font-black uppercase tracking-widest px-4 border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
                      onClick={() => handleReview(event.id, 'reject')}
                      aria-label={`Reject agent event ${event.id}`}
                    >
                      <i className="fas fa-times mr-2" aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Registry */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-bars-staggered text-white text-base" />
            </div>
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading.accessEvents ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Loading Events...</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <EmptyState
              icon="fas fa-tower-observation"
              title="No Events Found"
              description="No access events match your current filter."
              className="bg-black/20 border-dashed border-2 border-white/5 rounded-3xl p-12"
            />
          ) : (
            <div className="space-y-3" role="list" aria-label="Access events list">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 border border-white/5 rounded-2xl group hover:bg-white/5 transition-all shadow-2xl"
                  role="listitem"
                >
                  <div className="flex items-center space-x-5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300",
                        event.action === 'granted' ? 'bg-gradient-to-br from-emerald-600/80 to-slate-900' : 'bg-gradient-to-br from-red-600/80 to-slate-900'
                      )}
                      aria-label={`Access ${event.action}`}
                      aria-hidden="true"
                    >
                      <i className={cn("fas text-lg text-white", event.action === 'granted' ? 'fa-user-check' : 'fa-user-slash')} />
                    </div>
                    <div>
                      <h4 className="font-black text-[color:var(--text-main)] text-sm uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                        {event.userName}
                      </h4>
                      <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mt-0.5 opacity-60">
                        {event.accessPointName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1.5">
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">
                          <i className="fas fa-location-dot mr-1.5 opacity-40" />
                          {event.location}
                        </p>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                          <i className="fas fa-id-card mr-1.5 opacity-40" />
                          {event.accessMethod.toUpperCase()}
                        </p>
                      </div>
                      {event.reason && (
                        <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-2 p-1 px-2 bg-red-500/5 border border-red-500/10 rounded" role="alert">
                          <i className="fas fa-warning mr-1.5" />
                          ACCESS DENIED: {event.reason.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest border",
                        event.action === 'granted'
                          ? 'text-green-400 bg-green-500/10 border-green-500/20'
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      )}
                      aria-label={`Access ${event.action}`}
                    >
                      {event.action.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-black mt-2 uppercase tracking-tighter opacity-60" aria-label={`Time: ${new Date(event.timestamp).toLocaleString()}`}>
                      <i className="fas fa-clock mr-1.5 opacity-30" />
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-[8px] text-[color:var(--text-sub)] font-black uppercase tracking-[0.2em] opacity-30 mt-0.5">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * EventsTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 */
export const EventsTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="Events Tab">
      <EventsTabComponent />
    </ErrorBoundary>
  );
});

EventsTab.displayName = 'EventsTab';
export default EventsTab;
