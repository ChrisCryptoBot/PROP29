import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { PatrolTemplate } from '../../types';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';

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
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) {
            newErrors.name = 'Template name is required';
        }
        if (!form.routeId) {
            newErrors.routeId = 'Route is required';
        }
        if (!form.schedule.startTime) {
            newErrors.startTime = 'Start time is required';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const toastId = showLoading(initialData ? 'Updating template...' : 'Creating template...');
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
                const response = await retryWithBackoff(
                    () => PatrolEndpoint.updateTemplate(initialData.id, payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );
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
                dismissLoadingAndShowSuccess(toastId, 'Template updated successfully');
            } else {
                // Create
                const response = await retryWithBackoff(
                    () => PatrolEndpoint.createTemplate(payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );
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
                dismissLoadingAndShowSuccess(toastId, 'Template created successfully');
            }
            onClose();
            setErrors({});
        } catch (error) {
            ErrorHandlerService.handle(error, initialData ? 'updateTemplate' : 'createTemplate');
            dismissLoadingAndShowError(toastId, `Failed to ${initialData ? 'update' : 'create'} template. Please try again.`);
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Patrol Template' : 'Create Patrol Template'}
            className="max-w-3xl"
        >

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                        Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500 ${
                            errors.name ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                        }`}
                        value={form.name}
                        onChange={e => {
                            setForm({ ...form, name: e.target.value });
                            if (errors.name) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.name;
                                    return newErrors;
                                });
                            }
                        }}
                        placeholder="e.g., Perimeter Alpha"
                    />
                    {errors.name && (
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Objectives</label>
                    <textarea
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the patrol objectives..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                            Route <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono ${
                                errors.routeId ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                            }`}
                            value={form.routeId}
                            onChange={e => {
                                setForm({ ...form, routeId: e.target.value });
                                if (errors.routeId) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.routeId;
                                        return newErrors;
                                    });
                                }
                            }}
                        >
                            <option value="" className="bg-slate-900">Select a route</option>
                            {routes.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                        </select>
                        {errors.routeId && (
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.routeId}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Priority</label>
                        <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
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
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                            Start Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono ${
                                errors.startTime ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                            }`}
                            value={form.schedule.startTime}
                            onChange={e => {
                                setForm({ ...form, schedule: { ...form.schedule, startTime: e.target.value } });
                                if (errors.startTime) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.startTime;
                                        return newErrors;
                                    });
                                }
                            }}
                        />
                        {errors.startTime && (
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.startTime}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">End Time</label>
                        <input
                            type="time"
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
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
                        className="w-5 h-5 rounded border-white/5 bg-white/5 text-blue-600 focus:ring-blue-500/50"
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
