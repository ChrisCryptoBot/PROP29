import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { Checkpoint } from '../../types';

interface ViewCheckpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkpoint: Checkpoint | null;
}

export const ViewCheckpointModal: React.FC<ViewCheckpointModalProps> = ({ isOpen, onClose, checkpoint }) => {
    if (!checkpoint) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="View Checkpoint"
            size="md"
            footer={
                <Button variant="subtle" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="space-y-4">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Name</p>
                    <p className="text-white font-bold">{checkpoint.name}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</p>
                    <p className="text-slate-300 text-sm">{formatLocationDisplay(checkpoint.location) || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Type</p>
                        <p className="text-slate-300 text-sm">{checkpoint.type}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Est. time</p>
                        <p className="text-white font-mono text-sm">{checkpoint.estimatedTime ?? 0} min</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Critical</p>
                        <p className="text-slate-300 text-sm">{checkpoint.isCritical ? 'Yes' : 'No'}</p>
                    </div>
                </div>
                {checkpoint.requiredActions && checkpoint.requiredActions.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Required actions</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                            {checkpoint.requiredActions.map((a, i) => (
                                <li key={i}>• {a}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
};
