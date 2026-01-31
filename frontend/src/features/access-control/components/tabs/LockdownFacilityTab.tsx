/**
 * Access Control - Lockdown Facility Tab
 * Integrated Lockdown Facility controls inside Access Control
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Modal } from '../../../../components/UI/Modal';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError } from '../../../../utils/toast';
import { logger } from '../../../../services/logger';
import { ModuleService } from '../../../../services/ModuleService';
import { useAuth } from '../../../../hooks/useAuth';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';

interface LockdownEvent {
  id: string;
  type: 'initiated' | 'cancelled' | 'test' | 'error';
  timestamp: string;
  initiatedBy: string;
  reason?: string;
  affectedHardware: string[];
  status: 'active' | 'completed' | 'failed';
}

interface HardwareDevice {
  id: string;
  name: string;
  type: 'door' | 'sensor' | 'alarm' | 'camera';
  location: string;
  status: 'locked' | 'unlocked' | 'error' | 'offline';
  lastActivity: string;
}

interface LockdownStatus {
  isActive: boolean;
  initiatedAt?: string;
  initiatedBy?: string;
  reason?: string;
  affectedZones: string[];
}

export const LockdownFacilityTab: React.FC = () => {
  const { user } = useAuth();
  const moduleService = ModuleService.getInstance();
  const { recordAuditEntry } = useAccessControlContext();

  const [confirmAction, setConfirmAction] = useState<'initiate' | 'cancel' | 'test' | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;
  const [acknowledgeHardwareRisk, setAcknowledgeHardwareRisk] = useState(false);

  const [lockdownStatus, setLockdownStatus] = useState<LockdownStatus>({
    isActive: false,
    affectedZones: [],
  });
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [lockdownHistory, setLockdownHistory] = useState<LockdownEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const sortedHistory = useMemo(() => {
    return [...lockdownHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [lockdownHistory]);

  const latestEvent = sortedHistory[0];
  const isDeviceStale = useCallback((lastActivity: string) => {
    const timestamp = Date.parse(lastActivity);
    if (Number.isNaN(timestamp)) {
      return false;
    }
    return Date.now() - timestamp > 15 * 60 * 1000;
  }, []);

  const offlineHardwareCount = useMemo(() => {
    return hardwareDevices.filter(device => device.status === 'offline' || device.status === 'error' || isDeviceStale(device.lastActivity)).length;
  }, [hardwareDevices, isDeviceStale]);

  useEffect(() => {
    setAcknowledgeHardwareRisk(false);
  }, [offlineHardwareCount]);

  const loadLockdownStatus = async (): Promise<boolean> => {
    try {
      const status = await moduleService.getLockdownStatus();
      setLockdownStatus(status);
      return true;
    } catch (error) {
      logger.error('Failed to load lockdown status', error instanceof Error ? error : new Error(String(error)), { module: 'LockdownFacilityTab', action: 'loadLockdownStatus' });
      setLockdownStatus({ isActive: false, affectedZones: [] });
      return false;
    }
  };

  const loadHardwareDevices = async (): Promise<boolean> => {
    try {
      const hardware = await moduleService.getLockdownHardware();
      setHardwareDevices(hardware.map(h => ({
        id: h.id,
        name: h.name,
        type: h.type as 'door' | 'sensor' | 'alarm' | 'camera',
        location: h.location,
        status: h.status as 'locked' | 'unlocked' | 'error' | 'offline',
        lastActivity: h.lastActivity,
      })));
      return true;
    } catch (error) {
      logger.error('Failed to load hardware devices', error instanceof Error ? error : new Error(String(error)), { module: 'LockdownFacilityTab', action: 'loadHardwareDevices' });
      setHardwareDevices([]);
      return false;
    }
  };

  const loadLockdownHistory = async (): Promise<boolean> => {
    try {
      const history = await moduleService.getLockdownHistory();
      setLockdownHistory(history.map(h => ({
        id: h.id,
        type: h.type as 'initiated' | 'cancelled' | 'test' | 'error',
        timestamp: h.timestamp,
        initiatedBy: h.initiatedBy,
        reason: h.reason,
        affectedHardware: h.affectedHardware,
        status: h.status as 'active' | 'completed' | 'failed',
      })));
      return true;
    } catch (error) {
      logger.error('Failed to load lockdown history', error instanceof Error ? error : new Error(String(error)), { module: 'LockdownFacilityTab', action: 'loadLockdownHistory' });
      setLockdownHistory([]);
      return false;
    }
  };

  const refreshAll = useCallback(async () => {
    const results = await Promise.all([loadLockdownStatus(), loadHardwareDevices(), loadLockdownHistory()]);
    const hasError = results.some(result => !result);
    if (hasError) {
      setRefreshError('Live refresh failed. Showing last known state.');
    } else {
      setRefreshError(null);
      setLastRefreshAt(new Date());
    }
  }, [loadHardwareDevices, loadLockdownHistory, loadLockdownStatus]);

  useEffect(() => {
    refreshAll();
    const intervalId = window.setInterval(refreshAll, 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshAll]);

  const executeInitiateLockdown = async (reason: string) => {
    setLoading(true);
    const toastId = showLoading('Initiating lockdown...');
    try {
      const currentUser = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Unknown User';
      const result = await moduleService.initiateLockdown({
        reason,
        affectedZones: ['All Zones'],
      });
      setLockdownStatus({
        isActive: true,
        initiatedAt: result.initiatedAt,
        initiatedBy: currentUser,
        reason: result.reason,
        affectedZones: result.affectedZones,
      });
      dismissLoadingAndShowSuccess(toastId, 'Lockdown initiated');
      recordAuditEntry({
        action: 'Facility lockdown initiated',
        status: 'success',
        reason
      });
      loadHardwareDevices();
      loadLockdownHistory();
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to initiate lockdown');
      recordAuditEntry({
        action: 'Facility lockdown initiated',
        status: 'failure',
        reason
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCancelLockdown = async () => {
    setLoading(true);
    const toastId = showLoading('Cancelling lockdown...');
    try {
      await moduleService.cancelLockdown();
      setLockdownStatus({ isActive: false, affectedZones: [] });
      dismissLoadingAndShowSuccess(toastId, 'Lockdown cancelled');
      recordAuditEntry({
        action: 'Facility lockdown cancelled',
        status: 'success',
        reason: 'Operator cancellation'
      });
      loadHardwareDevices();
      loadLockdownHistory();
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to cancel lockdown');
      recordAuditEntry({
        action: 'Facility lockdown cancelled',
        status: 'failure',
        reason: 'Operator cancellation'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeTestLockdown = async (reason: string) => {
    setLoading(true);
    const toastId = showLoading('Running test lockdown...');
    try {
      await moduleService.initiateLockdown({ reason, affectedZones: ['Test Zone'] });
      dismissLoadingAndShowSuccess(toastId, 'Test lockdown completed');
      recordAuditEntry({
        action: 'Facility lockdown test',
        status: 'success',
        reason
      });
      loadLockdownHistory();
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to run test lockdown');
      recordAuditEntry({
        action: 'Facility lockdown test',
        status: 'failure',
        reason
      });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmation = (action: 'initiate' | 'cancel' | 'test') => {
    setConfirmAction(action);
    setConfirmReason('');
    setShowConfirmModal(true);
  };

  const closeConfirmation = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReason('');
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }
    if (confirmAction !== 'cancel' && !confirmReason.trim()) {
      showError('Reason is required for this action.');
      return;
    }
    const reason = confirmReason.trim() || 'Operator requested cancellation';
    closeConfirmation();
    if (confirmAction === 'initiate') {
      await executeInitiateLockdown(reason);
    } else if (confirmAction === 'cancel') {
      await executeCancelLockdown();
    } else {
      await executeTestLockdown(reason);
    }
  };

  return (
    <div className="space-y-6" role="main" aria-label="Lockdown Facility">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Lockdown Facility</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Emergency lockdown controls and device status. Uses facility lockdown API (/lockdown).
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Dashboard emergency controls use the access-control API.
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
            onClick={refreshAll}
            className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
            aria-label="Refresh lockdown data"
          >
            <i className="fas fa-rotate-right mr-2" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
      {latestEvent && (
        <div className="p-4 bg-slate-900/30 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
            Last Action: {latestEvent.type.toUpperCase()} • {latestEvent.status.toUpperCase()}
          </p>
          <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
            {latestEvent.initiatedBy} • {new Date(latestEvent.timestamp).toLocaleString()}
          </p>
          {latestEvent.reason && (
            <p className="text-[9px] text-[color:var(--text-sub)] uppercase tracking-widest mt-2">
              Reason: {latestEvent.reason}
            </p>
          )}
        </div>
      )}
      <Card className="glass-card border border-white/5 bg-transparent ">
        <CardContent className="pt-6">
          {isStale && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-4">
              Data is stale. Refresh before lockdown actions.
            </p>
          )}
          {offlineHardwareCount > 0 && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-4">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                {offlineHardwareCount} device(s) offline or stale. Acknowledge risk to proceed.
              </p>
              <label className="mt-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">
                <input
                  type="checkbox"
                  checked={acknowledgeHardwareRisk}
                  onChange={(event) => setAcknowledgeHardwareRisk(event.target.checked)}
                  className="h-4 w-4 border-white/5 rounded bg-[color:var(--console-dark)]"
                />
                Acknowledge hardware risk
              </label>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 mb-6">
            <div>
              <p className="text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-1">Status</p>
              <p className={`text-xl font-black uppercase tracking-tight ${lockdownStatus.isActive ? 'text-red-400' : 'text-green-400'}`}>
                {lockdownStatus.isActive ? 'Lockdown Active' : 'Normal Operations'}
              </p>
            </div>
            <Badge className={`${lockdownStatus.isActive ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'} px-4 py-1.5 text-xs font-bold`}>
              {lockdownStatus.isActive ? 'ACTIVE' : 'NORMAL'}
            </Badge>
          </div>
          {lockdownStatus.isActive && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-200 mb-6">
              <div className="flex gap-2 mb-2">
                <i className="fas fa-user-shield mt-0.5 opacity-70"></i>
                <p><span className="font-bold opacity-70 uppercase text-xs">Initiated by:</span> {lockdownStatus.initiatedBy || 'Unknown'}</p>
              </div>
              <div className="flex gap-2">
                <i className="fas fa-info-circle mt-0.5 opacity-70"></i>
                <p><span className="font-bold opacity-70 uppercase text-xs">Reason:</span> {lockdownStatus.reason || 'N/A'}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="glass"
              className="text-[10px] font-black uppercase tracking-widest border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
              onClick={() => openConfirmation('initiate')}
              disabled={loading || lockdownStatus.isActive || isStale || (offlineHardwareCount > 0 && !acknowledgeHardwareRisk)}
            >
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Initiate Lockdown
            </Button>
            <Button
              variant="outline"
              className="border-white/5 hover:bg-white/10 text-[color:var(--text-main)] font-black uppercase tracking-widest shadow-none"
              onClick={() => openConfirmation('cancel')}
              disabled={loading || !lockdownStatus.isActive || isStale || (offlineHardwareCount > 0 && !acknowledgeHardwareRisk)}
            >
              <i className="fas fa-unlock mr-2"></i>
              Cancel Lockdown
            </Button>
            <Button
              variant="outline"
              className="border-white/5 hover:bg-white/10 text-[color:var(--text-sub)] hover:text-white font-black uppercase tracking-widest shadow-none"
              onClick={() => openConfirmation('test')}
              disabled={loading || isStale || (offlineHardwareCount > 0 && !acknowledgeHardwareRisk)}
            >
              <i className="fas fa-vial mr-2"></i>
              Run Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border border-white/5 bg-transparent ">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3  border border-white/5" aria-hidden="true">
              <i className="fas fa-microchip text-white" />
            </div>
            <span className="font-bold tracking-tight uppercase text-[color:var(--text-main)]">Hardware Devices</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hardwareDevices.map(device => (
              <div key={device.id} className="p-4 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-xs">{device.name}</h4>
                  <Badge className={`${device.status === 'locked' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : device.status === 'unlocked' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-[color:var(--text-sub)] border border-white/5'} text-[10px]`}>
                    {device.status.toUpperCase()}
                  </Badge>
                </div>
                {isDeviceStale(device.lastActivity) && (
                  <span className="inline-flex text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20 text-red-400 bg-red-500/10 mb-2">
                    STALE DEVICE
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs text-[color:var(--text-sub)] mb-1">
                  <i className="fas fa-map-marker-alt opacity-50"></i>
                  {formatLocationDisplay(device.location as string | { lat?: number; lng?: number } | null) || '—'}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[color:var(--text-sub)] opacity-70">
                  <i className="fas fa-clock opacity-50"></i>
                  Last activity: {device.lastActivity}
                </div>
              </div>
            ))}
            {hardwareDevices.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-server"
                  title="No Hardware Devices"
                  description="No security hardware connected to the lockdown grid."
                  className="bg-black/20 border-dashed border-2 border-white/5"
                  action={{
                    label: 'REFRESH DEVICES',
                    onClick: loadHardwareDevices,
                    variant: 'outline'
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border border-white/5 bg-transparent ">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3  border border-white/5" aria-hidden="true">
              <i className="fas fa-history text-white" />
            </div>
            <span className="font-bold tracking-tight uppercase text-[color:var(--text-main)]">Lockdown History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {sortedHistory.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-bold text-[color:var(--text-main)] uppercase tracking-wide">{event.type.toUpperCase()}</p>
                  <p className="text-xs text-[color:var(--text-sub)] mt-0.5">
                    <span className="font-mono text-blue-300">{event.timestamp}</span> • <span className="opacity-70">{event.initiatedBy}</span>
                  </p>
                </div>
                <Badge className={`${event.status === 'active' ? 'bg-orange-500/20 text-orange-300' : event.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border-none uppercase text-[10px] font-bold`}>
                  {event.status}
                </Badge>
              </div>
            ))}
            {sortedHistory.length === 0 && (
              <EmptyState
                icon="fas fa-history"
                title="No History"
                description="System lockdown logs are empty."
                className="bg-black/20 border-dashed border-2 border-white/5"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showConfirmModal}
        onClose={closeConfirmation}
        title={
          confirmAction === 'initiate'
            ? 'Confirm Lockdown'
            : confirmAction === 'cancel'
              ? 'Confirm Cancellation'
              : 'Confirm Test Lockdown'
        }
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={closeConfirmation} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
            <Button variant="primary" onClick={handleConfirmAction} className="text-xs font-black uppercase tracking-widest shadow-none">
              {confirmAction === 'initiate' ? 'Initiate Lockdown' : confirmAction === 'cancel' ? 'Cancel Lockdown' : 'Run Test'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-500">
            {confirmAction === 'cancel' ? 'Confirm cancellation of the active lockdown.' : 'Reason required for audit logging.'}
          </p>
          {confirmAction !== 'cancel' && (
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
          )}
        </div>
      </Modal>
    </div>
  );
};


