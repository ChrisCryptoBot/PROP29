/**
 * Badge Print Modal
 * Modal for displaying and printing visitor badge.
 * Calls hardware print API when available, then falls back to browser print.
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { showSuccess, showError } from '../../../../utils/toast';

export interface BadgePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgePrintModal: React.FC<BadgePrintModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { selectedVisitor, setShowBadgeModal, printVisitorBadge, hardwareDevices, loading } = useVisitorContext();
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    if (!selectedVisitor) return;
    setPrinting(true);
    try {
      const printerId = hardwareDevices.find(d => d.device_type === 'printer' && d.status === 'online')?.device_id;
      const apiSuccess = await printVisitorBadge(selectedVisitor.id, printerId);
      if (apiSuccess) {
        showSuccess('Badge sent to printer');
      }
      window.print();
      if (!apiSuccess) {
        showSuccess('Print dialog opened — use browser print if no hardware printer.');
      }
      setShowBadgeModal(false);
      onClose();
    } catch {
      showError('Print failed');
    } finally {
      setPrinting(false);
    }
  };

  if (!selectedVisitor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Badge"
    >
      <div className="space-y-6">
        <div className="border border-white/5 rounded-md p-8 bg-slate-900/50 relative overflow-hidden">
          <div className="text-center mb-6 relative z-10">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <span className="text-white text-3xl font-black">
                {selectedVisitor.first_name[0]}{selectedVisitor.last_name[0]}
              </span>
            </div>
            <h3 className="text-2xl font-black text-[color:var(--text-main)]">
              {selectedVisitor.first_name} {selectedVisitor.last_name}
            </h3>
            {selectedVisitor.event_name && (
              <p className="text-sm text-blue-400 font-bold mt-1 uppercase tracking-widest">{selectedVisitor.event_name}</p>
            )}
            <div className="mt-4 flex flex-col items-center">
              <span className="text-[10px] text-[color:var(--text-sub)]/50 font-bold uppercase tracking-[0.2em] mb-1">Security Identifier</span>
              <p className="font-mono text-sm text-[color:var(--text-main)] bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                {selectedVisitor.badge_id}
              </p>
            </div>

            {selectedVisitor.badge_expires_at && (
              <div className="mt-4 flex items-center justify-center text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-4 py-1.5 rounded-md border border-red-500/20">
                <i className="fas fa-clock mr-2" />
                Valid Until: {new Date(selectedVisitor.badge_expires_at).toLocaleString()}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-6 mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[color:var(--text-sub)] font-medium">Access Status</span>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-xs font-black uppercase tracking-wider">
                {selectedVisitor.security_clearance}
              </span>
            </div>
            {selectedVisitor.access_points && selectedVisitor.access_points.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-[color:var(--text-sub)]/50 font-bold uppercase tracking-widest block mb-2">Authorized Zones</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVisitor.access_points.map((ap, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900/50 text-[color:var(--text-main)] text-[10px] font-bold rounded border border-white/5">
                      Zone {ap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full py-4 text-xs font-black uppercase tracking-[0.2em]"
          onClick={handlePrint}
          disabled={printing || loading.hardwareDevices}
        >
          {printing || loading.hardwareDevices ? (
            <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
          ) : (
            <i className="fas fa-print mr-2" aria-hidden />
          )}
          {printing || loading.hardwareDevices ? 'Printing...' : 'Print Badge'}
        </Button>
      </div>
    </Modal>
  );
});

BadgePrintModal.displayName = 'BadgePrintModal';
