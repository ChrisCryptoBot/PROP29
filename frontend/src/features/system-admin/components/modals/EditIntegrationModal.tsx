import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import type { SystemIntegration } from '../../types/system-admin.types';

const inputClass = 'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const inputErrorClass = 'w-full px-3 py-2 bg-white/5 border border-red-500/50 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:bg-white/10 font-mono placeholder-slate-500';

export const EditIntegrationModal: React.FC = () => {
    const {
        showEditIntegrationModal,
        setShowEditIntegrationModal,
        selectedIntegration,
        setSelectedIntegration,
        handleUpdateIntegration,
        showError,
    } = useSystemAdminContext();

    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (selectedIntegration) {
            setName(selectedIntegration.name);
            setType(selectedIntegration.type);
            setEndpoint(selectedIntegration.endpoint);
            setStatus(selectedIntegration.status);
        }
    }, [selectedIntegration]);

    if (!showEditIntegrationModal || !selectedIntegration) return null;

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!endpoint.trim()) newErrors.endpoint = 'Endpoint is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        handleUpdateIntegration(selectedIntegration.id, { name: name.trim(), type: type.trim(), endpoint: endpoint.trim(), status });
    };

    const handleClose = () => {
        setShowEditIntegrationModal(false);
        setSelectedIntegration(null);
        setErrors({});
    };

    return (
        <Modal
            isOpen={showEditIntegrationModal}
            onClose={handleClose}
            title="Edit integration"
            size="sm"
            footer={
                <>
                    <Button variant="subtle" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Save
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                        className={errors.name ? inputErrorClass : inputClass}
                        placeholder="Integration name"
                    />
                    {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Type</label>
                    <input
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. WebSocket, REST API"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Endpoint <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={endpoint}
                        onChange={(e) => { setEndpoint(e.target.value); if (errors.endpoint) setErrors({ ...errors, endpoint: '' }); }}
                        className={errors.endpoint ? inputErrorClass : inputClass}
                        placeholder="wss://..."
                    />
                    {errors.endpoint && <p className="text-[10px] text-red-400 mt-1">{errors.endpoint}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                        className={inputClass}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
};
