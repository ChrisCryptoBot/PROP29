import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { ParkingSpace } from '../../types/parking.types';

interface AddSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ParkingSpace, 'id'>) => Promise<any>;
}

export const AddSpaceModal: React.FC<AddSpaceModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        number: '',
        type: 'regular' as ParkingSpace['type'],
        zone: '',
        status: 'available' as ParkingSpace['status']
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                number: '',
                type: 'regular',
                zone: '',
                status: 'available'
            });
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.number || !formData.zone) return;
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Failed to add space:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Parking Space" size="sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Space Number</label>
                    <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="e.g., P001"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Space Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ParkingSpace['type'] }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                    >
                        <option value="regular">Standard</option>
                        <option value="accessible">Accessible</option>
                        <option value="ev">EV</option>
                        <option value="staff">Staff</option>
                        <option value="valet">Valet</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Zone</label>
                    <input
                        type="text"
                        value={formData.zone}
                        onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="e.g., A, B, C"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    Add Space
                </Button>
            </div>
        </Modal>
    );
};



