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
import { Select } from '../../../../components/UI/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';

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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_admin' | 'mobile_agent' | 'hardware_device' | 'system'>('all');
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Memoize sorted events (most recent first) with source filtering
  const sortedEvents = useMemo(() => {
    let filtered = [...accessEvents];
    
    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(event => event.source === sourceFilter);
    }
    
    return filtered.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [accessEvents, sourceFilter]);

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(start, start + itemsPerPage);
  }, [sortedEvents, currentPage, itemsPerPage]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [actionFilter]);

  const pendingAgentEvents = useMemo(
    () => sortedEvents.filter((e) => (e as { review_status?: string }).review_status === 'pending'),
    [sortedEvents]
  );

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingEvent, setReviewingEvent] = useState<{ eventId: string; action: 'approve' | 'reject' } | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const handleReview = useCallback(
    async (eventId: string, action: 'approve' | 'reject') => {
      if (action === 'reject') {
        // Open modal for rejection reason
        setReviewingEvent({ eventId, action });
        setReviewReason('');
        setShowReviewModal(true);
        return;
      }
      // Approve immediately
      try {
        await reviewAgentEvent(eventId, action);
        recordAuditEntry({
          action: `Agent event ${action}d`,
          status: 'success',
          target: eventId,
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

  const handleConfirmReview = useCallback(async () => {
    if (!reviewingEvent) return;
    try {
      await reviewAgentEvent(reviewingEvent.eventId, reviewingEvent.action, reviewReason.trim() || undefined);
      recordAuditEntry({
        action: `Agent event ${reviewingEvent.action}d`,
        status: 'success',
        target: reviewingEvent.eventId,
        reason: reviewReason.trim() || undefined,
        source: 'web_admin',
      });
      setShowReviewModal(false);
      setReviewingEvent(null);
      setReviewReason('');
    } catch {
      recordAuditEntry({
        action: `Agent event ${reviewingEvent.action} failed`,
        status: 'failure',
        target: reviewingEvent.eventId,
        source: 'web_admin',
      });
    }
  }, [reviewingEvent, reviewReason, reviewAgentEvent, recordAuditEntry]);

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
                label="Action"
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
            <div className="w-48">
              <Select
                id="access-source-filter"
                label="Source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
                aria-label="Filter access events by source"
                className="text-[10px] font-black uppercase tracking-widest"
              >
                <option value="all">ALL SOURCES</option>
                <option value="web_admin">WEB ADMIN</option>
                <option value="mobile_agent">MOBILE AGENT</option>
                <option value="hardware_device">HARDWARE</option>
                <option value="system">SYSTEM</option>
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
        <Card className="bg-amber-950/20 border border-amber-500/20  overflow-hidden" role="region" aria-label="Pending agent events">
          <CardHeader className="border-b border-amber-500/20 px-6 py-4">
            <CardTitle className="flex items-center text-xl text-amber-400 font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3  border border-white/5" aria-hidden="true">
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-600/80 to-slate-900 border border-white/5 " aria-hidden="true">
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
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5  overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3  border border-white/5" aria-hidden="true">
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
            <>
              <div className="space-y-3" role="list" aria-label="Access events list">
                {paginatedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 border border-white/5 rounded-2xl group hover:bg-white/5 transition-all "
                  role="listitem"
                >
                  <div className="flex items-center space-x-5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center  border border-white/5 group-hover:scale-110 transition-transform duration-300",
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
                          {formatLocationDisplay(event.location as string | { lat?: number; lng?: number } | null) || '—'}
                        </p>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                          <i className="fas fa-id-card mr-1.5 opacity-40" />
                          {event.accessMethod.toUpperCase()}
                        </p>
                      </div>
                      {event.source_agent_id && (
                        <p className="text-[8px] text-amber-400 font-black uppercase tracking-widest mt-1 opacity-70">
                          <i className="fas fa-mobile-alt mr-1" />
                          Agent: {event.source_agent_id.slice(0, 8)}
                        </p>
                      )}
                      {event.source_device_id && (
                        <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest mt-1 opacity-70">
                          <i className="fas fa-microchip mr-1" />
                          Device: {event.source_device_id.slice(0, 8)}
                        </p>
                      )}
                      {event.reason && (
                        <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-2 p-1 px-2 bg-red-500/5 border border-red-500/10 rounded" role="alert">
                          <i className="fas fa-warning mr-1.5" />
                          ACCESS DENIED: {event.reason.toUpperCase()}
                        </p>
                      )}
                      {event.rejection_reason && (
                        <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-2 p-1 px-2 bg-red-500/5 border border-red-500/10 rounded" role="alert">
                          <i className="fas fa-times-circle mr-1.5" />
                          REJECTED: {event.rejection_reason.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
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
                      {event.source && (
                        <span
                          className={cn(
                            "px-2 py-1 text-[9px] font-black rounded uppercase tracking-widest border",
                            event.source === 'mobile_agent'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : event.source === 'hardware_device'
                              ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              : event.source === 'system'
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                              : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                          )}
                          aria-label={`Source: ${event.source}`}
                        >
                          {event.source === 'mobile_agent' ? 'MOBILE' : 
                           event.source === 'hardware_device' ? 'HARDWARE' :
                           event.source === 'system' ? 'SYSTEM' : 'WEB'}
                        </span>
                      )}
                      {event.review_status === 'pending' && (
                        <span
                          className="px-2 py-1 text-[9px] font-black rounded uppercase tracking-widest border text-amber-400 bg-amber-500/10 border-amber-500/20"
                          aria-label="Pending review"
                        >
                          PENDING
                        </span>
                      )}
                    </div>
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
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                    Showing <span className="text-[color:var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="text-[color:var(--text-main)]">{Math.min(currentPage * itemsPerPage, sortedEvents.length)}</span> of{' '}
                    <span className="text-[color:var(--text-main)]">{sortedEvents.length}</span> events
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-[10px] font-black uppercase tracking-widest border-white/5"
                    >
                      <i className="fas fa-chevron-left mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'primary' : 'glass'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="text-[10px] font-black uppercase tracking-widest min-w-[2rem]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="text-[10px] font-black uppercase tracking-widest border-white/5"
                    >
                      Next
                      <i className="fas fa-chevron-right ml-1" />
                    </Button>
                    <Select
                      id="items-per-page"
                      value={itemsPerPage.toString()}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest w-20 ml-2"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewingEvent(null);
          setReviewReason('');
        }}
        title={reviewingEvent?.action === 'reject' ? 'Reject Agent Event' : 'Review Agent Event'}
        size="md"
        footer={
          <>
            <Button 
              variant="subtle" 
              onClick={() => {
                setShowReviewModal(false);
                setReviewingEvent(null);
                setReviewReason('');
              }}
              className="text-xs font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              variant={reviewingEvent?.action === 'reject' ? 'destructive' : 'primary'}
              onClick={handleConfirmReview}
              className="text-xs font-black uppercase tracking-widest shadow-none"
            >
              {reviewingEvent?.action === 'reject' ? 'Reject Event' : 'Approve Event'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {reviewingEvent?.action === 'reject' && (
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Reason (Optional)
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                placeholder="Optional reason for rejection..."
              />
            </div>
          )}
          {reviewingEvent?.action === 'approve' && (
            <p className="text-sm text-white">
              Are you sure you want to approve this agent event?
            </p>
          )}
        </div>
      </Modal>
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
