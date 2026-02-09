import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import type { TeamMember } from '../../types/account-settings.types';

interface ConfirmRemoveModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfirmRemoveModal: React.FC<ConfirmRemoveModalProps> = ({ isOpen, member, onClose, onSuccess }) => {
  const { removeTeamMember, loading } = useAccountSettingsContext();

  const handleConfirm = async () => {
    if (!member) return;
    const ok = await removeTeamMember(member.id);
    if (ok) {
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Team Member"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading.save || !member}>
            {loading.save ? 'Removing...' : 'Remove'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[color:var(--text-sub)]">
        Remove <strong className="text-white">{member?.name ?? 'this member'}</strong> from the team? This cannot be undone.
      </p>
    </Modal>
  );
};
