/**
 * Guest Safety - Send Message Modal
 * Send a message to a guest regarding their incident
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
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
    <Modal
      isOpen={showSendMessageModal}
      onClose={handleClose}
      title={`Send Message - ${selectedIncident.guestName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Message
          </label>
          <textarea
            className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 min-h-[160px] placeholder:text-white/20"
            placeholder="Enter message to send to guest..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={loading.actions}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            className="px-8 font-black uppercase tracking-widest text-[10px] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={handleClose}
            disabled={loading.actions}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none"
            disabled={!message.trim() || loading.actions}
          >
            {loading.actions ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


