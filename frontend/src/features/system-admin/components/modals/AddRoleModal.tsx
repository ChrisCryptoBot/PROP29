import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const inputErrorClass =
  'w-full px-3 py-2 bg-white/5 border border-red-500/50 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:bg-white/10 font-mono placeholder-slate-500';

type BadgeVariant = 'destructive' | 'success' | 'secondary' | 'outline';

const getBadgeVariantFromBadge = (badge: string): BadgeVariant => {
  switch (badge) {
    case 'Active': return 'success';
    case 'Restricted': return 'destructive';
    default: return 'secondary';
  }
};

const getModulesFromPermissions = (permissions: string): string => {
  switch (permissions) {
    case 'Read (25%)': return 'Limited';
    case 'Limited (50%)': return 'Some';
    case 'Limited (75%)': return 'Most';
    case 'All (100%)': return 'All';
    default: return 'Most';
  }
};

export const AddRoleModal: React.FC = () => {
  const { showAddRoleModal, setShowAddRoleModal, handleAddRole, showError } = useSystemAdminContext();

  const [roleData, setRoleData] = useState({
    title: '',
    description: '',
    permissions: 'Limited (75%)',
    badge: 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!showAddRoleModal) return null;

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    if (!roleData.title.trim()) {
      newErrors.title = 'Role name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    // Actually add the role to state
    handleAddRole({
      title: roleData.title,
      description: roleData.description,
      permissions: roleData.permissions,
      modules: getModulesFromPermissions(roleData.permissions),
      badge: roleData.badge,
      badgeVariant: getBadgeVariantFromBadge(roleData.badge)
    });

    // Reset form
    setRoleData({
      title: '',
      description: '',
      permissions: 'Limited (75%)',
      badge: 'Active',
    });
  };

  const handleClose = () => {
    setShowAddRoleModal(false);
    setErrors({});
    setRoleData({
      title: '',
      description: '',
      permissions: 'Limited (75%)',
      badge: 'Active',
    });
  };

  return (
    <Modal
      isOpen={showAddRoleModal}
      onClose={handleClose}
      title="Create role"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Create role
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Role name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={roleData.title}
            onChange={(e) => {
              setRoleData({ ...roleData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            className={errors.title ? inputErrorClass : inputClass}
            placeholder="e.g. System Auditor"
          />
          {errors.title && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={roleData.description}
            onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
            className={inputClass + ' h-24 resize-none'}
            placeholder="Describe the scope of this role..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Badge
            </label>
            <select
              value={roleData.badge}
              onChange={(e) => setRoleData({ ...roleData, badge: e.target.value })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="Active" className="bg-slate-900">Active</option>
              <option value="Standard" className="bg-slate-900">Standard</option>
              <option value="Restricted" className="bg-slate-900">Restricted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Permissions
            </label>
            <select
              value={roleData.permissions}
              onChange={(e) => setRoleData({ ...roleData, permissions: e.target.value })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="Read (25%)" className="bg-slate-900">Level 1 (25%)</option>
              <option value="Limited (50%)" className="bg-slate-900">Level 2 (50%)</option>
              <option value="Limited (75%)" className="bg-slate-900">Level 3 (75%)</option>
              <option value="All (100%)" className="bg-slate-900">Level 4 (100%)</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
