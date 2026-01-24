import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';

interface CheckpointCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    patrolId: string;
    checkpointId: string;
}

export const CheckpointCheckInModal: React.FC<CheckpointCheckInModalProps> = ({ isOpen, onClose, patrolId, checkpointId }) => {
    const { handleCheckpointCheckIn } = usePatrolContext();
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        await handleCheckpointCheckIn(patrolId, checkpointId, notes);
        showSuccess('Check-in successful');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Checkpoint Check-In"
            size="sm"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Notes (Optional)</label>
                    <textarea
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        rows={4}
                        placeholder="Add observations or notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    Confirm Check-In
                </Button>
            </div>
        </Modal>
    );
};
