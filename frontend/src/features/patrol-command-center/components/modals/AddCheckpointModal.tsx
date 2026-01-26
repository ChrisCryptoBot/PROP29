import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { Checkpoint, PatrolRoute } from '../../types';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';

interface AddCheckpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Checkpoint | null;
}

const DEFAULT_FORM: Omit<Checkpoint, 'id' | 'status'> = {
    name: '',
    location: '',
    type: 'security',
    requiredActions: [],
    estimatedTime: 5,
    isCritical: false,
    coordinates: { lat: 0, lng: 0 }
};

export const AddCheckpointModal: React.FC<AddCheckpointModalProps> = ({ isOpen, onClose, initialData }) => {
    const { routes, setRoutes } = usePatrolContext();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name,
                location: initialData.location,
                type: initialData.type,
                requiredActions: initialData.requiredActions,
                estimatedTime: initialData.estimatedTime,
                isCritical: initialData.isCritical,
                coordinates: initialData.coordinates
            });
            // Find parent route
            const parent = routes.find(r => r.checkpoints.some(c => c.id === initialData.id));
            if (parent) setSelectedRouteId(parent.id);
        } else {
            setForm(DEFAULT_FORM);
            if (routes.length > 0) setSelectedRouteId(routes[0].id);
        }
    }, [initialData, isOpen, routes]);

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!selectedRouteId) {
            newErrors.routeId = 'Please select a route';
        }
        if (!form.name.trim()) {
            newErrors.name = 'Checkpoint name is required';
        }
        if (!form.location.trim()) {
            newErrors.location = 'Location is required';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const route = routes.find(r => r.id === selectedRouteId);
        if (!route) {
            showError('Selected route not found');
            return;
        }

        // Validate checkpoint coordinates if provided
        if (form.coordinates && (typeof form.coordinates.lat !== 'number' || typeof form.coordinates.lng !== 'number')) {
            showError('Invalid checkpoint coordinates');
            return;
        }

        const newCheckpoint: Checkpoint = {
            id: initialData?.id || crypto.randomUUID(),
            status: 'pending',
            ...form
        };

        let updatedCheckpoints = [...(route.checkpoints || [])];
        if (initialData) {
            updatedCheckpoints = updatedCheckpoints.map(cp => cp.id === newCheckpoint.id ? newCheckpoint : cp);
        } else {
            updatedCheckpoints.push(newCheckpoint);
        }

        const toastId = showLoading(initialData ? 'Updating checkpoint...' : 'Adding checkpoint...');
        try {
            // Update Route in Backend
            const response = await retryWithBackoff(
                () => PatrolEndpoint.updateRoute(selectedRouteId, {
                    checkpoints: updatedCheckpoints
                }),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );

            // Map and Update Local State
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
            dismissLoadingAndShowSuccess(toastId, `Checkpoint ${initialData ? 'updated' : 'added'} successfully`);
            onClose();
            setErrors({});
        } catch (error) {
            ErrorHandlerService.handle(error, initialData ? 'updateCheckpoint' : 'createCheckpoint');
            dismissLoadingAndShowError(toastId, 'Failed to save checkpoint. Please try again.');
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
            title={initialData ? 'Edit Checkpoint' : 'Add Checkpoint'}
            className="max-w-xl"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                        Route <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono ${
                            errors.routeId ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                        }`}
                        value={selectedRouteId}
                        onChange={e => {
                            setSelectedRouteId(e.target.value);
                            if (errors.routeId) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.routeId;
                                    return newErrors;
                                });
                            }
                        }}
                        disabled={!!initialData}
                    >
                        <option value="" className="bg-slate-900">Select Route</option>
                        {routes.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                    </select>
                    {errors.routeId && (
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.routeId}</p>
                    )}
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                placeholder="Checkpoint Name"
                            />
                            {errors.name && (
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                className={`w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500 ${
                                    errors.location ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/5 focus:ring-blue-500/20'
                                }`}
                                value={form.location}
                                onChange={e => handleFieldChange('location', e.target.value)}
                                placeholder="Location description"
                            />
                            {errors.location && (
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.location}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Type</label>
                            <select
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value as any })}
                            >
                                <option value="security" className="bg-slate-900">Security</option>
                                <option value="safety" className="bg-slate-900">Safety</option>
                                <option value="maintenance" className="bg-slate-900">Maintenance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Estimated Time (min)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                                value={form.estimatedTime}
                                onChange={e => setForm({ ...form, estimatedTime: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={form.isCritical}
                            onChange={e => setForm({ ...form, isCritical: e.target.checked })}
                            className="w-5 h-5 rounded border-white/5 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                        />
                        <label className="text-xs font-black uppercase tracking-widest text-white">
                            Critical Checkpoint
                        </label>
                    </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={onClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="primary" className="text-xs font-black uppercase tracking-widest">
                    {initialData ? 'Update Checkpoint' : 'Add Checkpoint'}
                </Button>
            </div>
        </Modal>
    );
};
