import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { PatrolTemplate } from '../../types';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { patrolAI } from '../../../../services/PatrolAIService';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: PatrolTemplate | null;
}

const DEFAULT_FORM: Omit<PatrolTemplate, 'id'> = {
    name: '',
    description: '',
    routeId: '',
    assignedOfficers: [],
    schedule: {
        startTime: '',
        endTime: '',
        days: []
    },
    priority: 'medium',
    isRecurring: false
};

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose, initialData }) => {
    const { routes, upcomingPatrols, setTemplates, selectedPropertyId } = usePatrolContext();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name,
                description: initialData.description,
                routeId: initialData.routeId,
                assignedOfficers: initialData.assignedOfficers,
                schedule: initialData.schedule,
                priority: initialData.priority,
                isRecurring: initialData.isRecurring
            });
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async () => {
        if (!form.name || !form.routeId || !form.schedule.startTime) {
            showError('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                name: form.name,
                description: form.description,
                property_id: selectedPropertyId || undefined,
                route_id: form.routeId,
                assigned_officers: form.assignedOfficers,
                schedule: form.schedule,
                priority: form.priority,
                is_recurring: form.isRecurring
            };

            if (initialData) {
                // Update
                const response = await PatrolEndpoint.updateTemplate(initialData.id, payload);
                const updatedTemplate: PatrolTemplate = {
                    id: response.template_id,
                    name: response.name,
                    description: response.description,
                    routeId: response.route_id,
                    assignedOfficers: response.assigned_officers || [],
                    schedule: response.schedule || {},
                    priority: response.priority,
                    isRecurring: response.is_recurring
                };

                setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
                showSuccess('Template updated successfully');
            } else {
                // Create
                const response = await PatrolEndpoint.createTemplate(payload);
                const newTemplate: PatrolTemplate = {
                    id: response.template_id,
                    name: response.name,
                    description: response.description,
                    routeId: response.route_id,
                    assignedOfficers: response.assigned_officers || [],
                    schedule: response.schedule || {},
                    priority: response.priority,
                    isRecurring: response.is_recurring
                };

                setTemplates(prev => [...prev, newTemplate]);
                showSuccess('Template created successfully');
            }
            onClose();
        } catch (error) {
            console.error(error);
            showError(`Failed to ${initialData ? 'update' : 'create'} template`);
        }
    };

    const loadAiSuggestions = async () => {
        setIsLoadingAI(true);
        try {
            // Mock AI service call
            const suggestions = await patrolAI.suggestTemplates(upcomingPatrols as any[], []);
            setAiSuggestions(suggestions);
            if (suggestions.length === 0) showSuccess('No AI suggestions available');
        } catch (err) {
            showError('Failed to load AI suggestions');
        } finally {
            setIsLoadingAI(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Patrol Template' : 'Create Patrol Template'}
            className="max-w-3xl"
        >
            {/* AI Suggestions Section (Only for Create) */}
            {!initialData && (
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            AI Suggestions
                        </h4>
                        <Button
                            size="sm"
                            variant="subtle"
                            onClick={loadAiSuggestions}
                            disabled={isLoadingAI}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            {isLoadingAI ? 'Analyzing...' : 'Auto-Generate'}
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {aiSuggestions.map((suggestion, idx) => (
                            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all group">
                                <div>
                                    <p className="font-black text-white text-xs uppercase tracking-widest">{suggestion.name}</p>
                                    <div className="flex gap-3 mt-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/5 text-white/70 px-2 py-0.5 rounded border border-white/10">
                                            {suggestion.confidence}% Reliability
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                            {suggestion.priority} priority
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const matchingRoute = routes.find(r => r.name.includes(suggestion.suggestedRoute?.split(' ')[0] || ''));
                                        if (matchingRoute) {
                                            setForm(prev => ({
                                                ...prev,
                                                name: suggestion.name,
                                                description: suggestion.description,
                                                routeId: matchingRoute.id,
                                                schedule: { ...prev.schedule, startTime: suggestion.suggestedTime?.split(' - ')[0] || '08:00', endTime: suggestion.suggestedTime?.split(' - ')[1] || '16:00' },
                                                priority: suggestion.priority
                                            }));
                                            showSuccess('Suggestion applied');
                                        } else {
                                            showError('No matching route found for suggestion');
                                        }
                                    }}
                                    variant="primary"
                                    className="text-[10px] font-black uppercase tracking-widest px-4 h-9"
                                >
                                    Apply
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Template Name</label>
                    <input
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., Perimeter Alpha"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Objectives</label>
                    <textarea
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the patrol objectives..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Route</label>
                        <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                            value={form.routeId}
                            onChange={e => setForm({ ...form, routeId: e.target.value })}
                        >
                            <option value="" className="bg-slate-900">Select a route</option>
                            {routes.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Priority</label>
                        <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                            value={form.priority}
                            onChange={e => setForm({ ...form, priority: e.target.value as any })}
                        >
                            <option value="low" className="bg-slate-900">Low</option>
                            <option value="medium" className="bg-slate-900">Medium</option>
                            <option value="high" className="bg-slate-900">High</option>
                            <option value="critical" className="bg-slate-900">Critical</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Start Time</label>
                        <input
                            type="time"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                            value={form.schedule.startTime}
                            onChange={e => setForm({ ...form, schedule: { ...form.schedule, startTime: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">End Time</label>
                        <input
                            type="time"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                            value={form.schedule.endTime}
                            onChange={e => setForm({ ...form, schedule: { ...form.schedule, endTime: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest text-white">Recurring</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Repeat schedule automatically</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={form.isRecurring}
                        onChange={e => setForm({ ...form, isRecurring: e.target.checked })}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    {initialData ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </Modal>
    );
};
