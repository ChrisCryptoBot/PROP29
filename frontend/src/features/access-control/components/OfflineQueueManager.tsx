/**
 * Offline Queue Manager Component
 * Displays status of offline operation queue and provides retry functionality
 * Following patrol-command-center pattern
 */

/**
 * Offline Queue Manager Component
 * Displays status of offline operation queue and provides retry functionality
 * Following patrol-command-center pattern
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Badge } from '../../../components/UI/Badge';
import { EmptyState } from '../../../components/UI/EmptyState';
import { useAccessControlContext } from '../context/AccessControlContext';
import { showSuccess, showError } from '../../../utils/toast';

export const OfflineQueueManager: React.FC = () => {
  const { queuePendingCount, queueFailedCount, retryQueue, isOffline } = useAccessControlContext();

  const handleRetryFailed = () => {
    try {
      retryQueue();
      showSuccess('Retrying failed operations...');
    } catch (error) {
      showError('Failed to retry operations');
    }
  };

  if (!isOffline && queuePendingCount === 0 && queueFailedCount === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 mb-4">
      <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5">
              <i className={`fas ${isOffline ? 'fa-wifi-slash' : 'fa-sync-alt'} text-white`} aria-hidden="true" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">
              {isOffline ? 'OFFLINE QUEUE' : 'QUEUE STATUS'}
            </span>
          </span>
          <div className="flex items-center gap-2">
            {queuePendingCount > 0 && (
              <Badge variant="warning" className="glass-card border-none">
                {queuePendingCount} pending
              </Badge>
            )}
            {queueFailedCount > 0 && (
              <Badge variant="destructive" className="glass-card border-none">
                {queueFailedCount} failed
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <div className="space-y-4">
          {queuePendingCount > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-400">
                    {queuePendingCount} operation{queuePendingCount !== 1 ? 's' : ''} pending sync
                  </p>
                  <p className="text-[10px] text-amber-300/70 mt-1">
                    These will sync automatically when connection is restored
                  </p>
                </div>
                <i className="fas fa-clock text-amber-400/50 text-2xl" />
              </div>
            </div>
          )}
          {queueFailedCount > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-red-400">
                    {queueFailedCount} operation{queueFailedCount !== 1 ? 's' : ''} failed to sync
                  </p>
                  <p className="text-[10px] text-red-300/70 mt-1">
                    These operations exceeded retry attempts and need manual intervention
                  </p>
                </div>
                <i className="fas fa-exclamation-triangle text-red-400/50 text-2xl" />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRetryFailed}
                className="w-full"
              >
                <i className="fas fa-redo mr-2" />
                Retry Failed Operations
              </Button>
            </div>
          )}
          {queuePendingCount === 0 && queueFailedCount === 0 && isOffline && (
            <EmptyState
              icon="fas fa-wifi-slash"
              title="Offline"
              description="Connection lost. Operations will queue automatically."
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
