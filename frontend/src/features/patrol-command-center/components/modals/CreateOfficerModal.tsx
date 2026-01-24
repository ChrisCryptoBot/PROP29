
import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { showSuccess, showError } from '../../../../utils/toast';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { usePatrolContext } from '../../context/PatrolContext';
import { PatrolOfficer } from '../../types';

interface CreateOfficerModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingOfficer?: PatrolOfficer | null;
}

export const CreateOfficerModal: React.FC<CreateOfficerModalProps> = ({ isOpen, onClose, editingOfficer }) => {
    const { setOfficers } = usePatrolContext();
    const [name, setName] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [specInput, setSpecInput] = useState('');

    React.useEffect(() => {
        if (editingOfficer) {
            setName(editingOfficer.name);
            // Badge number might not be in the frontend PatrolOfficer type, need to check if we can get it or if we ignore it for edits
            // Assuming for now name contains First Last, which backend splits.
            // Badge number is not explicitly in frontend type PatrolOfficer unless we add it, defaulting to empty or placeholder if not available.
            setBadgeNumber(''); // We don't verify badge number in frontend type yet, might need to add it.
            setSpecializations(editingOfficer.specializations || []);
        } else {
            setName('');
            setBadgeNumber('');
            setSpecializations([]);
        }
    }, [editingOfficer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) { // Badge number kept optional for edit if we don't display it
            if (!editingOfficer && !badgeNumber) {
                showError('Name and Badge Number are required');
                return;
            } else if (!name) {
                showError('Name is required');
                return;
            }
        }

        try {
            if (editingOfficer) {
                // Edit Mode
                const updatedUser = await PatrolEndpoint.updateOfficer(editingOfficer.id, {
                    name,
                    // Only send badge if changed/provided? Backend might not support updating badge number easily if it's unique
                    specializations
                });

                const updatedOfficer: PatrolOfficer = {
                    ...editingOfficer,
                    name: `${updatedUser.first_name} ${updatedUser.last_name}`,
                    specializations: specializations
                };

                setOfficers((prev: PatrolOfficer[]) => prev.map(o => o.id === editingOfficer.id ? updatedOfficer : o));
                showSuccess(`Officer updated successfully`);
            } else {
                // Create Mode
                const newOfficerUser = await PatrolEndpoint.createOfficer({
                    name,
                    badge_number: badgeNumber,
                    specializations: specializations.length > 0 ? specializations : ['General Security']
                });

                const newOfficer: PatrolOfficer = {
                    id: newOfficerUser.user_id,
                    name: `${newOfficerUser.first_name} ${newOfficerUser.last_name}`,
                    status: 'off-duty',
                    location: 'HQ',
                    specializations: specializations.length > 0 ? specializations : ['General Security'],
                    shift: 'Day',
                    experience: '1 year',
                    activePatrols: 0,
                    avatar: name.substring(0, 2).toUpperCase(),
                    lastSeen: new Date().toISOString()
                };

                setOfficers((prev: PatrolOfficer[]) => [...prev, newOfficer]);
                showSuccess(`Officer ${name} added successfully`);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save officer:', error);
            showError('Failed to save officer.');
        }
    };

    const addSpecialization = () => {
        if (specInput && !specializations.includes(specInput)) {
            setSpecializations([...specializations, specInput]);
            setSpecInput('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingOfficer ? 'Edit Officer' : 'Register Officer'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="e.g., Officer John Doe"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Badge Number</label>
                    <input
                        type="text"
                        value={badgeNumber}
                        onChange={e => setBadgeNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="e.g., SEC-8821"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Specializations</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={specInput}
                            onChange={e => setSpecInput(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., K9 Unit"
                        />
                        <Button type="button" onClick={addSpecialization} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {specializations.map(spec => (
                            <span key={spec} className="px-2 py-1 bg-white/5 text-white/70 text-xs rounded border border-white/10 font-mono">
                                {spec}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="text-xs font-black uppercase tracking-widest">
                        {editingOfficer ? 'Update Officer' : 'Register Officer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
