/**
 * Access Points Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 2236-2545)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 * ✅ Modular sub-components - AccessPointsFilter extracted
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { AccessPointsFilter } from '../filters/AccessPointsFilter';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import type { AccessPoint } from '../../../../shared/types/access-control.types';
import { CreateAccessPointModal, type AccessPointFormData } from '../modals';
import { cn } from '../../../../utils/cn';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Access Points Tab Component
 * Displays access points in a grid with filtering and management capabilities
 */
const AccessPointsTabComponent: React.FC = () => {
  const {
    accessPoints,
    loading,
    toggleAccessPoint,
    syncCachedEvents,
    createAccessPoint,
    updateAccessPoint,
    refreshAccessPoints,
    recordAuditEntry,
  } = useAccessControlContext();
  const { lastRefreshedAt } = useGlobalRefresh();

  // Local UI state for filtering (UI state, not business state)
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'door' | 'gate' | 'elevator' | 'turnstile' | 'barrier'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'disabled' | 'inactive'>('all');
  const [syncingAccessPointId, setSyncingAccessPointId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkResult, setBulkResult] = useState<{ successes: number; failures: string[] } | null>(null);
  const [bulkAcknowledgeOffline, setBulkAcknowledgeOffline] = useState(false);
  const [editingAccessPoint, setEditingAccessPoint] = useState<AccessPoint | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastBulkAction, setLastBulkAction] = useState<{
    status: AccessPoint['status'];
    count: number;
    reason?: string;
    timestamp: Date;
  } | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshAccessPoints();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Live refresh failed. Showing last known state.');
    }
  }, [refreshAccessPoints]);
  const [createFormData, setCreateFormData] = useState<AccessPointFormData>({
    name: '',
    location: '',
    type: 'door',
    accessMethod: 'card',
    status: 'active',
    description: ''
  });
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    const refresh = () => {
      refreshAccessPoints()
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
  }, [refreshAccessPoints]);

  // Filter access points based on search and filters
  const filteredAccessPoints = useMemo(() => {
    let filtered = (accessPoints || []).filter(ap => ap);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(point =>
        point.name.toLowerCase().includes(query) ||
        point.location.toLowerCase().includes(query) ||
        point.type.toLowerCase().includes(query) ||
        point.accessMethod.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(point => point.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(point => point.status === statusFilter);
    }

    return filtered;
  }, [accessPoints, searchQuery, typeFilter, statusFilter]);

  const offlineCount = useMemo(
    () => filteredAccessPoints.filter(point => point.isOnline === false).length,
    [filteredAccessPoints]
  );
  const unsyncedCount = useMemo(
    () => filteredAccessPoints.reduce((count, point) => count + (point.cachedEvents?.filter(e => !e.synced).length || 0), 0),
    [filteredAccessPoints]
  );

  // Handle sync with loading state
  const handleSyncCachedEvents = useCallback(async (accessPointId: string) => {
    setSyncingAccessPointId(accessPointId);
      const accessPoint = accessPoints.find(point => point.id === accessPointId);
    try {
      await syncCachedEvents(accessPointId);
      if (accessPoint) {
        showSuccess(`Synced cached events for ${accessPoint.name}.`);
          recordAuditEntry({
            action: 'Sync cached events',
            status: 'success',
            target: accessPoint.name
          });
      }
    } catch (error) {
      if (accessPoint) {
        showError(`Failed to sync cached events for ${accessPoint.name}.`);
          recordAuditEntry({
            action: 'Sync cached events',
            status: 'failure',
            target: accessPoint.name
          });
      }
    } finally {
      setSyncingAccessPointId(null);
    }
  }, [accessPoints, recordAuditEntry, syncCachedEvents]);

  // Handle toggle with error handling
  const handleToggle = useCallback(async (pointId: string) => {
    const accessPoint = accessPoints.find(point => point.id === pointId);
    try {
      await toggleAccessPoint(pointId);
      if (accessPoint) {
        recordAuditEntry({
          action: 'Toggle access point',
          status: 'success',
          target: accessPoint.name
        });
      }
    } catch (error) {
      if (accessPoint) {
        recordAuditEntry({
          action: 'Toggle access point',
          status: 'failure',
          target: accessPoint.name
        });
      }
      // Error already handled in hook
    }
  }, [accessPoints, recordAuditEntry, toggleAccessPoint]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, []);

  const openBulkModal = useCallback(() => {
    setBulkReason('');
    setBulkResult(null);
    setBulkAcknowledgeOffline(false);
    setShowBulkModal(true);
  }, []);

  const closeBulkModal = useCallback(() => {
    setShowBulkModal(false);
    setBulkReason('');
    setBulkResult(null);
    setBulkAcknowledgeOffline(false);
  }, []);

  const handleBulkStatusUpdate = useCallback(async (status: AccessPoint['status']) => {
    if (filteredAccessPoints.length === 0) {
      showError('No access points available for bulk update.');
      return;
    }
    if (status === 'disabled' && !bulkReason.trim()) {
      showError('Reason is required to disable access points.');
      return;
    }
    const toastId = showLoading(`Updating ${filteredAccessPoints.length} access point(s)...`);
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        filteredAccessPoints.map(point => updateAccessPoint(point.id, { status }))
      );
      const failures = results
        .map((result, index) => (result.status === 'rejected' ? filteredAccessPoints[index].name : null))
        .filter((name): name is string => Boolean(name));
      const successes = results.length - failures.length;
      setBulkResult({ successes, failures });
      setLastBulkAction({
        status,
        count: results.length,
        reason: bulkReason.trim() || undefined,
        timestamp: new Date()
      });
      recordAuditEntry({
        action: `Bulk access point status: ${status.toUpperCase()}`,
        status: failures.length === 0 ? 'success' : 'failure',
        target: `${results.length} access points`,
        reason: bulkReason.trim() || (failures.length > 0 ? `Failed: ${failures.join(', ')}` : undefined)
      });
      if (failures.length === 0) {
        dismissLoadingAndShowSuccess(toastId, 'Bulk update completed.');
        closeBulkModal();
      } else {
        dismissLoadingAndShowError(toastId, `Bulk update partially failed (${failures.length}/${results.length}).`);
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Bulk update failed.');
    } finally {
      setBulkLoading(false);
    }
  }, [filteredAccessPoints, updateAccessPoint, bulkReason, closeBulkModal]);

  // Loading state
  if (loading.accessPoints && accessPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Access Points...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Access Points Management">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Access Points</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Manage system access points and status
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
          {lastBulkAction && (
            <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mt-2">
              Last bulk: {lastBulkAction.status.toUpperCase()} ({lastBulkAction.count}) • {lastBulkAction.timestamp.toLocaleTimeString()}
            </p>
          )}
          {(offlineCount > 0 || unsyncedCount > 0) && (
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mt-2">
              {offlineCount > 0 ? `${offlineCount} OFFLINE` : null}
              {offlineCount > 0 && unsyncedCount > 0 ? ' • ' : null}
              {unsyncedCount > 0 ? `${unsyncedCount} UNSYNCED EVENTS` : null}
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
              aria-label="Refresh access points"
            >
              <i className="fas fa-rotate-right mr-2" aria-hidden="true" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              onClick={() => {
                setCreateFormData({
                  name: '',
                  location: '',
                  type: 'door',
                  accessMethod: 'card',
                  status: 'active',
                  description: ''
                });
                setIsFormDirty(false);
                setShowCreateModal(true);
              }}
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 shadow-none"
              aria-label="Add new access point"
            >
              <i className="fas fa-plus mr-2" aria-hidden="true" />
              Add Access Point
            </Button>
            <Button
              variant="outline"
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] shadow-none"
              onClick={openBulkModal}
              aria-label="Open bulk operations"
            >
              <i className="fas fa-layer-group mr-2" aria-hidden="true" />
              Bulk Actions
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Component */}
      <div className="bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
        <AccessPointsFilter
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          onClearAll={handleClearAllFilters}
        />
      </div>

      {/* Access Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Access points list">
        {filteredAccessPoints.length > 0 ? (
          filteredAccessPoints.map((point: AccessPoint) => (
            <Card
              key={point.id}
              className={cn(
                "bg-slate-900/50 backdrop-blur-xl border shadow-2xl transition-all duration-300 relative group overflow-hidden",
                point.isOnline === false ? 'border-red-500/50 opacity-90' : 'border-white/5'
              )}
              role="listitem"
            >

              {/* Offline Hardware Overlay */}
              {point.isOnline === false && (
                <div className="absolute inset-0 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center justify-center z-10 backdrop-blur-[2px]" role="alert" aria-live="polite">
                  <div className="text-center p-6 bg-black/60 rounded-2xl border border-red-500/20 shadow-2xl scale-95 hover:scale-100 transition-transform">
                    <i className="fas fa-broadcast-tower text-red-500 text-3xl mb-3 animate-pulse" aria-hidden="true" />
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">OFFLINE</p>
                    <p className="text-[9px] text-red-200/40 font-bold mt-1 uppercase">Connection Lost</p>
                  </div>
                </div>
              )}

              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-[color:var(--text-main)] uppercase tracking-tight group-hover:text-blue-400 transition-colors">{point.name}</CardTitle>
                    <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50 mt-0.5">ID: {point.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {point.isOnline === false && (
                      <Badge className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2" size="sm" aria-label="Offline status">
                        OFFLINE
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2",
                        point.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          point.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                      )}
                      size="sm"
                      aria-label={`Status: ${point.status}`}
                    >
                      {point.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-1.5 opacity-50">Location</p>
                    <div className="flex items-center text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-tight">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 border border-white/5 shrink-0"><i className="fas fa-map-pin text-white text-xs" aria-hidden="true" /></div>
                      <span aria-label={`Location: ${point.location}`}>{point.location}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-1.5 opacity-50">Device Info</p>
                    <div className="flex items-center text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-tight">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 border border-white/5 shrink-0"><i className="fas fa-microchip text-white text-xs" aria-hidden="true" /></div>
                      <span aria-label={`Type: ${point.type}, Method: ${point.accessMethod}`}>
                        {point.type.toUpperCase()} / {point.accessMethod.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-[color:var(--text-sub)] opacity-50">Security Level</span>
                    <span className="text-blue-400 border-b border-blue-500/20" aria-label={`Security level: ${point.securityLevel}`}>
                      LEVEL {point.securityLevel.toUpperCase()}
                    </span>
                  </div>

                  {/* Sensor Status */}
                  {point.sensorStatus && (
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 mt-2">
                      <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Sensor Status</span>
                      <div className="flex items-center gap-2">
                        <i
                          className={`fas text-[8px] ${point.sensorStatus === 'closed' ? 'fa-lock text-green-400' :
                            point.sensorStatus === 'open' ? 'fa-unlock text-blue-400' :
                              point.sensorStatus === 'forced' ? 'fa-exclamation-triangle-red text-red-500' :
                                'fa-clock text-amber-500'
                            }`}
                          aria-hidden="true"
                        />
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            point.sensorStatus === 'closed' ? 'text-green-400' :
                              point.sensorStatus === 'open' ? 'text-blue-400' :
                                point.sensorStatus === 'forced' ? 'text-red-500' :
                                  'text-amber-500'
                          )}
                          aria-label={`Sensor status: ${point.sensorStatus}`}
                        >
                          {point.sensorStatus.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Power Source & Battery */}
                  {point.powerSource && (
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Power Status</span>
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">
                          <i
                            className={cn("fas mr-2", point.powerSource === 'mains' ? 'fa-plug-circle-bolt text-green-400' : 'fa-battery-three-quarters text-amber-500')}
                            aria-hidden="true"
                          />
                          {point.powerSource === 'mains' ? 'MAINS' : 'BATTERY'}
                        </div>
                      </div>
                      {point.powerSource === 'battery' && point.batteryLevel !== undefined && (
                        <div className="flex items-center gap-3" aria-label={`Battery level: ${point.batteryLevel}%`}>
                          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5" role="progressbar" aria-valuenow={point.batteryLevel} aria-valuemin={0} aria-valuemax={100}>
                            <div
                              className={cn(
                                "h-full transition-all duration-1000 bg-gradient-to-r",
                                point.batteryLevel > 50 ? 'from-green-600 to-emerald-400' :
                                  point.batteryLevel > 20 ? 'from-amber-600 to-yellow-400' :
                                    'from-red-600 to-red-400'
                              )}
                              style={{ width: `${point.batteryLevel}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase",
                              point.batteryLevel > 50 ? 'text-green-400' :
                                point.batteryLevel > 20 ? 'text-amber-400' :
                                  'text-red-400'
                            )}
                          >
                            {point.batteryLevel}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Total Events</span>
                  <span className="text-sm font-black text-white" aria-label={`Total access count: ${point.accessCount}`}>
                    {point.accessCount} <span className="text-[8px] opacity-50">EVENTS</span>
                  </span>
                </div>

                {/* Hardware Late-Sync Button */}
                {point.isOnline && point.cachedEvents && point.cachedEvents.filter(e => !e.synced).length > 0 && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in fade-in" role="alert">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-triangle-exclamation text-amber-500 text-lg" aria-hidden="true" />
                        <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">
                          {point.cachedEvents.filter(e => !e.synced).length} UNSYNCED EVENTS
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncCachedEvents(point.id)}
                        disabled={syncingAccessPointId === point.id || isStale}
                        className="w-full text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        aria-label={`Sync ${point.cachedEvents.filter(e => !e.synced).length} cached events from ${point.name}`}
                      >
                        {syncingAccessPointId === point.id ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />
                            SYNCING...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-cloud-arrow-up mr-2" aria-hidden="true" />
                            SYNC EVENTS
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-[10px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-blue-400 hover:bg-white/5 transition-all"
                    onClick={() => {
                      setEditingAccessPoint(point);
                      setCreateFormData({
                        name: point.name,
                        location: point.location,
                        type: point.type as 'door' | 'gate' | 'elevator' | 'turnstile',
                        accessMethod: point.accessMethod as 'card' | 'biometric' | 'pin' | 'mobile',
                        status: point.status as 'active' | 'maintenance' | 'disabled' | 'inactive',
                        description: ''
                      });
                      setIsFormDirty(false);
                      setShowCreateModal(true);
                    }}
                    aria-label={`Edit ${point.name}`}
                  >
                    <i className="fas fa-sliders mr-2" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "flex-1 text-[10px] font-black uppercase tracking-widest transition-all",
                      point.status === 'active' ? "text-red-400 border-red-500/20 hover:bg-red-500/10" : "text-green-400 border-green-500/20 hover:bg-green-500/10"
                    )}
                    onClick={() => handleToggle(point.id)}
                    disabled={point.isOnline === false || isStale}
                    title={point.isOnline === false ? 'Access point is offline' : isStale ? 'Data is stale, refresh required' : `Toggle ${point.name}`}
                    aria-label={`${point.status === 'active' ? 'Disable' : 'Enable'} ${point.name}`}
                    aria-disabled={point.isOnline === false || isStale}
                  >
                    <i className="fas mr-2 fa-power-off" aria-hidden="true" />
                    {point.status === 'active' ? 'DISABLE' : 'ENABLE'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon="fas fa-tower-observation"
              title={searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? "No Access Points Found"
                : "No Access Points"}
              description={searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? "No access points match your current filtering criteria."
                : "Add your first access point to begin."}
              className="bg-slate-900/50 border-dashed border-2 border-white/5 rounded-3xl p-12"
              action={
                !searchQuery && typeFilter === 'all' && statusFilter === 'all' ? {
                  label: 'ADD ACCESS POINT',
                  onClick: () => {
                    setEditingAccessPoint(null);
                    setCreateFormData({
                      name: '',
                      location: '',
                      type: 'door',
                      accessMethod: 'card',
                      status: 'active',
                      description: ''
                    });
                    setIsFormDirty(false);
                    setShowCreateModal(true);
                  },
                  variant: 'outline' as const
                } : undefined
              }
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showBulkModal}
        onClose={closeBulkModal}
        title="Bulk Actions"
        size="lg"
        footer={
          <Button variant="subtle" onClick={closeBulkModal} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-500">
            Applies to filtered access points ({filteredAccessPoints.length})
          </p>
          {isStale && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">
              Data is stale. Refresh before running bulk updates.
            </p>
          )}
          {offlineCount > 0 && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{offlineCount} access point(s) offline. Acknowledge before bulk actions.</p>
              <label className="mt-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                <input type="checkbox" checked={bulkAcknowledgeOffline} onChange={(e) => setBulkAcknowledgeOffline(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-white/5 focus:ring-2 focus:ring-blue-500/20" />
                Acknowledge hardware risk
              </label>
            </div>
          )}
          {bulkResult && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">
                Bulk Results: {bulkResult.successes} succeeded, {bulkResult.failures.length} failed
              </p>
              {bulkResult.failures.length > 0 && (
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-2">
                  Failed: {bulkResult.failures.join(', ')}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="glass"
              onClick={() => handleBulkStatusUpdate('active')}
              disabled={bulkLoading || isStale || (offlineCount > 0 && !bulkAcknowledgeOffline)}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-white/5"
            >
              Activate All
            </Button>
            <Button
              variant="glass"
              onClick={() => handleBulkStatusUpdate('disabled')}
              disabled={bulkLoading || isStale || (offlineCount > 0 && !bulkAcknowledgeOffline)}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
            >
              Disable All
            </Button>
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Reason (required to disable)</label>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
              placeholder="Short reason for this bulk action."
            />
          </div>
        </div>
      </Modal>

      <CreateAccessPointModal
        isOpen={showCreateModal}
        isEditMode={!!editingAccessPoint}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAccessPoint(null);
        }}
        onSubmit={async () => {
          try {
            if (editingAccessPoint) {
              await updateAccessPoint(editingAccessPoint.id, {
                name: createFormData.name,
                location: createFormData.location,
                type: createFormData.type,
                accessMethod: createFormData.accessMethod,
                status: createFormData.status,
              });
              showSuccess(`Access Point "${createFormData.name}" updated.`);
              recordAuditEntry({
                action: 'Update access point',
                status: 'success',
                target: createFormData.name
              });
            } else {
              await createAccessPoint({
                name: createFormData.name,
                location: createFormData.location,
                type: createFormData.type,
                accessMethod: createFormData.accessMethod,
                status: createFormData.status,
                accessCount: 0,
                permissions: [],
                securityLevel: 'medium',
              });
              showSuccess(`Access Point "${createFormData.name}" added.`);
              recordAuditEntry({
                action: 'Create access point',
                status: 'success',
                target: createFormData.name
              });
            }
            setShowCreateModal(false);
            setEditingAccessPoint(null);
            setIsFormDirty(false);
          } catch (error) {
            showError(`Action failed.`);
            recordAuditEntry({
              action: editingAccessPoint ? 'Update access point' : 'Create access point',
              status: 'failure',
              target: createFormData.name
            });
          }
        }}
        formData={createFormData}
        onFormChange={(data) => setCreateFormData(prev => ({ ...prev, ...data }))}
        isFormDirty={isFormDirty}
        setIsFormDirty={setIsFormDirty}
      />
    </div>
  );
};

/**
 * AccessPointsTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 */
export const AccessPointsTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="Access Points Tab">
      <AccessPointsTabComponent />
    </ErrorBoundary>
  );
});

AccessPointsTab.displayName = 'AccessPointsTab';
export default AccessPointsTab;
