import React from 'react';
import { Button } from './Button';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

export const GlobalRefreshButton: React.FC = () => {
  const { triggerGlobalRefresh, isRefreshing, lastRefreshedAt } = useGlobalRefresh();
  const { status } = useNetworkStatus();
  const label = lastRefreshedAt ? `Last sync ${lastRefreshedAt.toLocaleTimeString()}` : 'Global refresh';
  const statusLabel = status === 'online' ? 'ONLINE' : status === 'offline' ? 'OFFLINE' : 'RECONNECTING';
  const statusClasses = status === 'online'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'offline'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  return (
    <div className="flex items-center gap-2">
      <span className={`h-7 px-3 rounded-full border flex items-center text-[9px] font-black uppercase tracking-widest ${statusClasses}`}>
        {statusLabel}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] opacity-60">
        {label}
      </span>
      <Button
        variant="outline"
        onClick={() => triggerGlobalRefresh()}
        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-white/5"
        aria-label="Refresh all modules"
        disabled={isRefreshing}
      >
        <i className={`fas fa-rotate-right mr-2 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isRefreshing ? 'Refreshing' : 'Refresh All'}
      </Button>
    </div>
  );
};
