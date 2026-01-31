/**
 * Badge Print Modal
 * Modal for displaying and printing visitor badge
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { showSuccess } from '../../../../utils/toast';

export interface BadgePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgePrintModal: React.FC<BadgePrintModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { selectedVisitor, setShowBadgeModal } = useVisitorContext();

  const handlePrint = () => {
    // Trigger browser print dialog
    window.print();
    showSuccess('Badge sent to printer');
    setShowBadgeModal(false);
  };

  if (!selectedVisitor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Badge"
    >
      <div className="space-y-6">
        <div className="border-2 border-[color:var(--border-subtle)]/40 rounded-xl p-8 bg-[color:var(--surface-card)] shadow-2xl relative overflow-hidden">
          {/* Badge Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="text-center mb-6 relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[color:var(--border-subtle)]/30 shadow-2xl">
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
              <p className="font-mono text-sm text-[color:var(--text-main)] bg-[color:var(--console-dark)] px-3 py-1 rounded-full border border-[color:var(--border-subtle)]/20">
                {selectedVisitor.badge_id}
              </p>
            </div>

            {selectedVisitor.badge_expires_at && (
              <div className="mt-4 flex items-center justify-center text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
                <i className="fas fa-clock mr-2" />
                Valid Until: {new Date(selectedVisitor.badge_expires_at).toLocaleString()}
              </div>
            )}
          </div>

          <div className="border-t border-[color:var(--border-subtle)]/20 pt-6 mt-6 space-y-3">
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
                    <span key={i} className="px-2 py-0.5 bg-[color:var(--console-dark)] text-[color:var(--text-main)] text-[10px] font-bold rounded border border-[color:var(--border-subtle)]/20">
                      Zone {ap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Holographic Watermark effect */}
          <div className="absolute bottom-2 right-2 opacity-5 scale-150">
            <i className="fas fa-shield-alt text-4xl" />
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full py-4 text-xs font-black uppercase tracking-[0.2em]"
          onClick={handlePrint}
        >
          <i className="fas fa-print mr-2" />
          Initialize Print Protocol
        </Button>
      </div>
    </Modal>
  );
});

BadgePrintModal.displayName = 'BadgePrintModal';
