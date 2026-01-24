import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { Badge } from '../../../../components/UI/Badge';
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
        getAIClassification,
        aiSuggestion,
        loading
    } = useIncidentLogContext();

    const propertyId = localStorage.getItem('propertyId') || '';

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

    const [showAISuggestion, setShowAISuggestion] = useState(false);

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

    const handleGetAISuggestion = async () => {
        if (!formData.description || !formData.title) return;
        await getAIClassification(formData.title, formData.description, formData.location);
        setShowAISuggestion(true);
    };

    const handleApplyAISuggestion = () => {
        if (aiSuggestion) {
            setFormData(prev => ({
                ...prev,
                incident_type: aiSuggestion.incident_type as IncidentType,
                severity: aiSuggestion.severity as IncidentSeverity
            }));
            setShowAISuggestion(false);
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
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                placeholder="Enter incident title"
                            />
                        </div>

                        <div>
                            <label htmlFor="incident-type" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Type</label>
                            <select
                                id="incident-type"
                                value={formData.incident_type}
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
                            <label htmlFor="incident-severity" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Severity</label>
                            <select
                                id="incident-severity"
                                value={formData.severity}
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
                            <label htmlFor="incident-location" className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Location</label>
                            <input
                                type="text"
                                id="incident-location"
                                value={formData.location?.area}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
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
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            rows={4}
                            placeholder="Enter incident description"
                        />
                    </div>

                    <div className="border border-white/5 bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center text-white border border-white/5 shadow-2xl">
                                    <i className="fas fa-robot"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">AI-Powered Classification</p>
                                    <p className="text-xs text-[color:var(--text-sub)]">Get instant suggestions for incident type and severity</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleGetAISuggestion}
                                disabled={loading.ai || !formData.description}
                                size="sm"
                                variant="outline"
                                className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 uppercase tracking-widest font-black text-[9px]"
                            >
                                {loading.ai ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-magic mr-2"></i>
                                        Get AI Suggestion
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showAISuggestion && aiSuggestion && (
                        <div className="mt-4 bg-white/5 border border-white/5 rounded-xl p-4 shadow-2xl">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/80 to-slate-900 rounded-lg flex items-center justify-center text-white border border-white/5 shadow-2xl">
                                        <i className="fas fa-lightbulb"></i>
                                    </div>
                                    <h4 className="font-bold text-white">AI Suggestion</h4>
                                    <Badge className={cn(
                                        aiSuggestion.confidence >= 0.8 ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                            aiSuggestion.confidence >= 0.6 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                                                "bg-red-500/20 text-red-300 border-red-500/30"
                                    )}>
                                        {(aiSuggestion.confidence * 100).toFixed(0)}% Confidence
                                    </Badge>
                                </div>
                                <button
                                    onClick={() => setShowAISuggestion(false)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Suggested Type</p>
                                    <p className="font-bold text-white capitalize">
                                        {aiSuggestion.incident_type.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg border border-white/5 bg-white/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Suggested Severity</p>
                                    <p className="font-bold text-white">
                                        {aiSuggestion.severity}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 mb-3 rounded-lg border border-white/5 bg-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">AI Reasoning</p>
                                <p className="text-sm text-slate-300">{aiSuggestion.reasoning}</p>
                            </div>

                            <div className="flex items-center justify-end space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAISuggestion(false)}
                                    className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] hover:text-white hover:bg-white/5"
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApplyAISuggestion}
                                    variant="outline"
                                    className="text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                >
                                    <i className="fas fa-check mr-2"></i>
                                    Apply Suggestion
                                </Button>
                            </div>
                        </div>
                    )}
            </div>
        </Modal>
    );
};

export default CreateIncidentModal;



