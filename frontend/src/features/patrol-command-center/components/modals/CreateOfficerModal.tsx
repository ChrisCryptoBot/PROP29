
import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { usePatrolContext } from '../../context/PatrolContext';
import { PatrolOfficer } from '../../types';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';

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
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!editingOfficer && !badgeNumber.trim()) {
            newErrors.badgeNumber = 'Badge number is required';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const toastId = showLoading(editingOfficer ? 'Updating officer...' : 'Creating officer...');
        try {
            if (editingOfficer) {
                // Edit Mode
                const updatedUser = await retryWithBackoff(
                    () => PatrolEndpoint.updateOfficer(editingOfficer.id, {
                        name,
                        specializations
                    }),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );

                const updatedOfficer: PatrolOfficer = {
                    ...editingOfficer,
                    name: `${updatedUser.first_name} ${updatedUser.last_name}`,
                    specializations: specializations
                };

                setOfficers((prev: PatrolOfficer[]) => prev.map(o => o.id === editingOfficer.id ? updatedOfficer : o));
                dismissLoadingAndShowSuccess(toastId, `Officer updated successfully`);
            } else {
                // Create Mode
                const newOfficerUser = await retryWithBackoff(
                    () => PatrolEndpoint.createOfficer({
                        name,
                        badge_number: badgeNumber,
                        specializations: specializations.length > 0 ? specializations : ['General Security']
                    }),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );

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
                dismissLoadingAndShowSuccess(toastId, `Officer ${name} added successfully`);
            }
            onClose();
            setErrors({});
        } catch (error) {
            ErrorHandlerService.handle(error, editingOfficer ? 'updateOfficer' : 'createOfficer');
            dismissLoadingAndShowError(toastId, 'Failed to save officer. Please try again.');
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        if (field === 'name') setName(value);
        if (field === 'badgeNumber') setBadgeNumber(value);
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
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => handleFieldChange('name', e.target.value)}
                        className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500 ${
                            errors.name ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                        }`}
                        placeholder="e.g., Officer John Doe"
                    />
                    {errors.name && (
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
                    )}
                </div>
                {!editingOfficer && (
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                            Badge Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={badgeNumber}
                            onChange={e => handleFieldChange('badgeNumber', e.target.value)}
                            className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500 ${
                                errors.badgeNumber ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                            }`}
                            placeholder="e.g., SEC-8821"
                        />
                        {errors.badgeNumber && (
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.badgeNumber}</p>
                        )}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Specializations</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={specInput}
                            onChange={e => setSpecInput(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., K9 Unit"
                        />
                        <Button type="button" onClick={addSpecialization} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {specializations.map(spec => (
                            <span key={spec} className="px-2 py-1 bg-white/5 text-white/70 text-xs rounded border border-white/5 font-mono">
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
