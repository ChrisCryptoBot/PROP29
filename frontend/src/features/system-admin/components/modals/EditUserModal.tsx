import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { AdminUser } from '../../types/system-admin.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';

export const EditUserModal: React.FC = () => {
  const {
    showEditUserModal,
    setShowEditUserModal,
    selectedUser,
    setSelectedUser,
    handleUpdateUser,
  } = useSystemAdminContext();

  const [userData, setUserData] = useState<AdminUser | null>(selectedUser);

  useEffect(() => {
    setUserData(selectedUser);
  }, [selectedUser]);

  if (!showEditUserModal || !userData) return null;

  // FIX: Pass userData directly to handleUpdateUser to avoid async state bug
  const onCommit = () => {
    if (userData) {
      handleUpdateUser(userData);
    }
  };

  const handleClose = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  return (
    <Modal
      isOpen={showEditUserModal}
      onClose={handleClose}
      title={`Modify profile: ${userData.name}`}
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onCommit}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Full name
          </label>
          <input
            type="text"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Department
          </label>
          <input
            type="text"
            value={userData.department}
            onChange={(e) => setUserData({ ...userData, department: e.target.value })}
            className={inputClass}
            placeholder="e.g. Operations, Security, IT"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Role
            </label>
            <select
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
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
              value={userData.status}
              onChange={(e) => setUserData({ ...userData, status: e.target.value as 'active' | 'inactive' })}
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
