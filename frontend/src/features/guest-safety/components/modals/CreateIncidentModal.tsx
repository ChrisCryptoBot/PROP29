/**
 * Guest Safety - Create Incident Modal
 * Create a new guest safety incident
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import type { CreateIncidentRequest, IncidentPriority, IncidentType } from '../../types/guest-safety.types';

export const CreateIncidentModal: React.FC = () => {
  const {
    showCreateIncidentModal,
    setShowCreateIncidentModal,
    createIncident,
    loading,
  } = useGuestSafetyContext();

  const [formData, setFormData] = useState<CreateIncidentRequest>({
    title: '',
    description: '',
    location: '',
    severity: 'medium',
    guest_involved: '',
    room_number: '',
    contact_info: '',
  });

  const [incidentType, setIncidentType] = useState<IncidentType>('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    try {
      await createIncident({
        ...formData,
        severity: formData.severity as 'low' | 'medium' | 'high' | 'critical',
      });
      setFormData({
        title: '',
        description: '',
        location: '',
        severity: 'medium',
        guest_involved: '',
        room_number: '',
        contact_info: '',
      });
      setIncidentType('other');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setShowCreateIncidentModal(false);
    setFormData({
      title: '',
      description: '',
      location: '',
      severity: 'medium',
      guest_involved: '',
      room_number: '',
      contact_info: '',
    });
    setIncidentType('other');
  };

  if (!showCreateIncidentModal) return null;

  return (
    <Modal
      isOpen={showCreateIncidentModal}
      onClose={handleClose}
      title="Create Incident"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono px-4 py-3"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            disabled={loading.actions}
            placeholder="Brief incident description"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3 min-h-[120px]"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            disabled={loading.actions}
            placeholder="Detailed description of the incident"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Location
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono px-4 py-3"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
              disabled={loading.actions}
              placeholder="Room/Area"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Severity
            </label>
            <select
              className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3"
              value={formData.severity}
              onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
              required
              disabled={loading.actions}
            >
              <option value="low" className="bg-slate-900">Low</option>
              <option value="medium" className="bg-slate-900">Medium</option>
              <option value="high" className="bg-slate-900">High</option>
              <option value="critical" className="bg-slate-900">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Guest Name (Optional)
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3"
              value={formData.guest_involved || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_involved: e.target.value }))}
              disabled={loading.actions}
              placeholder="Guest name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Room Number (Optional)
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono px-4 py-3"
              value={formData.room_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
              disabled={loading.actions}
              placeholder="Room number"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading.actions}
            className="px-8 font-black uppercase tracking-widest text-[10px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading.actions || !formData.title.trim() || !formData.description.trim()}
            className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none"
          >
            {loading.actions ? 'Creating...' : 'Create Incident'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
