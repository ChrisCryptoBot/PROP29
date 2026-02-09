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
      footer={
        <>
          <Button type="button" variant="subtle" onClick={handleClose} disabled={loading.actions} className="px-8 font-black uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button type="submit" form="send-message-form" variant="primary" disabled={!message.trim() || loading.actions} className="px-8 font-black uppercase tracking-widest text-[10px]">
            {loading.actions ? 'Sending...' : 'Send Message'}
          </Button>
        </>
      }
    >
      <form id="send-message-form" onSubmit={handleSubmit} className="space-y-6">
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
      </form>
    </Modal>
  );
};


