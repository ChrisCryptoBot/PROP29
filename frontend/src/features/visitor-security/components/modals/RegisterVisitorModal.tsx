/**
 * Register Visitor Modal
 * Modal for registering a new visitor
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { useAuth } from '../../../../contexts/AuthContext';
import type { VisitorCreate, VisitType } from '../../types/visitor-security.types';
import { VisitType as VisitTypeEnum } from '../../types/visitor-security.types';

export interface RegisterVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterVisitorModal: React.FC<RegisterVisitorModalProps> = React.memo(({
  isOpen,
  onClose
}) => {
  const { createVisitor, loading } = useVisitorContext();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<VisitorCreate>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    host_name: '',
    host_phone: '',
    host_email: '',
    host_room: '',
    expected_duration: 60,
    location: '',
    visit_type: VisitTypeEnum.DAY_VISITOR,
    notes: '',
    vehicle_number: '',
    event_id: ''
  });

  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        host_name: '',
        host_phone: '',
        host_email: '',
        host_room: '',
        expected_duration: 60,
        location: '',
        visit_type: VisitTypeEnum.DAY_VISITOR,
        notes: '',
        vehicle_number: '',
        event_id: ''
      });
      setIsFormDirty(false);
    }
  }, [isOpen]);

  const handleChange = (field: keyof VisitorCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsFormDirty(true);
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.phone || !formData.purpose || !formData.host_name || !formData.location) {
      return;
    }

    // Get property_id from user (in real implementation)
    const propertyId = user?.roles?.[0] || 'default-property-id';

    const visitorData: VisitorCreate = {
      property_id: propertyId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      purpose: formData.purpose,
      host_name: formData.host_name,
      host_phone: formData.host_phone,
      host_email: formData.host_email,
      host_room: formData.host_room,
      expected_duration: formData.expected_duration || 60,
      location: formData.location,
      visit_type: formData.visit_type || VisitTypeEnum.DAY_VISITOR,
      notes: formData.notes,
      vehicle_number: formData.vehicle_number,
      event_id: formData.event_id || undefined
    };

    const result = await createVisitor(visitorData);
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
      title="New Ingress Registration"
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
            disabled={loading.visitors || !formData.first_name || !formData.last_name || !formData.phone || !formData.purpose || !formData.host_name || !formData.location}
            variant="primary"
            className="text-xs font-black uppercase tracking-widest"
          >
            {loading.visitors ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                Issuing...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus mr-2" />
                Register
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Visitor Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="john.smith@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="+1-555-0123"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Company</label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Tech Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Visit Type
              </label>
              <select
                value={formData.visit_type || VisitTypeEnum.DAY_VISITOR}
                onChange={(e) => handleChange('visit_type', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
              >
                <option value={VisitTypeEnum.DAY_VISITOR}>Day Visitor</option>
                <option value={VisitTypeEnum.GUEST_VISITOR}>Guest Visitor</option>
                <option value={VisitTypeEnum.SERVICE_PERSONNEL}>Service Personnel</option>
                <option value={VisitTypeEnum.EMERGENCY_CONTACT}>Emergency Contact</option>
                <option value={VisitTypeEnum.EVENT_ATTENDEE}>Event Attendee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visit Information */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Ingress Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Purpose <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.purpose || ''}
                onChange={(e) => handleChange('purpose', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Business Meeting"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Conference Room A"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Expected Duration (min)
              </label>
              <input
                type="number"
                value={formData.expected_duration || 60}
                onChange={(e) => handleChange('expected_duration', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)]"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Host Information */}
        <div className="p-4 bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/20 rounded-xl">
          <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center">
            <i className="fas fa-user-tie mr-2" />
            Facility Liaison
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">
                Host Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.host_name || ''}
                onChange={(e) => handleChange('host_name', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="Sarah Johnson"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Host Phone</label>
              <input
                type="tel"
                value={formData.host_phone || ''}
                onChange={(e) => handleChange('host_phone', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="+1-555-0456"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Host Email</label>
              <input
                type="email"
                value={formData.host_email || ''}
                onChange={(e) => handleChange('host_email', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="sarah.j@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Host Room</label>
              <input
                type="text"
                value={formData.host_room || ''}
                onChange={(e) => handleChange('host_room', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="302"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Additional Information</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicle_number || ''}
                onChange={(e) => handleChange('vehicle_number', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Event ID</label>
              <input
                type="text"
                value={formData.event_id || ''}
                onChange={(e) => handleChange('event_id', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                placeholder="wedding_001"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[color:var(--text-sub)] mb-1 uppercase tracking-wider">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-[color:var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/30"
                rows={3}
                placeholder="Additional notes about the visitor..."
              />
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
});

RegisterVisitorModal.displayName = 'RegisterVisitorModal';
