import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
import type { AccessControlUser, UserRole, UserStatus, AccessLevel } from '../../../../shared/types/access-control.types';
import type { AccessSchedule } from '../../../../shared/types/access-control.types';
import { cn } from '../../../../utils/cn';
import { ConfirmDiscardChangesModal } from './ConfirmDiscardChangesModal';

export interface UserFormData {
  name: string;
  email: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  accessLevel: AccessLevel;
  phone?: string;
  employeeId?: string;
  accessSchedule?: AccessSchedule;
  autoRevokeAtCheckout?: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, userData: Partial<AccessControlUser>) => Promise<void>;
  user: AccessControlUser;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

const AVAILABLE_ROLES: UserRole[] = ['admin', 'manager', 'employee', 'guest', 'security', 'executive', 'it', 'contractor'];
const AVAILABLE_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];
const AVAILABLE_ACCESS_LEVELS: AccessLevel[] = ['restricted', 'standard', 'elevated'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  isFormDirty,
  setIsFormDirty
}) => {
  const [formData, setFormData] = React.useState<UserFormData>({
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
    status: user.status,
    accessLevel: user.accessLevel,
    phone: user.phone || '',
    employeeId: user.employeeId || '',
    accessSchedule: user.accessSchedule || {
      days: [],
      startTime: '08:00',
      endTime: '17:00'
    },
    autoRevokeAtCheckout: user.autoRevokeAtCheckout || false
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update form data when user prop changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        status: user.status,
        accessLevel: user.accessLevel,
        phone: user.phone || '',
        employeeId: user.employeeId || '',
        accessSchedule: user.accessSchedule || {
          days: [],
          startTime: '08:00',
          endTime: '17:00'
        },
        autoRevokeAtCheckout: user.autoRevokeAtCheckout || false
      });
      setIsFormDirty(false);
      setErrors({});
    }
  }, [user, setIsFormDirty]);

  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleClose = () => {
    if (isFormDirty) {
      setShowDiscardModal(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsFormDirty(false);
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: Partial<AccessControlUser> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        role: formData.role,
        status: formData.status,
        accessLevel: formData.accessLevel,
        ...(formData.phone && { phone: formData.phone.trim() }),
        ...(formData.employeeId && { employeeId: formData.employeeId.trim() }),
        ...(formData.accessSchedule && formData.accessSchedule.days.length > 0 && {
          accessSchedule: formData.accessSchedule
        }),
        ...(formData.autoRevokeAtCheckout !== undefined && {
          autoRevokeAtCheckout: formData.autoRevokeAtCheckout
        })
      };

      await onSubmit(user.id, userData);
      setIsFormDirty(false);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsFormDirty(true);
  };

  const toggleAccessScheduleDay = (day: string) => {
    const currentDays = formData.accessSchedule?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateFormData({
      accessSchedule: {
        days: newDays,
        startTime: formData.accessSchedule?.startTime || '08:00',
        endTime: formData.accessSchedule?.endTime || '17:00'
      }
    });
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit User"
      size="lg"
      footer={
        <>
          <Button onClick={handleClose} variant="subtle" disabled={isSubmitting} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting || !isFormDirty} aria-label="Save user changes" className="text-xs font-black uppercase tracking-widest shadow-none">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">Basic Info</p>
          <div>
            <label htmlFor="edit-user-name" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></label>
            <input type="text" id="edit-user-name" value={formData.name} onChange={(e) => updateFormData({ name: e.target.value })} className={cn('w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500', errors.name ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/5 focus:ring-blue-500/20')} placeholder="e.g. John Smith" aria-label="User full name" />
            {errors.name && <p className="text-[10px] text-red-400 mt-1 font-black uppercase tracking-tight">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="edit-user-email" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Email <span className="text-red-400">*</span></label>
            <input type="email" id="edit-user-email" value={formData.email} onChange={(e) => updateFormData({ email: e.target.value })} className={cn('w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500', errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/5 focus:ring-blue-500/20')} placeholder="user@example.com" aria-label="User email address" />
            {errors.email && <p className="text-[10px] text-red-400 mt-1 font-black uppercase tracking-tight">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-user-department" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Department <span className="text-red-400">*</span></label>
              <input type="text" id="edit-user-department" value={formData.department} onChange={(e) => updateFormData({ department: e.target.value })} className={cn('w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 font-mono placeholder-slate-500', errors.department ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/5 focus:ring-blue-500/20')} placeholder="e.g. Security" aria-label="User department" />
              {errors.department && <p className="text-[10px] text-red-400 mt-1 font-black uppercase tracking-tight">{errors.department}</p>}
            </div>
            <div>
              <label htmlFor="edit-user-phone" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Phone</label>
              <input type="tel" id="edit-user-phone" value={formData.phone || ''} onChange={(e) => updateFormData({ phone: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500" placeholder="+1 555 000 0000" aria-label="User phone number" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-user-employee-id" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Employee ID</label>
            <input type="text" id="edit-user-employee-id" value={formData.employeeId || ''} onChange={(e) => updateFormData({ employeeId: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500" placeholder="e.g. EMP-001" aria-label="Employee ID" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">Access Settings</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit-user-role" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Role</label>
              <Select id="edit-user-role" value={formData.role} onChange={(e) => updateFormData({ role: e.target.value as UserRole })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono [&>option]:bg-slate-900">
                {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="edit-user-status" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Status</label>
              <Select id="edit-user-status" value={formData.status} onChange={(e) => updateFormData({ status: e.target.value as UserStatus })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono [&>option]:bg-slate-900">
                {AVAILABLE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="edit-user-access-level" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Access Level</label>
              <Select id="edit-user-access-level" value={formData.accessLevel} onChange={(e) => updateFormData({ accessLevel: e.target.value as AccessLevel })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono [&>option]:bg-slate-900">
                {AVAILABLE_ACCESS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">Access Schedule</p>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Active Days</label>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map(day => (
                <label key={day} className={cn('flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer transition-colors', formData.accessSchedule?.days.includes(day) ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10')}>
                  <input type="checkbox" checked={formData.accessSchedule?.days.includes(day) || false} onChange={() => toggleAccessScheduleDay(day)} className="hidden" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
          {formData.accessSchedule && formData.accessSchedule.days.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-schedule-start-time" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Start Time</label>
                <input type="time" id="edit-schedule-start-time" value={formData.accessSchedule.startTime} onChange={(e) => updateFormData({ accessSchedule: { ...formData.accessSchedule!, startTime: e.target.value } })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono" aria-label="Access schedule start time" />
              </div>
              <div>
                <label htmlFor="edit-schedule-end-time" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">End Time</label>
                <input type="time" id="edit-schedule-end-time" value={formData.accessSchedule.endTime} onChange={(e) => updateFormData({ accessSchedule: { ...formData.accessSchedule!, endTime: e.target.value } })} className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono" aria-label="Access schedule end time" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2 mb-2">Advanced Options</p>
          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Auto revoke on checkout</span>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Revoke access when guest checks out.</p>
            </div>
            <input type="checkbox" checked={formData.autoRevokeAtCheckout || false} onChange={(e) => updateFormData({ autoRevokeAtCheckout: e.target.checked })} className="h-4 w-4 rounded border-white/5 bg-white/5 focus:ring-2 focus:ring-blue-500/20" />
          </label>
        </div>
      </div>
    </Modal>
      <ConfirmDiscardChangesModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
};
