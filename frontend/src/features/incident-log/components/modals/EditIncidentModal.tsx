import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { Select } from '../../../../components/UI/Select';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { Incident, IncidentUpdate } from '../../types/incident-log.types';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../../types/incident-log.types';
import { showError } from '../../../../utils/toast';
import { incidentService } from '../../services/IncidentService';

interface EditIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident | null;
}

export const EditIncidentModal: React.FC<EditIncidentModalProps> = ({ isOpen, onClose, incident }) => {
    const {
        updateIncident,
        loading
    } = useIncidentLogContext();

    const [formData, setFormData] = useState<Partial<IncidentUpdate>>({});
    const [users, setUsers] = useState<Array<{ user_id: string; name: string; email?: string }>>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [originalUpdatedAt, setOriginalUpdatedAt] = useState<string | null>(null);

    useEffect(() => {
        if (incident) {
            setFormData({
                title: incident.title,
                incident_type: incident.incident_type,
                severity: incident.severity,
                status: incident.status,
                description: incident.description,
                location: incident.location,
                assigned_to: incident.assigned_to
            });
        }
    }, [incident]);

    if (!incident) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;

        if (id === 'edit-location') {
            setFormData(prev => ({
                ...prev,
                location: typeof prev.location === 'object' && prev.location
                    ? { ...prev.location, area: value }
                    : { area: value }
            }));
        } else if (id === 'edit-title') {
            setFormData(prev => ({ ...prev, title: value }));
        } else if (id === 'edit-type') {
            setFormData(prev => ({ ...prev, incident_type: value as any }));
        } else if (id === 'edit-severity') {
            setFormData(prev => ({ ...prev, severity: value as IncidentSeverity }));
        } else if (id === 'edit-status') {
            setFormData(prev => ({ ...prev, status: value as IncidentStatus }));
        } else if (id === 'edit-description') {
            setFormData(prev => ({ ...prev, description: value }));
        }
    };

    const handleSubmit = async () => {
        // Form validation
        if (formData.title !== undefined && (!formData.title || formData.title.trim().length === 0)) {
            showError('Incident title cannot be empty.');
            return;
        }
        if (formData.description !== undefined && (!formData.description || formData.description.trim().length === 0)) {
            showError('Incident description cannot be empty.');
            return;
        }
        if (formData.location && typeof formData.location === 'object' && formData.location.area !== undefined) {
            if (!formData.location.area || String(formData.location.area).trim().length === 0) {
                showError('Location cannot be empty.');
                return;
            }
        }

        const id = incident.incident_id;
        const updates: IncidentUpdate = {
            ...formData,
            ...(formData.title ? { title: formData.title.trim() } : {}),
            ...(formData.description ? { description: formData.description.trim() } : {}),
            ...(formData.location && typeof formData.location === 'object' && formData.location.area
                ? { location: { ...formData.location, area: String(formData.location.area).trim() } }
                : {}),
            // Include original updated_at for conflict detection
            ...(originalUpdatedAt ? { updated_at: originalUpdatedAt } : {})
        };
        const success = await updateIncident(id, updates);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Incident"
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
                        disabled={loading.incidents}
                        variant="glass"
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        {loading.incidents ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Updating...
                            </>
                        ) : (
                            'Update Incident'
                        )}
                    </Button>
                </>
            )}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-title" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Incident Title</label>
                            <input
                                type="text"
                                id="edit-title"
                                value={formData.title || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-type" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Type</label>
                            <select
                                id="edit-type"
                                value={formData.incident_type as string || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
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
                            <label htmlFor="edit-severity" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Severity</label>
                            <select
                                id="edit-severity"
                                value={formData.severity || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            >
                                <option value="LOW" className="bg-slate-900">Low</option>
                                <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                <option value="HIGH" className="bg-slate-900">High</option>
                                <option value="CRITICAL" className="bg-slate-900">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="edit-status" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Status</label>
                            <select
                                id="edit-status"
                                value={formData.status || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            >
                                <option value={IncidentStatus.OPEN} className="bg-slate-900">Active / Open</option>
                                <option value={IncidentStatus.INVESTIGATING} className="bg-slate-900">Investigating</option>
                                <option value={IncidentStatus.RESOLVED} className="bg-slate-900">Resolved</option>
                                <option value={IncidentStatus.CLOSED} className="bg-slate-900">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-description" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Description</label>
                        <textarea
                            id="edit-description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-assigned" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Assign To (User ID)</label>
                            <input
                                type="text"
                                id="edit-assigned"
                                value={formData.assigned_to || ''}
                                onChange={handleChange}
                                placeholder="Enter user ID"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-location" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Location</label>
                            <input
                                type="text"
                                id="edit-location"
                                value={typeof formData.location === 'object' ? (formData.location as any).area : formData.location || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            />
                        </div>
                    </div>
                </div>
        </Modal>
    );
};

export default EditIncidentModal;



