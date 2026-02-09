import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';

export const EditPropertyModal: React.FC = () => {
  const {
    showEditPropertyModal,
    setShowEditPropertyModal,
    selectedProperty,
    handleUpdateProperty,
  } = useSystemAdminContext();

  const [propertyData, setPropertyData] = useState(selectedProperty);

  useEffect(() => {
    setPropertyData(selectedProperty);
  }, [selectedProperty]);

  if (!showEditPropertyModal || !propertyData) return null;

  return (
    <Modal
      isOpen={showEditPropertyModal}
      onClose={() => setShowEditPropertyModal(false)}
      title={`Edit property: ${propertyData.title}`}
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={() => setShowEditPropertyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleUpdateProperty(propertyData)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Property name
          </label>
          <input
            type="text"
            value={propertyData.title}
            onChange={(e) => setPropertyData({ ...propertyData, title: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={propertyData.description}
            onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
            className={inputClass + ' h-20 resize-none'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Rooms
            </label>
            <input
              type="text"
              value={propertyData.rooms}
              onChange={(e) => setPropertyData({ ...propertyData, rooms: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Status
            </label>
            <select
              value={propertyData.status}
              onChange={(e) => setPropertyData({ ...propertyData, status: e.target.value as string })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="Operational" className="bg-slate-900">Operational</option>
              <option value="Maintenance" className="bg-slate-900">Maintenance</option>
              <option value="Closed" className="bg-slate-900">Closed</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
