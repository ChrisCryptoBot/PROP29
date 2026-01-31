import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    isDeleting = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
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
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-white">
                    {message}
                </p>
                {itemName && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs font-mono text-red-400 font-bold">
                            {itemName}
                        </p>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 italic">
                    This action cannot be undone.
                </p>
            </div>
        </Modal>
    );
};
