import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import type { IntegrationType } from '../../types/account-settings.types';

const INTEGRATION_TYPES: { value: IntegrationType; label: string }[] = [
  { value: 'camera', label: 'Camera' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'reporting', label: 'Reporting' },
];

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddIntegrationModal: React.FC<AddIntegrationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addIntegration, loading } = useAccountSettingsContext();
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>('camera');
  const [endpoint, setEndpoint] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Name is required');
      return;
    }
    if (!endpoint.trim()) {
      setValidationError('Endpoint is required');
      return;
    }
    const result = await addIntegration({ name: name.trim(), type, endpoint: endpoint.trim() });
    if (result) {
      setName('');
      setEndpoint('');
      setType('camera');
      onClose();
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setValidationError(null);
    setName('');
    setEndpoint('');
    setType('camera');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Integration"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading.save}>
            {loading.save ? 'Adding...' : 'Add Integration'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {validationError && (
          <p className="text-[10px] text-red-400 font-black uppercase tracking-tight">{validationError}</p>
        )}
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:border-white/20"
            placeholder="e.g. Security Cameras"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as IntegrationType)}
            className="w-full px-3 py-2 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/30"
          >
            {INTEGRATION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Endpoint <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:border-white/20"
            placeholder="e.g. 192.168.1.100 or https://api.example.com"
          />
        </div>
      </div>
    </Modal>
  );
};
