/**
 * Sound Monitoring - Alert Details Modal
 * Displays detailed information about a sound alert. Uses global Modal (UI gold standard).
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import type { SoundAlert } from '../../types/sound-monitoring.types';

interface AlertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: SoundAlert | null;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  isOpen,
  onClose,
  alert,
}) => {
  const {
    acknowledgeAlert,
    resolveAlert,
    loading,
    canAcknowledgeAlert,
    canResolveAlert,
  } = useSoundMonitoringContext();

  if (!alert) return null;

  const handleAcknowledge = async () => {
    await acknowledgeAlert(alert.id);
  };

  const handleResolve = async () => {
    await resolveAlert(alert.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alert details"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          {alert.status === 'active' && canAcknowledgeAlert && (
            <Button variant="primary" onClick={handleAcknowledge} disabled={loading.actions}>
              {loading.actions ? 'Acknowledging…' : 'Acknowledge'}
            </Button>
          )}
          {alert.status === 'investigating' && canResolveAlert && (
            <Button variant="primary" onClick={handleResolve} disabled={loading.actions}>
              {loading.actions ? 'Resolving…' : 'Resolve'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Type</p>
          <p className="text-xl font-black text-white">{alert.type}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</p>
          <p className="text-white font-bold">{formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
            <span className={cn('inline-block px-3 py-1 text-[10px] font-black rounded border uppercase tracking-widest', getStatusBadgeClass(alert.status))}>
              {alert.status}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Severity</p>
            <span className={cn('inline-block px-3 py-1 text-[10px] font-black rounded border uppercase tracking-widest', getSeverityBadgeClass(alert.severity))}>
              {alert.severity}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Detected</p>
            <p className="text-white font-bold text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Level</p>
            <p className="text-white font-bold">{alert.decibelLevel} dB</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Frequency</p>
            <p className="text-white font-bold">{alert.frequency} Hz</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Duration</p>
            <p className="text-white font-bold">{alert.duration} sec</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Assigned to</p>
            <p className="text-white font-bold">{alert.assignedTo || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Response time</p>
            <p className="text-white font-bold">{alert.responseTime ?? '0'} sec</p>
          </div>
        </div>
        {alert.description && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Notes</p>
            <p className="text-sm text-slate-300">{alert.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
