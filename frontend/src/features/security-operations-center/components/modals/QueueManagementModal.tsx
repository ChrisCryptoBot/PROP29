/**
 * Queue Management Modal
 * Lists pending and failed operations with retry/remove actions
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSecurityOperationsQueue, QueuedOperation } from '../../hooks/useSecurityOperationsQueue';
import { showSuccess, showError } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export interface QueueManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueManagementModal: React.FC<QueueManagementModalProps> = ({ isOpen, onClose }) => {
  const { queue, flush, retryFailed, removeQueuedOperation } = useSecurityOperationsQueue();

  const pending = queue.filter(op => op.sync_status === 'pending');
  const failed = queue.filter(op => op.sync_status === 'failed');

  const handleRetry = async () => {
    retryFailed();
    await flush();
    showSuccess('Retrying failed operations...');
  };

  const handleRemove = (id: string) => {
    removeQueuedOperation(id);
    showSuccess('Operation removed from queue');
  };

  const handleFlush = async () => {
    await flush();
    showSuccess('Queue sync initiated');
  };

  const formatOperationType = (type: QueuedOperation['type']): string => {
    switch (type) {
      case 'CAMERA_UPDATE':
        return 'Camera Update';
      case 'CAMERA_TOGGLE_RECORDING':
        return 'Toggle Recording';
      case 'CAMERA_TOGGLE_MOTION':
        return 'Toggle Motion Detection';
      case 'EVIDENCE_STATUS_UPDATE':
        return 'Evidence Status Update';
      case 'SETTINGS_UPDATE':
        return 'Settings Update';
      default:
        return type;
    }
  };

  const formatQueuedAt = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Offline Queue Management"
      size="lg"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-clock text-amber-400 text-lg" />
              <Badge variant="warning" size="sm">{pending.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white">{pending.length}</p>
            <p className="text-[9px] text-amber-400/70 font-bold uppercase tracking-widest mt-1">Pending</p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-exclamation-triangle text-red-400 text-lg" />
              <Badge variant="destructive" size="sm">{failed.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white">{failed.length}</p>
            <p className="text-[9px] text-red-400/70 font-bold uppercase tracking-widest mt-1">Failed</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleFlush}
            disabled={pending.length === 0}
            className="font-black uppercase tracking-widest text-[10px]"
          >
            <i className="fas fa-sync-alt mr-2" />
            Sync Now
          </Button>
          {failed.length > 0 && (
            <Button
              variant="warning"
              size="sm"
              onClick={handleRetry}
              className="font-black uppercase tracking-widest text-[10px]"
            >
              <i className="fas fa-redo mr-2" />
              Retry Failed
            </Button>
          )}
        </div>

        {/* Pending Operations */}
        {pending.length > 0 && (
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3">Pending Operations</h3>
            <div className="space-y-2">
              {pending.map((op) => (
                <div
                  key={op.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">{formatOperationType(op.type)}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Queued {formatQueuedAt(op.queuedAt)} · Retry {op.retry_count}/{5}
                    </p>
                  </div>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => handleRemove(op.id)}
                    className="font-black uppercase tracking-widest text-[9px]"
                  >
                    <i className="fas fa-times mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Operations */}
        {failed.length > 0 && (
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3">Failed Operations</h3>
            <div className="space-y-2">
              {failed.map((op) => (
                <div
                  key={op.id}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-black text-white">{formatOperationType(op.type)}</p>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemove(op.id)}
                      className="font-black uppercase tracking-widest text-[9px]"
                    >
                      <i className="fas fa-times mr-1" />
                      Remove
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Failed {formatQueuedAt(op.last_retry)} · {op.retry_count} attempts
                  </p>
                  {op.error && (
                    <p className="text-[10px] text-red-400 mt-1 font-mono">{op.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pending.length === 0 && failed.length === 0 && (
          <EmptyState
            icon="fas fa-check-circle"
            title="Queue is empty"
            description="All operations have been synced successfully."
          />
        )}
      </div>
    </Modal>
  );
};
