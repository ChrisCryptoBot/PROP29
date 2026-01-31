/**
 * Offline Banner Component
 * Displays when system is offline with queue status
 */

import React from 'react';
import { Badge } from '../../../components/UI/Badge';
import { Button } from '../../../components/UI/Button';
import { useSecurityOperationsQueue } from '../hooks/useSecurityOperationsQueue';
import { cn } from '../../../utils/cn';

export const OfflineBanner: React.FC = () => {
  const { pendingCount, failedCount, flush, retryFailed } = useSecurityOperationsQueue();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "px-4 py-3 border-b transition-all",
      isOnline 
        ? "bg-emerald-500/20 border-emerald-500/50" 
        : "bg-amber-500/20 border-amber-500/50"
    )}>
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className={cn(
            "fas text-lg",
            isOnline ? "fa-wifi text-emerald-400" : "fa-wifi-slash text-amber-400"
          )} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">
              {isOnline ? 'Online' : 'Offline'}
            </p>
            {pendingCount > 0 && (
              <p className="text-[10px] text-slate-300 mt-0.5">
                {pendingCount} operation{pendingCount > 1 ? 's' : ''} pending sync
              </p>
            )}
            {failedCount > 0 && (
              <p className="text-[10px] text-red-300 mt-0.5">
                {failedCount} operation{failedCount > 1 ? 's' : ''} failed
              </p>
            )}
          </div>
        </div>
        {isOnline && pendingCount > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => flush()}
            className="font-black uppercase tracking-widest text-[10px]"
          >
            <i className="fas fa-sync-alt mr-2" />
            Sync Now
          </Button>
        )}
        {failedCount > 0 && (
          <Button
            variant="warning"
            size="sm"
            onClick={() => {
              retryFailed();
              flush();
            }}
            className="font-black uppercase tracking-widest text-[10px]"
          >
            <i className="fas fa-redo mr-2" />
            Retry Failed
          </Button>
        )}
      </div>
    </div>
  );
};
