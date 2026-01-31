import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Incident } from '../../types/incident-log.types';

interface ConflictResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident;
    localChanges: Partial<Incident>;
    serverVersion: Incident;
    onResolve: (action: 'overwrite' | 'merge' | 'cancel') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
    isOpen,
    onClose,
    incident,
    localChanges,
    serverVersion,
    onResolve
}) => {
    const getChangedFields = () => {
        const changed: string[] = [];
        if (localChanges.title !== undefined && localChanges.title !== serverVersion.title) {
            changed.push('Title');
        }
        if (localChanges.description !== undefined && localChanges.description !== serverVersion.description) {
            changed.push('Description');
        }
        if (localChanges.status !== undefined && localChanges.status !== serverVersion.status) {
            changed.push('Status');
        }
        if (localChanges.severity !== undefined && localChanges.severity !== serverVersion.severity) {
            changed.push('Severity');
        }
        if (localChanges.assigned_to !== undefined && localChanges.assigned_to !== serverVersion.assigned_to) {
            changed.push('Assigned To');
        }
        return changed;
    };

    const changedFields = getChangedFields();
    const serverUpdatedAt = new Date(serverVersion.updated_at).toLocaleString();
    const localUpdatedAt = new Date(incident.updated_at).toLocaleString();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Conflict Detected"
            size="lg"
            draggable={true}
        >
            <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-triangle text-amber-400 text-xl mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-black text-amber-400 uppercase tracking-wider mb-2">
                                This incident was modified by another user
                            </p>
                            <p className="text-xs text-amber-300">
                                The server version was updated at <strong>{serverUpdatedAt}</strong>, while your local version was last updated at <strong>{localUpdatedAt}</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Your Local Changes
                        </p>
                        <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
                            {changedFields.length > 0 ? (
                                <ul className="space-y-1">
                                    {changedFields.map((field) => (
                                        <li key={field} className="text-xs text-blue-300 flex items-center gap-2">
                                            <i className="fas fa-check-circle text-blue-400" />
                                            {field}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No local changes detected</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Server Version Details
                        </p>
                        <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
                            <div className="text-xs text-slate-300">
                                <p><strong>Title:</strong> {serverVersion.title}</p>
                                <p><strong>Status:</strong> {serverVersion.status}</p>
                                <p><strong>Severity:</strong> {serverVersion.severity}</p>
                                {serverVersion.assigned_to && (
                                    <p><strong>Assigned To:</strong> {serverVersion.assignee_name || serverVersion.assigned_to}</p>
                                )}
                                <p><strong>Last Updated:</strong> {serverUpdatedAt}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-white/5 rounded-lg p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Resolution Options
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                            <i className="fas fa-arrow-right text-blue-400 mt-1" />
                            <div>
                                <strong>Overwrite:</strong> Replace server version with your local changes
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-code-branch text-purple-400 mt-1" />
                            <div>
                                <strong>Merge:</strong> Combine your changes with server version (recommended)
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-times text-red-400 mt-1" />
                            <div>
                                <strong>Cancel:</strong> Discard your changes and keep server version
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button
                        variant="subtle"
                        onClick={() => onResolve('cancel')}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-times mr-2" />
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onResolve('overwrite')}
                        className="text-[9px] font-black uppercase tracking-widest border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                        <i className="fas fa-arrow-right mr-2" />
                        Overwrite
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => onResolve('merge')}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-code-branch mr-2" />
                        Merge (Recommended)
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
