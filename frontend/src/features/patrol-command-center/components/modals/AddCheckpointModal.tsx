import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { Checkpoint, PatrolRoute } from '../../types';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';

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
        if (!selectedRouteId) {
            showError('Please select a route');
            return;
        }
        if (!form.name) {
            showError('Checkpoint name is required');
            return;
        }

        const route = routes.find(r => r.id === selectedRouteId);
        if (!route) {
            showError('Selected route not found');
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

        try {
            // Update Route in Backend
            const response = await PatrolEndpoint.updateRoute(selectedRouteId, {
                checkpoints: updatedCheckpoints
            });

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
            showSuccess(`Checkpoint ${initialData ? 'updated' : 'added'} successfully`);
            onClose();
        } catch (error) {
            console.error(error);
            showError('Failed to save checkpoint');
        }
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
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Route</label>
                    <select
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                        value={selectedRouteId}
                        onChange={e => setSelectedRouteId(e.target.value)}
                        disabled={!!initialData}
                    >
                        <option value="" className="bg-slate-900">Select Route</option>
                        {routes.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                    </select>
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Name</label>
                            <input
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Checkpoint Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Location</label>
                            <input
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                                placeholder="Location description"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Type</label>
                            <select
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
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
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
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
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50"
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
