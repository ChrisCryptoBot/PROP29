import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { cn } from '../../../../utils/cn';
import { EmergencyAlertCreate, IncidentSeverity, IncidentLocation } from '../../types/incident-log.types';
import { showError, showSuccess } from '../../../../utils/toast';

interface EmergencyAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EMERGENCY_ALERT_TYPES = [
    'Medical Emergency',
    'Fire Emergency',
    'Security Threat',
    'Natural Disaster',
    'Structural Emergency',
    'Other Critical Emergency'
];

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({ isOpen, onClose }) => {
    const { createEmergencyAlert } = useIncidentLogContext();
    const propertyId = localStorage.getItem('propertyId') || '';

    const [formData, setFormData] = useState<Partial<EmergencyAlertCreate>>({
        property_id: propertyId,
        alert_type: '',
        location: {
            area: '',
            latitude: 0,
            longitude: 0
        },
        description: '',
        severity: IncidentSeverity.CRITICAL,
        contact_emergency_services: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (propertyId && !formData.property_id) {
            setFormData(prev => ({ ...prev, property_id: propertyId }));
        }
    }, [propertyId, formData.property_id]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (id === 'alert-location') {
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location!,
                    area: value
                }
            }));
        } else if (id === 'contact-emergency-services') {
            setFormData(prev => ({ ...prev, contact_emergency_services: checked }));
        } else {
            setFormData(prev => ({ ...prev, [id.replace('alert-', '')]: value }));
        }
        // Clear error for this field
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.property_id) {
            newErrors['alert-property_id'] = 'Property is required';
        }
        if (!formData.alert_type) {
            newErrors['alert-alert_type'] = 'Alert type is required';
        }
        if (!formData.location?.area) {
            newErrors['alert-location'] = 'Location is required';
        }
        if (!formData.description || formData.description.trim().length < 10) {
            newErrors['alert-description'] = 'Description must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showError('Please fix the errors in the form');
            return;
        }

        try {
            const alertData: EmergencyAlertCreate = {
                property_id: formData.property_id!,
                alert_type: formData.alert_type!,
                location: formData.location!,
                description: formData.description!,
                severity: formData.severity || IncidentSeverity.CRITICAL,
                contact_emergency_services: formData.contact_emergency_services ?? true
            };

            const result = await createEmergencyAlert(alertData);
            if (result) {
                showSuccess('Emergency alert created successfully!');
                // Reset form
                setFormData({
                    property_id: '',
                    alert_type: '',
                    location: {
                        area: '',
                        latitude: 0,
                        longitude: 0
                    },
                    description: '',
                    severity: IncidentSeverity.CRITICAL,
                    contact_emergency_services: true
                });
                setErrors({});
                onClose();
            }
        } catch (error) {
            // Error is handled by createEmergencyAlert
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Emergency Alert"
            size="lg"
            footer={(
                <>
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="outline"
                        className="text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                        <i className="fas fa-exclamation-triangle mr-2" />
                        Send Emergency Alert
                    </Button>
                </>
            )}
            className="border border-red-500/20"
        >
            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                        <i className="fas fa-exclamation-triangle text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Critical incident requiring immediate attention</p>
                    </div>
                </div>
                    {/* Warning Banner */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5 shadow-2xl">
                                <i className="fas fa-exclamation text-white text-sm" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Emergency Protocol Active</h3>
                                <p className="text-xs text-[color:var(--text-sub)]">
                                    This alert will be immediately broadcasted to all security personnel and emergency services if enabled.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Property ID */}
                        <div>
                            <label htmlFor="alert-property_id" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">
                                Property ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="alert-property_id"
                                value={formData.property_id}
                                onChange={handleChange}
                                readOnly={Boolean(propertyId)}
                                className={cn(
                                    "w-full px-3 py-2 bg-white/5 border rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:bg-white/10",
                                    errors['alert-property_id']
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-white/5 focus:ring-red-500/20"
                                )}
                                placeholder="Enter property UUID"
                            />
                            {errors['alert-property_id'] && (
                                <p className="mt-1 text-sm text-red-400">{errors['alert-property_id']}</p>
                            )}
                        </div>

                        {/* Alert Type */}
                        <div>
                            <label htmlFor="alert-alert_type" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">
                                Emergency Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="alert-alert_type"
                                value={formData.alert_type}
                                onChange={handleChange}
                                className={cn(
                                    "w-full px-3 py-2 bg-white/5 border rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:bg-white/10",
                                    errors['alert-alert_type']
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-white/5 focus:ring-red-500/20"
                                )}
                            >
                                <option value="" className="bg-slate-900">Select emergency type</option>
                                {EMERGENCY_ALERT_TYPES.map(type => (
                                    <option key={type} value={type} className="bg-slate-900">{type}</option>
                                ))}
                            </select>
                            {errors['alert-alert_type'] && (
                                <p className="mt-1 text-sm text-red-400">{errors['alert-alert_type']}</p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="alert-location" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="alert-location"
                                value={formData.location?.area || ''}
                                onChange={handleChange}
                                className={cn(
                                    "w-full px-3 py-2 bg-white/5 border rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:bg-white/10",
                                    errors['alert-location']
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-white/5 focus:ring-red-500/20"
                                )}
                                placeholder="Enter location (e.g., Main Lobby, Room 302, Parking Lot)"
                            />
                            {errors['alert-location'] && (
                                <p className="mt-1 text-sm text-red-400">{errors['alert-location']}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="alert-description" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="alert-description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className={cn(
                                    "w-full px-3 py-2 bg-white/5 border rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:bg-white/10",
                                    errors['alert-description']
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-white/5 focus:ring-red-500/20"
                                )}
                                placeholder="Provide detailed information about the emergency..."
                            />
                            {errors['alert-description'] && (
                                <p className="mt-1 text-sm text-red-400">{errors['alert-description']}</p>
                            )}
                            <p className="mt-1 text-xs text-[color:var(--text-sub)]">Minimum 10 characters required</p>
                        </div>

                        {/* Contact Emergency Services */}
                        <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                id="contact-emergency-services"
                                checked={formData.contact_emergency_services ?? true}
                                onChange={handleChange}
                                className="h-5 w-5 text-red-400 bg-[color:var(--console-dark)] border-white/5 rounded focus:ring-red-500/30"
                            />
                            <label htmlFor="contact-emergency-services" className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">
                                Contact emergency services (police, fire, medical)
                            </label>
                        </div>
                    </div>
            </div>
        </Modal>
    );
};



