/**
 * Edit Certification modal — prefilled; Save calls context.updateCertification.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import type { Certification, UpdateCertificationRequest } from '../../types/profile-settings.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';

interface EditCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification: Certification | null;
  onSuccess?: () => void;
}

export const EditCertificationModal: React.FC<EditCertificationModalProps> = ({
  isOpen,
  onClose,
  certification,
  onSuccess,
}) => {
  const { updateCertification, loading } = useProfileSettingsContext();
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (certification) {
      setName(certification.name);
      setIssuer(certification.issuer);
      setIssueDate(certification.issueDate);
      setExpiryDate(certification.expiryDate);
    }
  }, [certification]);

  const handleSubmit = async () => {
    if (!certification) return;
    const data: UpdateCertificationRequest = { name, issuer, issueDate, expiryDate };
    const updated = await updateCertification(certification.id, data);
    if (updated) {
      onClose();
      onSuccess?.();
    }
  };

  if (!certification) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Certification"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading.save}>
            {loading.save ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Certification Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Issuer</label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Issue Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </Modal>
  );
};
