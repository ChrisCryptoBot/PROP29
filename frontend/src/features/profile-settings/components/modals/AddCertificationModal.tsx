/**
 * Add Certification modal — Gold Standard; Submit calls context.addCertification.
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import type { AddCertificationRequest } from '../../types/profile-settings.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCertificationModal: React.FC<AddCertificationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addCertification, loading } = useProfileSettingsContext();
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName('');
    setIssuer('');
    setIssueDate('');
    setExpiryDate('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!issuer.trim()) next.issuer = 'Issuer is required';
    if (!issueDate) next.issueDate = 'Issue date is required';
    if (!expiryDate) next.expiryDate = 'Expiry date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data: AddCertificationRequest = { name: name.trim(), issuer: issuer.trim(), issueDate, expiryDate };
    const updated = await addCertification(data);
    if (updated) {
      handleClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Certification"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading.save}>
            {loading.save ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                Adding...
              </>
            ) : (
              'Add Certification'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Certification Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass + (errors.name ? ' border-red-500/50' : '')}
            placeholder="e.g. Certified Protection Professional (CPP)"
          />
          {errors.name && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>Issuer <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className={inputClass + (errors.issuer ? ' border-red-500/50' : '')}
            placeholder="e.g. ASIS International"
          />
          {errors.issuer && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.issuer}</p>}
        </div>
        <div>
          <label className={labelClass}>Issue Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className={inputClass + (errors.issueDate ? ' border-red-500/50' : '')}
          />
          {errors.issueDate && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.issueDate}</p>}
        </div>
        <div>
          <label className={labelClass}>Expiry Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass + (errors.expiryDate ? ' border-red-500/50' : '')}
          />
          {errors.expiryDate && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.expiryDate}</p>}
        </div>
      </div>
    </Modal>
  );
};
