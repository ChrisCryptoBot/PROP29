/**
 * QR Code Modal
 * Modal for displaying visitor QR code badge
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { showSuccess } from '../../../../utils/toast';

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { selectedVisitor, setShowQRModal } = useVisitorContext();

  const handleCopyQRCode = async () => {
    if (selectedVisitor?.qr_code) {
      try {
        await navigator.clipboard.writeText(selectedVisitor.qr_code);
        showSuccess('QR code copied to clipboard');
        setShowQRModal(false);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedVisitor.qr_code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('QR code copied to clipboard');
        setShowQRModal(false);
      }
    }
  };

  if (!selectedVisitor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code Badge"
    >
      <div className="text-center space-y-6">
        <div className="p-4 bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/20 rounded-xl">
          <h3 className="text-xl font-black text-[color:var(--text-main)] mb-1">
            {selectedVisitor.first_name} {selectedVisitor.last_name}
          </h3>
          {selectedVisitor.event_name && (
            <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">{selectedVisitor.event_name}</p>
          )}
          <p className="text-[10px] font-mono text-[color:var(--text-sub)]/50 mt-2 uppercase tracking-[0.2em]">IDENTIFIER: {selectedVisitor.badge_id}</p>
        </div>

        <div className="relative group">
          <div className="w-64 h-64 bg-white border-8 border-indigo-900 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl overflow-hidden relative">
            <div className="text-center">
              <i className="fas fa-qrcode text-8xl text-indigo-950 mb-4 opacity-80" />
              <div className="px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 italic">
                <p className="font-mono text-[8px] text-indigo-900 font-bold uppercase tracking-widest">{selectedVisitor.qr_code}</p>
              </div>
            </div>
            
            {/* Dynamic scanning effect */}
            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
          </div>
          
          <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full opacity-20 pointer-events-none" />
        </div>

        <p className="text-sm text-[color:var(--text-sub)] max-w-xs mx-auto leading-relaxed">
          Authorized personnel should display this dynamic QR signature at all designated access checkpoints.
        </p>

        <Button
          variant="primary"
          className="w-full py-4 text-xs font-black uppercase tracking-[0.2em]"
          onClick={handleCopyQRCode}
        >
          <i className="fas fa-copy mr-2" />
          Copy Security Identifier
        </Button>
      </div>
    </Modal>
  );
});

QRCodeModal.displayName = 'QRCodeModal';
