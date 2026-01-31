import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { cn } from '../../../../utils/cn';
import { IncidentCreate, IncidentSeverity, IncidentStatus, IncidentType } from '../../types/incident-log.types';
import { showError } from '../../../../utils/toast';
import { IdGeneratorService } from '../../../../services/IdGeneratorService';

interface CreateIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({ isOpen, onClose }) => {
    const {
        createIncident,
        loading,
        propertyId
    } = useIncidentLogContext();

    const [formData, setFormData] = useState<Partial<IncidentCreate>>({
        title: '',
        incident_type: IncidentType.DISTURBANCE as IncidentType,
        severity: IncidentSeverity.MEDIUM,
        location: {
            area: '',
            latitude: 0,
            longitude: 0
        },
        description: ''
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;

        if (id === 'incident-location') {
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location!,
                    area: value
                }
            }));
        } else if (id === 'incident-title') {
            setFormData(prev => ({ ...prev, title: value }));
        } else if (id === 'incident-type') {
            setFormData(prev => ({ ...prev, incident_type: value as IncidentType }));
        } else if (id === 'incident-severity') {
            setFormData(prev => ({ ...prev, severity: value as IncidentSeverity }));
        } else if (id === 'incident-description') {
            setFormData(prev => ({ ...prev, description: value }));
        }
    };


    const handleSubmit = async () => {
        // Form validation
        if (!propertyId) {
            showError('Property selection is required before creating an incident.');
            return;
        }
        if (!formData.title || formData.title.trim().length === 0) {
            showError('Incident title is required.');
            return;
        }
        if (!formData.description || formData.description.trim().length === 0) {
            showError('Incident description is required.');
            return;
        }
        if (!formData.location?.area || formData.location.area.trim().length === 0) {
            showError('Location is required.');
            return;
        }
        if (!formData.incident_type) {
            showError('Incident type is required.');
            return;
        }
        if (!formData.severity) {
            showError('Severity is required.');
            return;
        }

        // Generate idempotency key for duplicate submission protection
        const idempotencyKey = IdGeneratorService.generateUUID();
        const payload: IncidentCreate = {
            property_id: propertyId,
            idempotency_key: idempotencyKey,
            incident_type: formData.incident_type as IncidentType,
            severity: formData.severity as IncidentSeverity,
            title: formData.title.trim(),
            description: formData.description.trim(),
            location: {
                ...formData.location,
                area: formData.location!.area!.trim()
            },
            assigned_to: formData.assigned_to,
            evidence: formData.evidence,
            witnesses: formData.witnesses
        };
        const success = await createIncident(payload);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Incident"
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
                        disabled={loading.incidents || !formData.title || !formData.description || !formData.location?.area}
                        variant="glass"
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        {loading.incidents ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Creating...
                            </>
                        ) : (
                            'Create Incident'
                        )}
                    </Button>
                </>
            )}
        >
            <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="incident-title" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Incident Title</label>
                            <input
                                type="text"
                                id="incident-title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                placeholder="Enter incident title"
                            />
                        </div>

                        <div>
                            <label htmlFor="incident-type" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Type</label>
                            <select
                                id="incident-type"
                                value={formData.incident_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            >
                                <option value={IncidentType.THEFT} className="bg-slate-900">Theft</option>
                                <option value={IncidentType.DISTURBANCE} className="bg-slate-900">Security Disturbance</option>
                                <option value={IncidentType.MEDICAL} className="bg-slate-900">Medical Emergency</option>
                                <option value={IncidentType.FIRE} className="bg-slate-900">Fire Safety</option>
                                <option value={IncidentType.FLOOD} className="bg-slate-900">Flood / Facility</option>
                                <option value={IncidentType.CYBER} className="bg-slate-900">Cyber Incident</option>
                                <option value={IncidentType.GUEST_COMPLAINT} className="bg-slate-900">Guest Complaint</option>
                                <option value={IncidentType.OTHER} className="bg-slate-900">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="incident-severity" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Severity</label>
                            <select
                                id="incident-severity"
                                value={formData.severity}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            >
                                <option value="LOW" className="bg-slate-900">Low</option>
                                <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                <option value="HIGH" className="bg-slate-900">High</option>
                                <option value="CRITICAL" className="bg-slate-900">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="incident-location" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Location</label>
                            <input
                                type="text"
                                id="incident-location"
                                value={formData.location?.area}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                placeholder="Enter location (e.g., Lobby, Room 302)"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="incident-description" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Description</label>
                        <textarea
                            id="incident-description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            rows={4}
                            placeholder="Enter incident description"
                        />
                    </div>

            </div>
        </Modal>
    );
};

export default CreateIncidentModal;



