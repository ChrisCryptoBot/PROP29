/**
 * Guest Safety - Send Message Modal
 * Send a message to a guest regarding their incident
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const SendMessageModal: React.FC = () => {
  const {
    selectedIncident,
    sendMessage,
    showSendMessageModal,
    setShowSendMessageModal,
    loading,
  } = useGuestSafetyContext();

  const [message, setMessage] = useState('');

  if (!showSendMessageModal || !selectedIncident) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(selectedIncident.id, message);
      setShowSendMessageModal(false);
      setMessage('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setShowSendMessageModal(false);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true">
      <div className="glass-card border-glass bg-[color:var(--surface-card)]/90 shadow-2xl w-full max-w-md overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
              <i className="fas fa-envelope text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Secure Communiqué</h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 italic">Guest: {selectedIncident.guestName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all group"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-lg group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">
              Direct Transmission Content
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[160px] shadow-inner placeholder:text-white/20"
              placeholder="Enter mandatory safety directive or communiqué..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={loading.actions}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full py-6 font-black uppercase tracking-[0.2em] text-[12px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none rounded-2xl transition-all active:scale-[0.98]"
              disabled={!message.trim() || loading.actions}
            >
              {loading.actions ? 'Initiating Transmission...' : 'Execute Transmission'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-6 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:hover:bg-white/5 hover:text-white transition-all shadow-lg rounded-2xl"
              onClick={handleClose}
              disabled={loading.actions}
            >
              Abort Transmission
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


