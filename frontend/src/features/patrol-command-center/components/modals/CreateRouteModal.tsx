import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { PatrolRoute } from '../../types';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';

interface CreateRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: PatrolRoute | null;
}

const DEFAULT_FORM: Omit<PatrolRoute, 'id' | 'checkpoints' | 'createdAt' | 'updatedAt'> = {
    name: '',
    description: '',
    estimatedDuration: '',
    difficulty: 'medium',
    frequency: 'hourly',
    isActive: true,
    performanceScore: 100,
    lastUsed: ''
};

export const CreateRouteModal: React.FC<CreateRouteModalProps> = ({ isOpen, onClose, initialData }) => {
    const { setRoutes, selectedPropertyId } = usePatrolContext();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name,
                description: initialData.description,
                estimatedDuration: initialData.estimatedDuration,
                difficulty: initialData.difficulty,
                frequency: initialData.frequency,
                isActive: initialData.isActive,
                performanceScore: initialData.performanceScore,
                lastUsed: initialData.lastUsed
            });
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) {
            newErrors.name = 'Route name is required';
        }
        if (!form.estimatedDuration) {
            newErrors.estimatedDuration = 'Duration is required';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const toastId = showLoading(initialData ? 'Updating route...' : 'Creating route...');
        try {
            if (initialData) {
                // Update
                const updatePayload = {
                    ...form,
                    checkpoints: initialData.checkpoints || []
                };

                const response = await retryWithBackoff(
                    () => PatrolEndpoint.updateRoute(initialData.id, updatePayload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );

                // Map Data
                const updatedRoute: PatrolRoute = {
                    id: response.route_id,
                    name: response.name,
                    description: response.description,
                    checkpoints: response.checkpoints || [],
                    estimatedDuration: response.estimated_duration,
                    difficulty: response.difficulty,
                    frequency: response.frequency,
                    isActive: response.is_active,
                    lastUsed: response.updated_at,
                    performanceScore: 90
                };

                setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
                dismissLoadingAndShowSuccess(toastId, 'Route updated successfully');
            } else {
                // Create
                const createPayload = {
                    ...form,
                    property_id: selectedPropertyId || undefined,
                    checkpoints: []
                };

                const response = await retryWithBackoff(
                    () => PatrolEndpoint.createRoute(createPayload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );

                // Map Data
                const newRoute: PatrolRoute = {
                    id: response.route_id,
                    name: response.name,
                    description: response.description,
                    checkpoints: response.checkpoints || [],
                    estimatedDuration: response.estimated_duration,
                    difficulty: response.difficulty,
                    frequency: response.frequency,
                    isActive: response.is_active,
                    lastUsed: response.updated_at,
                    performanceScore: 90
                };

                setRoutes(prev => [...prev, newRoute]);
                dismissLoadingAndShowSuccess(toastId, 'Route created successfully');
            }
            onClose();
            setErrors({});
        } catch (error) {
            ErrorHandlerService.handle(error, initialData ? 'updateRoute' : 'createRoute');
            dismissLoadingAndShowError(toastId, `Failed to ${initialData ? 'update' : 'create'} route. Please try again.`);
        }
    };

    const handleFieldChange = (field: keyof typeof form, value: any) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Route' : 'Create Route'}
            className="max-w-2xl"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500 ${
                            errors.name ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                        }`}
                        value={form.name}
                        onChange={e => handleFieldChange('name', e.target.value)}
                        placeholder="Route Name"
                    />
                    {errors.name && (
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
                    )}
                </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Description</label>
                        <textarea
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            placeholder="Brief description of the patrol route..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                                Duration <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono ${
                                    errors.estimatedDuration ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                                }`}
                                value={form.estimatedDuration}
                                onChange={e => handleFieldChange('estimatedDuration', e.target.value)}
                            >
                                <option value="" className="bg-slate-900">Select Duration</option>
                                <option value="15 min" className="bg-slate-900">15 min</option>
                                <option value="30 min" className="bg-slate-900">30 min</option>
                                <option value="45 min" className="bg-slate-900">45 min</option>
                                <option value="60 min" className="bg-slate-900">60 min</option>
                            </select>
                            {errors.estimatedDuration && (
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.estimatedDuration}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Difficulty</label>
                            <select
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                                value={form.difficulty}
                                onChange={e => setForm({ ...form, difficulty: e.target.value as any })}
                            >
                                <option value="easy" className="bg-slate-900">Easy</option>
                                <option value="medium" className="bg-slate-900">Medium</option>
                                <option value="hard" className="bg-slate-900">Hard</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Frequency</label>
                        <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                            value={form.frequency}
                            onChange={e => setForm({ ...form, frequency: e.target.value as any })}
                        >
                            <option value="hourly" className="bg-slate-900">Hourly</option>
                            <option value="daily" className="bg-slate-900">Daily</option>
                            <option value="weekly" className="bg-slate-900">Weekly</option>
                        </select>
                    </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    {initialData ? 'Update Route' : 'Create Route'}
                </Button>
            </div>
        </Modal>
    );
};
