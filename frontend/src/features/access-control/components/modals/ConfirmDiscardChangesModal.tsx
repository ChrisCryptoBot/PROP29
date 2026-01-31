import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';

interface ConfirmDiscardChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmDiscardChangesModal: React.FC<ConfirmDiscardChangesModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Discard Changes?"
            size="sm"
        >
            <div className="space-y-4">
                <p className="text-sm text-white">
                    You have unsaved changes. Are you sure you want to cancel?
                </p>
                <p className="text-[10px] text-slate-400 italic">
                    Your changes will be lost.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        Keep Editing
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        Discard Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
