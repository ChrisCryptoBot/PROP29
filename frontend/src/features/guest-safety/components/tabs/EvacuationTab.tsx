/**
 * Evacuation Tab
 * Simplified evacuation headcount tracking for emergency situations
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import type { EvacuationHeadcount, EvacuationCheckIn } from '../../types/guest-safety.types';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const EvacuationTab: React.FC = () => {
  const { 
    incidents, 
    sendMassNotification, 
    canSendNotification,
    loading,
    refreshEvacuationHeadcount,
    refreshEvacuationCheckIns,
    evacuationHeadcount,
    evacuationCheckIns,
  } = useGuestSafetyContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [isEvacuationActive, setIsEvacuationActive] = useState(false);

  // Find active evacuation incident and refresh data
  useEffect(() => {
    const evacuationIncident = Array.isArray(incidents) 
      ? incidents.find(inc => inc.type === 'evacuation' && inc.status !== 'resolved')
      : null;
    
    setIsEvacuationActive(!!evacuationIncident);
    
    if (evacuationIncident) {
      refreshEvacuationHeadcount();
      refreshEvacuationCheckIns();
    }
  }, [incidents, refreshEvacuationHeadcount, refreshEvacuationCheckIns]);

  useEffect(() => {
    setLastRefreshAt(new Date());
  }, [evacuationHeadcount]);

  // Auto-refresh during active evacuation
  useEffect(() => {
    if (!isEvacuationActive) return;
    
    const intervalId = setInterval(() => {
      refreshEvacuationHeadcount();
      refreshEvacuationCheckIns();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isEvacuationActive, refreshEvacuationHeadcount, refreshEvacuationCheckIns]);

  const headcount: EvacuationHeadcount = evacuationHeadcount || {
    totalGuests: 0,
    safe: 0,
    unaccounted: 0,
    inProgress: 0,
    lastUpdated: new Date().toISOString(),
  };
  const checkIns: EvacuationCheckIn[] = evacuationCheckIns || [];

  const handleStartEvacuation = useCallback(async () => {
    if (!canSendNotification) return;
    
    const toastId = showLoading('Starting evacuation protocol...');
    try {
      // Send evacuation mass notification
      await sendMassNotification({
        message: 'EMERGENCY EVACUATION: Please proceed to the nearest exit immediately. Do not use elevators. Once safe, please check in using the guest app.',
        recipients: 'all',
        priority: 'urgent',
        channels: ['in_app', 'sms'],
      });
      
      dismissLoadingAndShowSuccess(toastId, 'Evacuation protocol initiated. Mass notification sent to all guests.');
      setIsEvacuationActive(true);
      // Refresh data after starting evacuation
      setTimeout(() => {
        refreshEvacuationHeadcount();
        refreshEvacuationCheckIns();
      }, 1000);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to start evacuation protocol');
    }
  }, [canSendNotification, sendMassNotification, refreshEvacuationHeadcount, refreshEvacuationCheckIns]);

  const handleEndEvacuation = useCallback(async () => {
    if (!canSendNotification) return;
    
    const toastId = showLoading('Ending evacuation protocol...');
    try {
      await sendMassNotification({
        message: 'EVACUATION COMPLETE: All clear. You may return to your rooms. Thank you for your cooperation.',
        recipients: 'all',
        priority: 'normal',
        channels: ['in_app', 'sms'],
      });
      
      dismissLoadingAndShowSuccess(toastId, 'Evacuation protocol ended. All clear notification sent.');
      setIsEvacuationActive(false);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to end evacuation protocol');
    }
  }, [canSendNotification, sendMassNotification]);

  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Evacuation</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Emergency headcount tracking and guest safety verification
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
          </div>
        </div>
      </div>

      {/* Evacuation Control */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
              <i className="fas fa-exclamation-triangle text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Evacuation Protocol</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {!isEvacuationActive ? (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm mb-6">No active evacuation. Start evacuation protocol to begin headcount tracking.</p>
              <Button
                onClick={handleStartEvacuation}
                disabled={!canSendNotification || (typeof loading === 'object' ? loading.actions : false)}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8"
              >
                <i className="fas fa-exclamation-triangle mr-3" />
                START EVACUATION PROTOCOL
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm mb-1">Evacuation Active</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Mass notifications sent to all guests</p>
                </div>
                <Button
                  onClick={handleEndEvacuation}
                  disabled={!canSendNotification || (typeof loading === 'object' ? loading.actions : false)}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 font-black uppercase tracking-widest text-[10px] h-10 px-6"
                >
                  <i className="fas fa-check-circle mr-2" />
                  END EVACUATION
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headcount Metrics */}
      {isEvacuationActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Guests */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded uppercase">TOTAL</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  <i className="fas fa-users text-white text-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Guests</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">{headcount.totalGuests}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">On property</p>
              </div>
            </CardContent>
          </Card>

          {/* Safe */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 rounded uppercase">SAFE</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  <i className="fas fa-check-circle text-white text-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Safe</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">{headcount.safe}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Checked in safe</p>
              </div>
            </CardContent>
          </Card>

          {/* Unaccounted */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">PRIORITY</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  <i className="fas fa-exclamation-triangle text-white text-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Unaccounted</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">{headcount.unaccounted}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">No check-in received</p>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
            <CardContent className="pt-6 px-6 pb-6 relative">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded uppercase">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  <i className="fas fa-sync-alt text-white text-lg animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">In Progress</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">{headcount.inProgress}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Evacuating now</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Check-In List */}
      {isEvacuationActive && (
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                <i className="fas fa-clipboard-check text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">Guest Check-Ins</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-6">
            {checkIns.length === 0 ? (
              <EmptyState
                icon="fas fa-clipboard-check"
                title="No check-ins yet"
                description="Guest check-ins from the mobile app will appear here"
              />
            ) : (
              <div className="space-y-2">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border transition-all',
                      checkIn.status === 'safe' 
                        ? 'bg-green-500/10 border-green-500/20'
                        : checkIn.status === 'in_progress'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center border',
                        checkIn.status === 'safe' 
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : checkIn.status === 'in_progress'
                          ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                          : 'bg-red-500/20 border-red-500/30 text-red-400'
                      )}>
                        {checkIn.status === 'safe' && <i className="fas fa-check-circle" />}
                        {checkIn.status === 'in_progress' && <i className="fas fa-sync-alt animate-spin-slow" />}
                        {checkIn.status === 'unaccounted' && <i className="fas fa-exclamation-triangle" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{checkIn.guestName}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Room {checkIn.roomNumber}</p>
                        {checkIn.location && (
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Location: {checkIn.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] italic">
                        {new Date(checkIn.checkedInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={cn(
                        'inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border mt-1',
                        checkIn.status === 'safe'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : checkIn.status === 'in_progress'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      )}>
                        {checkIn.status === 'safe' ? 'SAFE' : checkIn.status === 'in_progress' ? 'IN PROGRESS' : 'UNACCOUNTED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { EvacuationTab };
export default EvacuationTab;
