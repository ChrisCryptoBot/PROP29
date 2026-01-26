import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { Avatar } from '../../../../components/UI/Avatar';

interface ReassignOfficerModalProps {
    isOpen: boolean;
    onClose: () => void;
    patrolId: string;
}

export const ReassignOfficerModal: React.FC<ReassignOfficerModalProps> = ({ isOpen, onClose, patrolId }) => {
    const { officers, handleReassignOfficer } = usePatrolContext();
    const [selectedOfficerId, setSelectedOfficerId] = useState('');

    const handleSubmit = async () => {
        if (!selectedOfficerId) {
            showError('Select an officer');
            return;
        }
        await handleReassignOfficer(patrolId, selectedOfficerId);
        onClose();
    };

    // Filter available officers (e.g., on-duty or available for reassign)
    // For simplicity, showing all officers except unavailable
    const availableOfficers = officers.filter(o => o.status !== 'unavailable');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reassign Officer"
            className="max-w-lg"
        >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {availableOfficers.map(officer => (
                    <div
                        key={officer.id}
                        onClick={() => setSelectedOfficerId(officer.id)}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${selectedOfficerId === officer.id
                                ? 'border-blue-500/50 bg-blue-500/10'
                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <Avatar className="h-10 w-10 mr-4 ring-2 ring-white/10">
                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-slate-700 to-slate-800 text-white font-bold text-sm">
                                {officer.avatar || officer.name[0]}
                            </div>
                        </Avatar>
                        <div className="flex-1">
                            <p className={`font-bold ${selectedOfficerId === officer.id ? 'text-blue-300' : 'text-white'}`}>{officer.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${officer.status === 'on-duty' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                                <span>{officer.status}</span>
                                <span className="text-slate-600">•</span>
                                <span>{officer.location}</span>
                            </p>
                        </div>
                        {selectedOfficerId === officer.id && <i className="fas fa-check-circle text-blue-400"></i>}
                    </div>
                ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    Confirm Reassignment
                </Button>
            </div>
        </Modal>
    );
};
