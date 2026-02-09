/**
 * Smart Lockers - Locker Details Modal
 * Gold standard: uses shared Modal, flat content, footer actions.
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { getStatusBadgeClass, getSizeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { showError } from '../../../../utils/toast';

export const LockerDetailsModal: React.FC = () => {
  const { remoteUnlockLocker, requestMaintenance, canUpdateLocker, selectedLocker, setSelectedLocker } = useSmartLockersContext();
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedLocker) return null;
  const locker = selectedLocker;

  const handleClose = () => setSelectedLocker(null);

  const handleRemoteUnlock = async () => {
    if (!window.confirm(`Remotely unlock ${locker.lockerNumber}?`)) return;
    setIsProcessing(true);
    try {
      await remoteUnlockLocker(locker.id);
      handleClose();
    } catch {
      // Error is handled by the hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestMaintenance = async () => {
    if (!maintenanceReason.trim()) {
      showError('Please provide a reason for the maintenance request');
      return;
    }
    setIsProcessing(true);
    try {
      await requestMaintenance(locker.id, maintenanceReason);
      setShowMaintenanceForm(false);
      setMaintenanceReason('');
      handleClose();
    } catch {
      // Error is handled by the hook
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={!!selectedLocker}
      onClose={handleClose}
      title={`Locker — ${locker.lockerNumber}`}
      size="lg"
      footer={
        <>
          {canUpdateLocker && (
            <>
              {locker.status === 'occupied' && (
                <Button
                  variant="primary"
                  className="font-black uppercase tracking-widest px-8"
                  onClick={handleRemoteUnlock}
                  disabled={isProcessing}
                >
                  <i className="fas fa-unlock mr-2" />
                  Remote Unlock
                </Button>
              )}
              <Button
                variant="outline"
                className="font-black uppercase tracking-widest border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-8"
                onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                disabled={isProcessing}
              >
                <i className="fas fa-tools mr-2" />
                {showMaintenanceForm ? 'Cancel Request' : 'Request Maintenance'}
              </Button>
            </>
          )}
          <Button variant="subtle" onClick={handleClose} className="font-black uppercase tracking-widest">
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className={cn('px-3 py-1.5 text-xs font-black rounded uppercase tracking-widest', getStatusBadgeClass(locker.status))}>
            {locker.status}
          </span>
          <span className={cn('px-3 py-1.5 text-xs font-black rounded uppercase tracking-widest', getSizeBadgeClass(locker.size))}>
            {locker.size}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Location</label>
            <p className="text-sm font-medium text-white">{formatLocationDisplay(locker.location) || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Locker number</label>
            <p className="text-sm font-medium text-white">{locker.lockerNumber}</p>
          </div>
          {locker.batteryLevel !== undefined && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Battery</label>
              <p className="text-sm font-medium text-white">{locker.batteryLevel}%</p>
            </div>
          )}
          {locker.signalStrength !== undefined && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Signal</label>
              <p className="text-sm font-medium text-white">{locker.signalStrength}%</p>
            </div>
          )}
          {locker.currentGuestId && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Assigned guest</label>
              <p className="text-sm font-medium text-white">{locker.currentGuestId}</p>
            </div>
          )}
          {locker.checkInTime && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Check-in</label>
              <p className="text-sm font-medium text-white">{new Date(locker.checkInTime).toLocaleString()}</p>
            </div>
          )}
        </div>

        {locker.features && locker.features.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Features</label>
            <div className="flex flex-wrap gap-2">
              {locker.features.map((f) => (
                <span key={f} className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {showMaintenanceForm && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/5 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="Describe the issue..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="text-slate-400 hover:text-white border-white/5" onClick={() => { setShowMaintenanceForm(false); setMaintenanceReason(''); }}>
                Cancel
              </Button>
              <Button
                variant="warning"
                className="font-black uppercase tracking-widest px-6"
                onClick={handleRequestMaintenance}
                disabled={isProcessing || !maintenanceReason.trim()}
              >
                {isProcessing ? <><i className="fas fa-spinner fa-spin mr-2" />Sending...</> : <><i className="fas fa-tools mr-2" />Submit</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
