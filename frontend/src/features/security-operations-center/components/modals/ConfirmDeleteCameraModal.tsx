import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';

interface ConfirmDeleteCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cameraName: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteCameraModal: React.FC<ConfirmDeleteCameraModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cameraName,
  isDeleting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Camera"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-white">
          Are you sure you want to remove this camera from the system?
        </p>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-mono text-red-400 font-bold">
            {cameraName}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 italic">
          This will remove the camera configuration. Recordings and evidence linked to this camera will be preserved but may become inaccessible if the camera is not re-added.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={isDeleting}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />
                Removing...
              </>
            ) : 'Remove Camera'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
