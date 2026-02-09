/**
 * QR Code Modal
 * Fetches and displays visitor QR code from API; allows copy to clipboard.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { showSuccess, showError } from '../../../../utils/toast';

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { selectedVisitor, setShowQRModal, getVisitorQRCode } = useVisitorContext();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !selectedVisitor) {
      setQrCode(null);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    getVisitorQRCode(selectedVisitor.id)
      .then((code) => {
        if (!cancelled) {
          setQrCode(code || selectedVisitor.qr_code || null);
          if (!code && !selectedVisitor.qr_code) setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCode(selectedVisitor.qr_code || null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, selectedVisitor?.id, getVisitorQRCode, selectedVisitor?.qr_code]);

  const displayCode = qrCode || selectedVisitor?.qr_code || '';

  const handleCopyQRCode = async () => {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      showSuccess('QR code copied to clipboard');
      setShowQRModal(false);
      onClose();
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = displayCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('QR code copied to clipboard');
      setShowQRModal(false);
      onClose();
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
        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-md">
          <h3 className="text-xl font-black text-[color:var(--text-main)] mb-1">
            {selectedVisitor.first_name} {selectedVisitor.last_name}
          </h3>
          {selectedVisitor.event_name && (
            <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">{selectedVisitor.event_name}</p>
          )}
          <p className="text-[10px] font-mono text-[color:var(--text-sub)]/50 mt-2 uppercase tracking-[0.2em]">IDENTIFIER: {selectedVisitor.badge_id || '—'}</p>
        </div>

        <div className="w-64 h-64 bg-slate-900/50 border border-white/5 rounded-md mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-2" role="status" aria-label="Loading QR code">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : error && !displayCode ? (
            <p className="text-sm text-amber-400">QR code unavailable. Try again later.</p>
          ) : (
            <div className="text-center p-2">
              <i className="fas fa-qrcode text-6xl text-slate-400 mb-2" aria-hidden />
              <p className="font-mono text-[10px] text-white break-all px-2">{displayCode}</p>
            </div>
          )}
        </div>

        <p className="text-sm text-[color:var(--text-sub)] max-w-xs mx-auto leading-relaxed">
          Authorized personnel should display this QR at designated access checkpoints.
        </p>

        <Button
          variant="primary"
          className="w-full py-4 text-xs font-black uppercase tracking-[0.2em]"
          onClick={handleCopyQRCode}
          disabled={!displayCode || loading}
        >
          <i className="fas fa-copy mr-2" aria-hidden />
          Copy Security Identifier
        </Button>
      </div>
    </Modal>
  );
});

QRCodeModal.displayName = 'QRCodeModal';
