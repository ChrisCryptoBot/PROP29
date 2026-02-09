import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';

interface ConfirmDeleteSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sensorId: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteSensorModal: React.FC<ConfirmDeleteSensorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sensorId,
  isDeleting = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Delete sensor"
    size="sm"
    footer={
      <>
        <Button variant="subtle" onClick={onClose} disabled={isDeleting} className="text-[10px] font-black uppercase tracking-widest">
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="text-[10px] font-black uppercase tracking-widest">
          {isDeleting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </>
    }
  >
    <div className="space-y-4">
      <p className="text-sm text-white">
        Are you sure you want to delete this sensor? All readings for this sensor will be removed.
      </p>
      <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
        <p className="text-xs font-mono text-red-400 font-bold">{sensorId}</p>
      </div>
      <p className="text-[10px] text-slate-400 italic">This action cannot be undone.</p>
    </div>
  </Modal>
);
