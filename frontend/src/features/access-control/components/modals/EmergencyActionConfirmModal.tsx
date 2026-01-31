import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';

interface EmergencyActionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    action: 'lockdown' | 'unlock' | 'reset';
    isProcessing?: boolean;
}

export const EmergencyActionConfirmModal: React.FC<EmergencyActionConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    action,
    isProcessing = false
}) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            return;
        }
        onConfirm(reason.trim());
        setReason('');
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    const actionLabels = {
        lockdown: {
            title: 'Confirm Emergency Lockdown',
            message: '⚠️ EMERGENCY LOCKDOWN\n\nThis will lock ALL access points. Are you sure?',
            button: 'Initiate Lockdown'
        },
        unlock: {
            title: 'Confirm Emergency Unlock',
            message: '⚠️ EMERGENCY UNLOCK\n\nThis will unlock ALL access points. Are you sure?',
            button: 'Unlock All'
        },
        reset: {
            title: 'Confirm System Reset',
            message: 'This will restore normal mode and deactivate emergency controls.',
            button: 'Reset System'
        }
    };

    const labels = actionLabels[action];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={labels.title}
            size="md"
        >
            <div className="space-y-4">
                <p className="text-sm text-white whitespace-pre-line">
                    {labels.message}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-500">
                    Reason required for audit logging.
                </p>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                        Reason
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="Short reason for this action."
                        disabled={isProcessing}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="subtle"
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="text-xs font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={isProcessing || !reason.trim()}
                        className="text-xs font-black uppercase tracking-widest"
                    >
                        {isProcessing ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />
                                Processing...
                            </>
                        ) : labels.button}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
