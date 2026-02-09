/**
 * Create Event Modal
 * Modal for creating a new event
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { useAuth } from '../../../../contexts/AuthContext';
import type { EventCreate } from '../../types/visitor-security.types';

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { createEvent, loading } = useVisitorContext();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<EventCreate>>({
    name: '',
    type: 'wedding',
    start_date: '',
    end_date: '',
    location: '',
    expected_attendees: 100,
    qr_code_enabled: true,
    access_points: []
  });

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [accessPointInput, setAccessPointInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        type: 'wedding',
        start_date: '',
        end_date: '',
        location: '',
        expected_attendees: 100,
        qr_code_enabled: true,
        access_points: []
      });
      setAccessPointInput('');
      setIsFormDirty(false);
    }
  }, [isOpen]);

  const handleChange = (field: keyof EventCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsFormDirty(true);
  };

  const handleAddAccessPoint = () => {
    if (accessPointInput.trim()) {
      setFormData(prev => ({
        ...prev,
        access_points: [...(prev.access_points || []), accessPointInput.trim()]
      }));
      setAccessPointInput('');
      setIsFormDirty(true);
    }
  };

  const handleRemoveAccessPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      access_points: prev.access_points?.filter((_, i) => i !== index) || []
    }));
    setIsFormDirty(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.location || !formData.access_points || formData.access_points.length === 0) {
      return;
    }

    // Get property_id from user (in real implementation)
    const propertyId = user?.roles?.[0] || 'default-property-id';

    const eventData: EventCreate = {
      property_id: propertyId,
      name: formData.name,
      type: formData.type || 'wedding',
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location,
      expected_attendees: formData.expected_attendees || 100,
      qr_code_enabled: formData.qr_code_enabled !== false,
      access_points: formData.access_points
    };

    const result = await createEvent(eventData);
    if (result) {
      onClose();
    }
  };

  const handleClose = () => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register Event Profile"
      size="lg"
      footer={
        <>
          <Button
            onClick={handleClose}
            variant="subtle"
            className="text-xs font-black uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading.events || !formData.name || !formData.start_date || !formData.end_date || !formData.location || !formData.access_points || formData.access_points.length === 0}
            variant="primary"
            className="text-xs font-black uppercase tracking-widest"
          >
            {loading.events ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2" />
                Create
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Event Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Event Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Smith-Johnson Wedding"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Event Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type || 'wedding'}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
              >
                <option value="wedding">Wedding</option>
                <option value="conference">Conference</option>
                <option value="corporate">Corporate</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Expected Attendees
              </label>
              <input
                type="number"
                value={formData.expected_attendees || 100}
                onChange={(e) => handleChange('expected_attendees', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Date & Location */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Date & Location</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Start Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                End Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Ballroom A"
              />
            </div>
          </div>
        </div>

        {/* Access Points */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Sector Authorization <span className="text-red-400">*</span></p>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={accessPointInput}
              onChange={(e) => setAccessPointInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAccessPoint();
                }
              }}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
              placeholder="Enter zone ID (e.g., 1, 5, 7)"
            />
            <Button
              type="button"
              onClick={handleAddAccessPoint}
              variant="outline"
              className="border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] hover:bg-white/5"
            >
              <i className="fas fa-plus mr-2" />
              Add
            </Button>
          </div>
          {formData.access_points && formData.access_points.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-md border border-white/5">
              {formData.access_points.map((ap, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 text-[10px] font-black rounded uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20"
                >
                  Zone {ap}
                  <button
                    type="button"
                    onClick={() => handleRemoveAccessPoint(index)}
                    className="ml-2 text-blue-300 hover:text-red-400 transition-colors"
                  >
                    <i className="fas fa-times" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center justify-between border border-white/5 rounded-md p-4">
          <div>
            <h4 className="text-sm font-bold text-[color:var(--text-main)]">QR Authentication</h4>
            <p className="text-xs text-[color:var(--text-sub)]">Require dynamic QR codes for secure check-in</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="qr_code_enabled"
              checked={formData.qr_code_enabled !== false}
              onChange={(e) => handleChange('qr_code_enabled', e.target.checked)}
              className="w-5 h-5 accent-blue-600 border-white/5 rounded bg-white/5 cursor-pointer"
            />
          </div>
        </div>

      </div>
    </Modal>
  );
});

CreateEventModal.displayName = 'CreateEventModal';
