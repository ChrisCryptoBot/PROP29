import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';

export const EditRoleModal: React.FC = () => {
  const {
    showEditRoleModal,
    setShowEditRoleModal,
    selectedRole,
    handleUpdateRole,
  } = useSystemAdminContext();

  const [roleData, setRoleData] = useState(selectedRole);

  useEffect(() => {
    setRoleData(selectedRole);
  }, [selectedRole]);

  if (!showEditRoleModal || !roleData) return null;

  return (
    <Modal
      isOpen={showEditRoleModal}
      onClose={() => setShowEditRoleModal(false)}
      title={`Edit role: ${roleData.title}`}
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={() => setShowEditRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleUpdateRole(roleData)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Role name
          </label>
          <input
            type="text"
            value={roleData.title}
            onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={roleData.description}
            onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
            className={inputClass + ' h-24 resize-none'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Badge
            </label>
            <input
              type="text"
              value={roleData.badge}
              onChange={(e) => setRoleData({ ...roleData, badge: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Permissions
            </label>
            <input
              type="text"
              value={roleData.permissions}
              onChange={(e) => setRoleData({ ...roleData, permissions: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
