import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { PatrolOfficer, UpcomingPatrol } from '../../types';

interface DeploymentConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    officer: PatrolOfficer | null;
    patrol: UpcomingPatrol | null;
    onConfirm: () => void;
    isConfirming?: boolean;
}

export const DeploymentConfirmationModal: React.FC<DeploymentConfirmationModalProps> = ({
    isOpen,
    onClose,
    officer,
    patrol,
    onConfirm,
    isConfirming = false
}) => {
    if (!isOpen || !officer || !patrol) return null;

    const checkpointCount = patrol.checkpoints?.length ?? 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm deployment" size="sm">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Officer</p>
                        <p className="text-sm font-black text-white mt-1">{officer.name}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Patrol</p>
                        <p className="text-sm font-black text-white mt-1">{patrol.name}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Checkpoints</p>
                        <p className="text-sm font-black text-white mt-1">{checkpointCount}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Duration</p>
                        <p className="text-sm font-black text-white mt-1">{patrol.duration || '—'}</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400">
                    Assigning this officer will start the patrol and mark them on duty.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        disabled={isConfirming}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        {isConfirming ? 'Deploying…' : 'Confirm deployment'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
