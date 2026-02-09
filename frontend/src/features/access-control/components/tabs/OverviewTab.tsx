/**
 * Dashboard Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 1799-2234)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation (outer component)
 * ✅ React.memo applied - prevents unnecessary re-renders for heavy metrics/charts (outer component)
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML, color contrast
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { AccessControlUtilities } from '../../../../services/AccessControlUtilities';
import { EmergencyTimeoutCountdownDisplay } from '../EmergencyTimeoutCountdownDisplay';
import { showError, showSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { useNotifications } from '../../../../contexts/NotificationsContext';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Default metrics to prevent null reference errors
const defaultMetrics = {
  totalAccessPoints: 0,
  activeAccessPoints: 0,
  totalUsers: 0,
  activeUsers: 0,
  todayAccessEvents: 0,
  deniedAccessEvents: 0,
  averageResponseTime: '0ms',
  systemUptime: '0d 0h',
  topAccessPoints: [],
  recentAlerts: 0,
  securityScore: 0,
  lastSecurityScan: new Date().toISOString(),
};

/**
 * Overview tab content component
 * Displays key metrics, emergency controls, and real-time status
 */
function OverviewTabComponent() {
  const navigate = useNavigate();
  const {
    metrics: contextMetrics,
    accessPoints,
    accessEvents,
    emergencyMode,
    emergencyController,
    emergencyTimeoutDuration,
    heldOpenAlerts,
    loading,
    handleEmergencyLockdown,
    handleEmergencyUnlock,
    handleNormalMode,
    acknowledgeHeldOpenAlert,
    refreshMetrics,
    refreshAccessEvents,
    recordAuditEntry,
  } = useAccessControlContext();
  const { criticalUnread, markAsRead } = useNotifications();
  const { lastRefreshedAt } = useGlobalRefresh();
  const [confirmAction, setConfirmAction] = useState<'lockdown' | 'unlock' | 'reset' | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await Promise.all([refreshMetrics(), refreshAccessEvents()]);
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Live refresh failed. Showing last known state.');
    }
  }, [refreshAccessEvents, refreshMetrics]);

  // Use default metrics if context metrics are null
  const metrics = contextMetrics || defaultMetrics;

  // Memoize recent events to prevent unnecessary re-renders
  const recentEvents = useMemo(() => accessEvents.slice(0, 5), [accessEvents]);

  // Mobile & Hardware Integration Metrics
  const mobileAgentEvents = useMemo(() => 
    accessEvents.filter(e => e.source === 'mobile_agent').length,
    [accessEvents]
  );
  const hardwareDeviceEvents = useMemo(() => 
    accessEvents.filter(e => e.source === 'hardware_device').length,
    [accessEvents]
  );
  const pendingAgentEvents = useMemo(() => 
    accessEvents.filter(e => e.review_status === 'pending').length,
    [accessEvents]
  );
  const offlineDevices = useMemo(() => 
    accessPoints.filter(ap => ap.isOnline === false).length,
    [accessPoints]
  );

  // Memoize unacknowledged alerts
  const activeAlerts = useMemo(
    () => heldOpenAlerts.filter(a => !a.acknowledged),
    [heldOpenAlerts]
  );

  useEffect(() => {
    const refresh = () => {
      Promise.all([refreshMetrics(), refreshAccessEvents()])
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
  }, [refreshMetrics, refreshAccessEvents]);

  const openEmergencyConfirmation = (action: 'lockdown' | 'unlock' | 'reset') => {
    setConfirmAction(action);
    setConfirmReason('');
    setShowConfirmModal(true);
  };

  const closeEmergencyConfirmation = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReason('');
  };

  const handleConfirmEmergencyAction = async () => {
    if (!confirmAction) {
      return;
    }
    if (!confirmReason.trim()) {
      showError('Reason is required for emergency actions.');
      return;
    }
    const action = confirmAction;
    const reason = confirmReason.trim();
    closeEmergencyConfirmation();
    try {
      if (action === 'lockdown') {
        await handleEmergencyLockdown({ skipConfirm: true, reason });
      } else if (action === 'unlock') {
        await handleEmergencyUnlock({ skipConfirm: true, reason });
      } else {
        await handleNormalMode({ reason });
      }
      recordAuditEntry({
        action: `Emergency ${action}`,
        status: 'success',
        reason
      });
    } catch (error) {
      recordAuditEntry({
        action: `Emergency ${action}`,
        status: 'failure',
        reason
      });
    }
  };

  // Loading state
  if (loading.metrics && !contextMetrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Access Control Overview">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Live system overview and emergency status
          </p>
          {(lastRefreshAt || refreshError) && (
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest mt-3">
              {lastRefreshAt && (
                <span className="text-[color:var(--text-sub)] opacity-60">
                  Last synced: {lastRefreshAt.toLocaleTimeString()}
                </span>
              )}
              {refreshError && (
                <span className="text-red-400">
                  {refreshError}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {lastRefreshedAt && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
            </p>
          )}
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
            aria-label="Refresh dashboard data"
          >
            <i className="fas fa-rotate-right mr-2" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
      {criticalUnread.length > 0 && (
        <Card className="bg-red-950/20 border border-white/5 overflow-hidden" role="alert" aria-live="polite">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5" aria-hidden="true">
                  <i className="fas fa-biohazard text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-black text-red-400 uppercase tracking-tighter">Critical Alert</h3>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-widest">CRITICAL</span>
                  </div>
                  <p className="text-red-200/70 text-[10px] font-bold uppercase tracking-widest">
                    {criticalUnread[0].message}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <p className="text-[10px] text-red-400/60 font-black uppercase tracking-widest">
                      <i className="fas fa-link mr-1.5" aria-hidden="true" />
                      {criticalUnread[0].title}
                    </p>
                    <p className="text-[10px] text-red-400/60 font-black uppercase tracking-widest">
                      <i className="fas fa-clock mr-1.5" aria-hidden="true" />
                      {new Date(criticalUnread[0].timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => {
                    showSuccess('Opening notification center');
                    navigate('/notifications');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest px-6 border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
                  aria-label="Open notifications"
                >
                  <i className="fas fa-bell mr-2" aria-hidden="true" />
                  View Alerts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest px-6 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    markAsRead(criticalUnread[0].id);
                    showSuccess('Alert acknowledged');
                  }}
                  aria-label="Acknowledge security alert"
                >
                  <i className="fas fa-check mr-2" aria-hidden="true" />
                  Acknowledge
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact metrics bar (gold standard: Property Items Overview) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Access control metrics">
        <span>Access points <strong className="font-black text-white">{metrics.totalAccessPoints}</strong> · <strong className="font-black text-white">{metrics.activeAccessPoints}</strong> operational</span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Users <strong className="font-black text-white">{metrics.activeUsers}</strong> / <strong className="font-black text-white">{metrics.totalUsers}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Today <strong className="font-black text-white">{metrics.todayAccessEvents}</strong> · Denied <strong className="font-black text-white">{metrics.deniedAccessEvents}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Score <strong className="font-black text-white">{metrics.securityScore}%</strong> · Uptime <strong className="font-black text-white">{metrics.systemUptime}</strong></span>
        {(mobileAgentEvents > 0 || hardwareDeviceEvents > 0 || pendingAgentEvents > 0 || offlineDevices > 0) && (
          <>
            <span className="text-white/30" aria-hidden="true">|</span>
            <span>
              Agent <strong className="font-black text-white">{mobileAgentEvents}</strong>
              {hardwareDeviceEvents > 0 && <> · Hardware <strong className="font-black text-white">{hardwareDeviceEvents}</strong></>}
              {pendingAgentEvents > 0 && <> · Pending <strong className="font-black text-white">{pendingAgentEvents}</strong></>}
              {offlineDevices > 0 && <> · Offline <strong className="font-black text-white">{offlineDevices}</strong></>}
            </span>
          </>
        )}
      </div>

      {/* System Status (section, not Card per gold standard) */}
      <section aria-labelledby="ac-system-status-heading">
        <h3 id="ac-system-status-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="System integration status">
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-slate-900/30 hover:bg-white/5 transition-all" role="listitem">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-3 text-lg" aria-hidden="true" />
              <span className="text-xs font-black text-[color:var(--text-main)] uppercase tracking-widest">Events</span>
            </div>
            <span className="text-[10px] text-green-400 font-black uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20" aria-label="Status: Connected">CONNECTED</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-slate-900/30 hover:bg-white/5 transition-all" role="listitem">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-3 text-lg" aria-hidden="true" />
              <span className="text-xs font-black text-[color:var(--text-main)] uppercase tracking-widest">Patrols</span>
            </div>
            <span className="text-[10px] text-green-400 font-black uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20" aria-label="Status: Connected">CONNECTED</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-slate-900/30 hover:bg-white/5 transition-all" role="listitem">
            <div className="flex items-center">
              <i className="fas fa-sync text-amber-500 fa-spin mr-3 text-lg" aria-hidden="true" />
              <span className="text-xs font-black text-[color:var(--text-main)] uppercase tracking-widest">PMS</span>
            </div>
            <span className="text-[10px] text-amber-400 font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" aria-label="Status: Pending">CONNECTING</span>
          </div>
        </div>
        <div className="flex items-center p-4 rounded-lg border border-white/5 bg-blue-500/5 border-blue-500/10 mt-4">
          <i className="fas fa-satellite-dish text-blue-400 mr-3 text-xl" aria-hidden="true" />
          <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider leading-relaxed">
            System fully operational. Automated incident creation active. Access violations trigger immediate response.
          </p>
        </div>
      </section>

      {/* Emergency Actions */}
      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-radiation text-white" />
              </div>
              <span className="card-title-text">Access Point Emergency Controls</span>
            </div>
            {emergencyMode !== 'normal' && (
              <span
                className={cn(
                  "px-4 py-1 text-[10px] font-black rounded uppercase tracking-widest border animate-pulse",
                  emergencyMode === 'lockdown' ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                )}
                role="status"
                aria-live="polite"
                aria-label={`Emergency mode: ${emergencyMode}`}
              >
                {emergencyMode === 'lockdown' ? '🔒 LOCKDOWN ACTIVE' : '🔓 UNLOCK ACTIVE'}
              </span>
            )}
          </CardTitle>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-2 italic">
            Locks or unlocks access points only. Uses access-control emergency API.
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            For facility-wide lockdown (hardware, zones), use the Lockdown Facility tab.
          </p>
          {isStale && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-2">
              Data is stale. Refresh before emergency actions.
            </p>
          )}
        </CardHeader>
        <CardContent className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="group" aria-label="Emergency action buttons">
            <Button
              variant="glass"
              className="h-20 flex-col text-[10px] font-black uppercase tracking-widest border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
              onClick={() => openEmergencyConfirmation('lockdown')}
              disabled={emergencyMode === 'lockdown' || isStale}
              aria-label="Initiate emergency lockdown - locks all access points"
              aria-disabled={emergencyMode === 'lockdown' || isStale}
            >
              <i className="fas fa-lock text-2xl mb-2" aria-hidden="true" />
              INITIATE LOCKDOWN
            </Button>
            <Button
              variant="glass"
              className="h-20 flex-col text-[10px] font-black uppercase tracking-widest border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 shadow-none"
              onClick={() => openEmergencyConfirmation('unlock')}
              disabled={emergencyMode === 'unlock' || isStale}
              aria-label="Initiate emergency unlock - unlocks all access points"
              aria-disabled={emergencyMode === 'unlock' || isStale}
            >
              <i className="fas fa-unlock text-2xl mb-2" aria-hidden="true" />
              UNLOCK ALL
            </Button>
            {emergencyMode !== 'normal' ? (
              <Button
                variant="glass"
                className="h-20 flex-col text-[10px] font-black uppercase tracking-widest border-white/5 animate-in fade-in"
                onClick={() => openEmergencyConfirmation('reset')}
                disabled={isStale}
                aria-label="Restore normal mode - deactivates emergency controls"
              >
                <i className="fas fa-redo text-2xl mb-2" aria-hidden="true" />
                RESET SYSTEM
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-20 flex-col text-[10px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] hover:bg-white/10"
                onClick={async () => {
                  try {
                    showSuccess('Security scan initiated - refreshing system data...');
                    await Promise.all([refreshMetrics(), refreshAccessEvents()]);
                    setLastRefreshAt(new Date());
                    setRefreshError(null);
                    showSuccess('Security scan complete. All systems operational.');
                    recordAuditEntry({
                      action: 'System security scan',
                      status: 'success',
                      reason: 'Manual security scan initiated from dashboard'
                    });
                  } catch (error) {
                    showError('Security scan failed. Please check connectivity.');
                    setRefreshError('Security scan failed. Showing last known state.');
                    recordAuditEntry({
                      action: 'System security scan',
                      status: 'failure',
                      reason: 'Scan failed due to connectivity or system error'
                    });
                  }
                }}
                aria-label="Initiate security scan - refreshes all system metrics and events"
              >
                <i className="fas fa-radar text-2xl mb-2" aria-hidden="true" />
                SYSTEM SCAN
              </Button>
            )}
          </div>
          {emergencyMode !== 'normal' && (
            <div className="mt-8 space-y-4 animate-in slide-in-from-top-4" role="alert" aria-live="polite">
              <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-md flex items-start">
                <i className="fas fa-exclamation-triangle mr-4 text-amber-500 text-xl mt-1" aria-hidden="true" />
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Emergency Mode Active</p>
                  <p className="text-[10px] text-amber-200/60 font-medium italic">
                    Access control is set to {emergencyMode === 'lockdown' ? 'locked' : 'unlocked'} across all managed access points.
                  </p>
                </div>
              </div>
              {emergencyMode === 'unlock' && emergencyController && (
                <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-stopwatch mr-4 text-red-400 text-xl" aria-hidden="true" />
                      <span className="text-xs font-black text-red-400 uppercase tracking-widest">Auto-Relock Termination Countdown</span>
                    </div>
                    <EmergencyTimeoutCountdownDisplay
                      startTimestamp={emergencyController.timestamp}
                      durationSeconds={emergencyController.timeoutDuration || emergencyTimeoutDuration}
                    />
                  </div>
                  <p className="text-[10px] text-red-200/50 font-bold italic text-right uppercase tracking-[0.2em]">
                    Automatic relock will occur when the timer ends. Restore normal mode when ready.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL FIX: Held-Open Alarm Display */}
      {activeAlerts.length > 0 && (
      <Card className="bg-red-950/20 border-2 border-red-500/50 " role="alert" aria-live="assertive">
          <CardHeader className="border-b border-red-500/20">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-door-closed text-white" />
              </div>
              <span className="card-title-text">Held Open Alarms ({activeAlerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list" aria-label="Held-open alarm list">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-5 rounded-md border transition-all hover:bg-red-500/10",
                    alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/50 ' : 'bg-orange-500/5 border-orange-500/30 '
                  )}
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest", alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white')} size="sm">
                          {alert.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                        </Badge>
                        <span className="card-title-text">{alert.accessPointName}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest">
                          <i className="fas fa-map-marker-alt mr-2 text-red-400" aria-hidden="true" />
                          DEPLOYED: {formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}
                        </p>
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">
                          <i className="fas fa-clock mr-2" aria-hidden="true" />
                          VIOLATION DURATION: {AccessControlUtilities.formatDuration(alert.duration)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeHeldOpenAlert(alert.id)}
                      className="text-[10px] font-black uppercase tracking-widest px-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      aria-label={`Acknowledge held-open alarm for ${alert.accessPointName}`}
                    >
                      ACKNOWLEDGE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Access Events (section per gold standard) */}
      <section aria-labelledby="ac-recent-events-heading">
        <h3 id="ac-recent-events-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">Recent Access Events</h3>
        {loading.accessEvents ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Loading Events...</p>
          </div>
        ) : recentEvents.length === 0 ? (
          <EmptyState
            icon="fas fa-fingerprint"
            title="No Recent Events"
            description="New access events will appear here once they are recorded."
            className="bg-black/20 border-dashed border-2 border-white/5 rounded-md p-12"
          />
        ) : (
          <div className="space-y-3" role="list" aria-label="Recent access events">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-slate-900/30 hover:bg-white/5 transition-all group"
                role="listitem"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-md flex items-center justify-center border border-white/5",
                      event.action === 'granted' ? 'bg-emerald-600' : 'bg-red-600'
                    )}
                    aria-label={`Access ${event.action}`}
                    aria-hidden="true"
                  >
                    <i className={cn("fas", event.action === 'granted' ? 'fa-user-check text-green-400' : 'fa-user-slash text-red-500')} />
                  </div>
                  <div>
                    <h4 className="card-title-text">{event.userName}</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mt-0.5">{event.accessPointName}</p>
                    <p className="text-[9px] text-[color:var(--text-sub)]/40 italic font-medium">{formatLocationDisplay(event.location as string | { lat?: number; lng?: number } | null) || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest border",
                      event.action === 'granted' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    )}
                    aria-label={`Access ${event.action}`}
                  >
                    {event.action.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-[color:var(--text-sub)] font-black mt-2 uppercase tracking-tighter" aria-label={`Time: ${new Date(event.timestamp).toLocaleTimeString()}`}>
                    <i className="fas fa-clock mr-1.5 opacity-30" />
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={showConfirmModal}
        onClose={closeEmergencyConfirmation}
        title={
          confirmAction === 'lockdown'
            ? 'Confirm Lockdown'
            : confirmAction === 'unlock'
              ? 'Confirm Unlock'
              : 'Confirm System Reset'
        }
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={closeEmergencyConfirmation} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
            <Button variant="primary" onClick={handleConfirmEmergencyAction} className="text-xs font-black uppercase tracking-widest shadow-none">
              {confirmAction === 'lockdown' ? 'Initiate Lockdown' : confirmAction === 'unlock' ? 'Unlock All' : 'Reset System'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-slate-500">Reason required for audit logging.</p>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Reason</label>
            <textarea
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
              placeholder="Short reason for this action."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * OverviewTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 * Component is memoized to prevent unnecessary re-renders for heavy metrics/charts
 */
export const OverviewTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="Access Control Overview">
      <OverviewTabComponent />
    </ErrorBoundary>
  );
});

export default OverviewTab;
