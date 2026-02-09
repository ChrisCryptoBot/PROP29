import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { formatLocationDisplay } from '../../utils/formatLocation';
import { Visitor } from '../../types/visitor-security.types';

interface ConflictResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitor: Visitor;
    localChanges: Partial<Visitor>;
    serverVersion: Visitor;
    onResolve: (action: 'overwrite' | 'merge' | 'cancel') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
    isOpen,
    onClose,
    visitor,
    localChanges,
    serverVersion,
    onResolve
}) => {
    const getChangedFields = () => {
        const changed: string[] = [];
        if (localChanges.first_name !== undefined && localChanges.first_name !== serverVersion.first_name) {
            changed.push('First Name');
        }
        if (localChanges.last_name !== undefined && localChanges.last_name !== serverVersion.last_name) {
            changed.push('Last Name');
        }
        if (localChanges.email !== undefined && localChanges.email !== serverVersion.email) {
            changed.push('Email');
        }
        if (localChanges.phone !== undefined && localChanges.phone !== serverVersion.phone) {
            changed.push('Phone');
        }
        if (localChanges.status !== undefined && localChanges.status !== serverVersion.status) {
            changed.push('Status');
        }
        if (localChanges.purpose !== undefined && localChanges.purpose !== serverVersion.purpose) {
            changed.push('Purpose');
        }
        if (localChanges.location !== undefined && localChanges.location !== serverVersion.location) {
            changed.push('Location');
        }
        return changed;
    };

    const changedFields = getChangedFields();
    const serverUpdatedAt = new Date(serverVersion.updated_at).toLocaleString();
    const localUpdatedAt = new Date(visitor.updated_at).toLocaleString();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Conflict Detected"
            size="lg"
            draggable={true}
            footer={
                <>
                    <Button
                        variant="subtle"
                        onClick={() => onResolve('cancel')}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onResolve('overwrite')}
                        className="text-[9px] font-black uppercase tracking-widest border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                        Overwrite
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => onResolve('merge')}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        Merge (Recommended)
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-triangle text-amber-400 text-xl mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-black text-amber-400 uppercase tracking-wider mb-2">
                                This visitor was modified by another user
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
                        <div className="bg-white/5 border border-white/5 rounded-md p-3 space-y-2">
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
                        <div className="bg-white/5 border border-white/5 rounded-md p-3 space-y-2">
                            <div className="text-xs text-slate-300">
                                <p><strong>Name:</strong> {serverVersion.first_name} {serverVersion.last_name}</p>
                                <p><strong>Status:</strong> {serverVersion.status}</p>
                                <p><strong>Purpose:</strong> {serverVersion.purpose}</p>
                                <p><strong>Location:</strong> {formatLocationDisplay(serverVersion.location)}</p>
                                <p><strong>Last Updated:</strong> {serverUpdatedAt}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-white/5 rounded-md p-4">
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
            </div>
        </Modal>
    );
};
