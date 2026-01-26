/**
 * Guest Safety - Response Teams Tab
 * Displays available response teams
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { getTeamStatusBadgeClass } from '../../utils/badgeHelpers';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const ResponseTeamsTab: React.FC = () => {
  const { teams, loading, refreshTeams } = useGuestSafetyContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 60000; // 60 seconds for teams

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshTeams();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Refresh failed. Showing last known state.');
    }
  }, [refreshTeams]);

  useEffect(() => {
    const refresh = () => {
      refreshTeams()
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
  }, [refreshTeams]);

  if (loading.teams && teams.length === 0) {
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
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Response Teams</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Available response teams and their status
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
              aria-label="Refresh teams"
              disabled={loading.teams}
            >
              <i className={cn("fas fa-rotate-right mr-2", loading.teams && "animate-spin")} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-2xl" aria-hidden="true">
              <i className="fas fa-users text-white text-lg" />
            </div>
            Response Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-slate-900/70 transition-all group rounded-2xl overflow-hidden text-center"
              >
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform">
                    <span className="text-white font-black text-2xl tracking-tighter">{team.avatar}</span>
                  </div>
                  <h4 className="font-black text-white uppercase tracking-tighter text-xl mb-1 group-hover:text-blue-400 transition-colors">{team.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mb-6">{team.role}</p>
                  <div className="flex justify-center">
                    <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border", getTeamStatusBadgeClass(team.status))}>
                      {team.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-users-slash"
                  title="No response teams found"
                  description="No active response teams available"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

