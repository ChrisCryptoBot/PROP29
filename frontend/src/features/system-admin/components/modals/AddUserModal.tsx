import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const inputErrorClass =
  'w-full px-3 py-2 bg-white/5 border border-red-500/50 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:bg-white/10 font-mono placeholder-slate-500';

export const AddUserModal: React.FC = () => {
  const {
    showAddUserModal,
    setShowAddUserModal,
    newUser,
    setNewUser,
    handleAddUser,
  } = useSystemAdminContext();

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!showAddUserModal) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newUser.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(newUser.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    handleAddUser();
  };

  const handleFieldChange = (field: keyof typeof newUser, value: string) => {
    setNewUser({ ...newUser, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleClose = () => {
    setShowAddUserModal(false);
    setErrors({});
  };

  return (
    <Modal
      isOpen={showAddUserModal}
      onClose={handleClose}
      title="Add user"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create user
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="e.g. Jane Smith"
          />
          {errors.name && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={errors.email ? inputErrorClass : inputClass}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.email}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Role
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="admin" className="bg-slate-900">Administrator</option>
              <option value="user" className="bg-slate-900">Staff</option>
              <option value="manager" className="bg-slate-900">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Status
            </label>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'active' | 'inactive' })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="active" className="bg-slate-900">Active</option>
              <option value="inactive" className="bg-slate-900">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
