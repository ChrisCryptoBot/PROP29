/**
 * Confirm remove certification — Confirm calls context.removeCertification.
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import type { Certification } from '../../types/profile-settings.types';

interface ConfirmRemoveCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification: Certification | null;
  onSuccess?: () => void;
}

export const ConfirmRemoveCertificationModal: React.FC<ConfirmRemoveCertificationModalProps> = ({
  isOpen,
  onClose,
  certification,
  onSuccess,
}) => {
  const { removeCertification, loading } = useProfileSettingsContext();

  const handleConfirm = async () => {
    if (!certification) return;
    const updated = await removeCertification(certification.id);
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
      title="Remove Certification"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading.save}>
            {loading.save ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[color:var(--text-sub)]">
        Remove <strong className="text-white">{certification.name}</strong>? This cannot be undone.
      </p>
    </Modal>
  );
};
