import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const inputErrorClass =
  'w-full px-3 py-2 bg-white/5 border border-red-500/50 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:bg-white/10 font-mono placeholder-slate-500';

export const AddIntegrationModal: React.FC = () => {
  const {
    showAddIntegrationModal,
    setShowAddIntegrationModal,
    newIntegration,
    setNewIntegration,
    handleAddIntegration,
  } = useSystemAdminContext();

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!showAddIntegrationModal) return null;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newIntegration.name.trim()) {
      newErrors.name = 'Service name is required';
    }
    
    if (!newIntegration.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    handleAddIntegration();
  };

  const handleFieldChange = (field: keyof typeof newIntegration, value: string) => {
    setNewIntegration({ ...newIntegration, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleClose = () => {
    setShowAddIntegrationModal(false);
    setErrors({});
  };

  return (
    <Modal
      isOpen={showAddIntegrationModal}
      onClose={handleClose}
      title="Add integration"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Connect
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Service name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newIntegration.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="e.g. Master CCTV Node"
          />
          {errors.name && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Type
          </label>
          <input
            type="text"
            value={newIntegration.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            className={inputClass}
            placeholder="e.g. WebSocket, REST API"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Endpoint <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newIntegration.endpoint}
            onChange={(e) => handleFieldChange('endpoint', e.target.value)}
            className={errors.endpoint ? inputErrorClass : inputClass}
            placeholder="wss://internal.security.node:8443"
          />
          {errors.endpoint && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.endpoint}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
