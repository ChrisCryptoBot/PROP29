import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { ParkingSpace } from '../../types/parking.types';

interface RegisterGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<any>;
    availableSpaces: ParkingSpace[];
}

const SPACE_TYPE_LABELS: Record<string, string> = {
    regular: 'Standard',
    accessible: 'Accessible',
    ev: 'EV',
    staff: 'Staff',
    valet: 'Valet'
};

export const RegisterGuestModal: React.FC<RegisterGuestModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    availableSpaces
}) => {
    const [formData, setFormData] = useState({
        guestId: '',
        guestName: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleColor: '',
        vehiclePlate: '',
        spaceId: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                guestId: '',
                guestName: '',
                vehicleMake: '',
                vehicleModel: '',
                vehicleColor: '',
                vehiclePlate: '',
                spaceId: '',
                notes: ''
            });
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.guestName || !formData.vehiclePlate || !formData.spaceId) return;
        try {
            await onSubmit(formData);
            onClose();
        } catch {
            // Error surfaced via context/toast where applicable
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Register Guest Parking"
            size="sm"
            footer={
                <div className="flex justify-end space-x-3">
                    <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                        Register Guest
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Guest Name</label>
                    <input
                        type="text"
                        value={formData.guestName}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        placeholder="Guest name"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Vehicle Make</label>
                        <input
                            type="text"
                            value={formData.vehicleMake}
                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., Toyota"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Vehicle Model</label>
                        <input
                            type="text"
                            value={formData.vehicleModel}
                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., Camry"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Vehicle Color</label>
                        <input
                            type="text"
                            value={formData.vehicleColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., White"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">License Plate</label>
                        <input
                            type="text"
                            value={formData.vehiclePlate}
                            onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            placeholder="e.g., ABC-123"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Parking Space</label>
                    <select
                        value={formData.spaceId}
                        onChange={(e) => setFormData(prev => ({ ...prev, spaceId: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                    >
                        <option value="">Select a space</option>
                        {availableSpaces.map((space) => (
                            <option key={space.id} value={space.id}>
                                {space.number} - {SPACE_TYPE_LABELS[space.type] || space.type} (Zone {space.zone})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        rows={3}
                        placeholder="Special requirements or notes"
                    />
                </div>
            </div>
        </Modal>
    );
};



