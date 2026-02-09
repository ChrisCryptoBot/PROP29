import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import { ROLE_OPTIONS } from '../../types/account-settings.types';
import type { TeamMember, TeamMemberRole, UpdateTeamMemberRequest } from '../../types/account-settings.types';

interface EditMemberModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, member, onClose, onSuccess }) => {
  const { updateTeamMember, loading } = useAccountSettingsContext();
  const [form, setForm] = useState<UpdateTeamMemberRequest>({
    name: '',
    email: '',
    role: 'patrol_agent',
    department: '',
    phone: '',
    shift: 'morning',
    status: 'active',
    permissions: [],
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        phone: member.phone ?? '',
        shift: member.shift ?? 'morning',
        status: member.status,
        permissions: member.permissions ?? [],
      });
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;
    setValidationError(null);
    if (!form.name?.trim()) {
      setValidationError('Name is required');
      return;
    }
    if (!form.email?.trim()) {
      setValidationError('Email is required');
      return;
    }
    const updated = await updateTeamMember(member.id, form);
    if (updated) {
      onClose();
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Team Member"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading.save}>
            {loading.save ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {validationError && (
          <p className="text-[10px] text-red-400 font-black uppercase tracking-tight">{validationError}</p>
        )}
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name ?? ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Role</label>
          <select
            value={form.role ?? 'patrol_agent'}
            onChange={(e) => setForm({ ...form, role: e.target.value as TeamMemberRole })}
            className="w-full px-3 py-2 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/30"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Department</label>
          <input
            type="text"
            value={form.department ?? ''}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
            placeholder="e.g. Security Operations"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Phone</label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-[color:var(--text-muted)] focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>
    </Modal>
  );
};
