import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { PatrolRoute } from '../../types';

interface ViewRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: PatrolRoute | null;
}

export const ViewRouteModal: React.FC<ViewRouteModalProps> = ({ isOpen, onClose, route }) => {
    if (!route) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="View Route"
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
                    <p className="text-white font-bold">{route.name}</p>
                </div>
                {route.description && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Description</p>
                        <p className="text-slate-300 text-sm">{route.description}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Duration</p>
                        <p className="text-white font-mono text-sm">{route.estimatedDuration}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Checkpoints</p>
                        <p className="text-white font-mono text-sm">{route.checkpoints?.length ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Difficulty</p>
                        <p className="text-slate-300 text-sm">{route.difficulty}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Last used</p>
                        <p className="text-slate-300 text-sm font-mono">{route.lastUsed || '—'}</p>
                    </div>
                </div>
                {route.checkpoints && route.checkpoints.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Checkpoints</p>
                        <ul className="space-y-1.5">
                            {route.checkpoints.map((cp, i) => (
                                <li key={cp.id} className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500 font-mono w-6">{i + 1}.</span>
                                    <span className="text-white">{cp.name}</span>
                                    {cp.isCritical && <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20 rounded">Critical</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
};
