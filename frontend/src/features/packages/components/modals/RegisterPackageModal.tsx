/**
 * Register Package Modal
 * Modal for registering a new package
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { useAuth } from '../../../../contexts/AuthContext';
import type { PackageCreate } from '../../types/package.types';
import { PackageStatus } from '../../types/package.types';

export interface RegisterPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RegisterPackageModal: React.FC<RegisterPackageModalProps> = React.memo(({
    isOpen,
    onClose
}) => {
    const { createPackage, loading } = usePackageContext();
    const { user } = useAuth();

    const [formData, setFormData] = useState<Partial<PackageCreate>>({
        tracking_number: '',
        sender_name: '',
        sender_contact: '',
        description: '',
        size: '',
        weight: undefined,
        location: {
            area: '',
            floor: '',
            building: '',
            room: ''
        },
        notes: ''
    });

    const [isFormDirty, setIsFormDirty] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setFormData({
                tracking_number: '',
                sender_name: '',
                sender_contact: '',
                description: '',
                size: '',
                weight: undefined,
                location: {
                    area: '',
                    floor: '',
                    building: '',
                    room: ''
                },
                notes: ''
            });
            setIsFormDirty(false);
        }
    }, [isOpen]);

    const handleChange = (field: keyof PackageCreate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsFormDirty(true);
    };

    const handleLocationChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [field]: value
            }
        }));
        setIsFormDirty(true);
    };

    const handleSubmit = async () => {
        if (!formData.tracking_number || !formData.sender_name) {
            return;
        }

        // Get property_id from user (in real implementation)
        const propertyId = user?.roles?.[0] || 'default-property-id';

        const packageData: PackageCreate = {
            property_id: propertyId,
            tracking_number: formData.tracking_number || '',
            sender_name: formData.sender_name || '',
            sender_contact: formData.sender_contact,
            description: formData.description,
            size: formData.size,
            weight: formData.weight,
            location: formData.location && Object.values(formData.location).some(v => v) ? formData.location : undefined,
            notes: formData.notes
        };

        const result = await createPackage(packageData);
        if (result) {
            onClose();
        }
    };

    const [showUnsavedCloseConfirm, setShowUnsavedCloseConfirm] = useState(false);

    const handleClose = () => {
        if (isFormDirty) {
            setShowUnsavedCloseConfirm(true);
            return;
        }
        onClose();
    };

    const handleCloseAnyway = () => {
        setShowUnsavedCloseConfirm(false);
        onClose();
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Register New Package"
            size="lg"
        >
            <div className="space-y-4">
                {/* Tracking Number */}
                <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Tracking Number <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.tracking_number || ''}
                        onChange={(e) => handleChange('tracking_number', e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        required
                    />
                </div>

                {/* Sender Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                            Sender Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.sender_name || ''}
                            onChange={(e) => handleChange('sender_name', e.target.value)}
                            placeholder="Enter sender name"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                            required
                        />
                    </div>
                    <div>

                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                            Sender Contact
                        </label>
                        <input
                            type="text"
                            value={formData.sender_contact || ''}
                            onChange={(e) => handleChange('sender_contact', e.target.value)}
                            placeholder="Phone or email"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Description
                    </label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Package description"
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors resize-none"
                    />
                </div>

                {/* Size and Weight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                            Size
                        </label>
                        <input
                            type="text"
                            value={formData.size || ''}
                            onChange={(e) => handleChange('size', e.target.value)}
                            placeholder="e.g., small, medium, large"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                            Weight (lbs)
                        </label>
                        <input
                            type="number"
                            value={formData.weight || ''}
                            onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="Weight"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Location
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                            type="text"
                            value={formData.location?.building || ''}
                            onChange={(e) => handleLocationChange('building', e.target.value)}
                            placeholder="Building"
                            className="px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                        <input
                            type="text"
                            value={formData.location?.floor || ''}
                            onChange={(e) => handleLocationChange('floor', e.target.value)}
                            placeholder="Floor"
                            className="px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                        <input
                            type="text"
                            value={formData.location?.area || ''}
                            onChange={(e) => handleLocationChange('area', e.target.value)}
                            placeholder="Area"
                            className="px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                        <input
                            type="text"
                            value={formData.location?.room || ''}
                            onChange={(e) => handleLocationChange('room', e.target.value)}
                            placeholder="Room"
                            className="px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Notes
                    </label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Additional notes"
                        rows={2}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading.packages}
                        className="border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading.packages || !formData.tracking_number || !formData.sender_name}
                        variant="primary" className=""
                    >
                        {loading.packages ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check mr-2" />
                                Register Package
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>

        {/* Unsaved changes confirmation */}
        <Modal
            isOpen={showUnsavedCloseConfirm}
            onClose={() => setShowUnsavedCloseConfirm(false)}
            title="Unsaved changes"
            size="sm"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowUnsavedCloseConfirm(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCloseAnyway}>
                        Close anyway
                    </Button>
                </div>
            }
        >
            <p className="text-slate-300">
                You have unsaved changes. Are you sure you want to close?
            </p>
        </Modal>
        </>
    );
});

RegisterPackageModal.displayName = 'RegisterPackageModal';


