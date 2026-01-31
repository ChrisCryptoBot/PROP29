/**
 * Offline Queue Indicator Component
 * Displays pending queue count and sync status
 */

import React, { useState } from 'react';
import { Badge } from '../../../components/UI/Badge';
import { Button } from '../../../components/UI/Button';
import { useSecurityOperationsQueue } from '../hooks/useSecurityOperationsQueue';
import { QueueManagementModal } from './modals/QueueManagementModal';
import { cn } from '../../../utils/cn';

export const OfflineQueueIndicator: React.FC = () => {
  const { pendingCount, failedCount, flush, retryFailed } = useSecurityOperationsQueue();
  const [showModal, setShowModal] = useState(false);

  if (pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "font-black uppercase tracking-widest text-[10px] border-amber-500/20 text-amber-400 hover:bg-amber-500/10 h-9 px-4"
            )}
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-sync-alt mr-2" />
            {pendingCount} Pending
          </Button>
        )}
        {failedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "font-black uppercase tracking-widest text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 h-9 px-4"
            )}
            onClick={() => {
              retryFailed();
              flush();
            }}
          >
            <i className="fas fa-exclamation-triangle mr-2" />
            {failedCount} Failed
          </Button>
        )}
      </div>
      <QueueManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
