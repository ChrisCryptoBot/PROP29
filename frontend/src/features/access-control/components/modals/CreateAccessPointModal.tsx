import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';

export interface AccessPointFormData {
  name: string;
  location: string;
  type: 'door' | 'gate' | 'elevator' | 'turnstile';
  accessMethod: 'card' | 'biometric' | 'pin' | 'mobile';
  status: 'active' | 'maintenance' | 'disabled' | 'inactive';
  description: string;
}

interface CreateAccessPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  formData: AccessPointFormData;
  onFormChange: (data: Partial<AccessPointFormData>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
  isEditMode?: boolean;
}

const INPUT_CLASS = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const LABEL_CLASS = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';

export const CreateAccessPointModal: React.FC<CreateAccessPointModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isFormDirty,
  setIsFormDirty,
  isEditMode = false
}) => {
  const handleClose = () => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Access Point' : 'Add Access Point'}
      size="lg"
      footer={
        <>
          <Button onClick={handleClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
            Cancel
          </Button>
          <Button onClick={onSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest shadow-none">
            {isEditMode ? 'Save Changes' : 'Add Access Point'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ap-name" className={LABEL_CLASS}>Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            id="ap-name"
            value={formData.name}
            onChange={(e) => { onFormChange({ name: e.target.value }); setIsFormDirty(true); }}
            className={INPUT_CLASS}
            placeholder="e.g. Main Lobby North"
            aria-label="Access point name"
          />
        </div>
        <div>
          <label htmlFor="ap-location" className={LABEL_CLASS}>Location <span className="text-red-400">*</span></label>
          <input
            type="text"
            id="ap-location"
            value={formData.location}
            onChange={(e) => { onFormChange({ location: e.target.value }); setIsFormDirty(true); }}
            className={INPUT_CLASS}
            placeholder="e.g. Sector-G / Level 2"
            aria-label="Access point location"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ap-type" className={LABEL_CLASS}>Type</label>
            <select
              id="ap-type"
              value={formData.type}
              onChange={(e) => { onFormChange({ type: e.target.value as AccessPointFormData['type'] }); setIsFormDirty(true); }}
              className={INPUT_CLASS}
              aria-label="Access point type"
            >
              <option value="door" className="bg-slate-900">Door</option>
              <option value="gate" className="bg-slate-900">Gate</option>
              <option value="elevator" className="bg-slate-900">Elevator</option>
              <option value="turnstile" className="bg-slate-900">Turnstile</option>
            </select>
          </div>
          <div>
            <label htmlFor="ap-method" className={LABEL_CLASS}>Access Method</label>
            <select
              id="ap-method"
              value={formData.accessMethod}
              onChange={(e) => { onFormChange({ accessMethod: e.target.value as AccessPointFormData['accessMethod'] }); setIsFormDirty(true); }}
              className={INPUT_CLASS}
              aria-label="Access method"
            >
              <option value="card" className="bg-slate-900">RFID Card</option>
              <option value="biometric" className="bg-slate-900">Biometric</option>
              <option value="pin" className="bg-slate-900">PIN Code</option>
              <option value="mobile" className="bg-slate-900">Mobile Pass</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ap-status" className={LABEL_CLASS}>Status</label>
          <select
            id="ap-status"
            value={formData.status}
            onChange={(e) => { onFormChange({ status: e.target.value as AccessPointFormData['status'] }); setIsFormDirty(true); }}
            className={INPUT_CLASS}
            aria-label="Access point status"
          >
            <option value="active" className="bg-slate-900">Active</option>
            <option value="maintenance" className="bg-slate-900">Maintenance</option>
            <option value="disabled" className="bg-slate-900">Disabled</option>
            <option value="inactive" className="bg-slate-900">Inactive</option>
          </select>
        </div>
        <div>
          <label htmlFor="ap-description" className={LABEL_CLASS}>Notes</label>
          <textarea
            id="ap-description"
            value={formData.description}
            onChange={(e) => { onFormChange({ description: e.target.value }); setIsFormDirty(true); }}
            className={INPUT_CLASS}
            rows={3}
            placeholder="Maintenance notes or deployment details..."
            aria-label="Access point description"
          />
        </div>
      </div>
    </Modal>
  );
};
