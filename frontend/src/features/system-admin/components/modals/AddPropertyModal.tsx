import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const inputErrorClass =
  'w-full px-3 py-2 bg-white/5 border border-red-500/50 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:bg-white/10 font-mono placeholder-slate-500';

type PropertyStatus = 'Operational' | 'Maintenance' | 'Closed';

export const AddPropertyModal: React.FC = () => {
  const { showAddPropertyModal, setShowAddPropertyModal, handleAddProperty, showError } = useSystemAdminContext();

  const [propertyData, setPropertyData] = useState<{
    title: string;
    description: string;
    rooms: number;
    occupancy: string;
    revenue: string;
    status: PropertyStatus;
  }>({
    title: '',
    description: '',
    rooms: 0,
    occupancy: '0%',
    revenue: '$0',
    status: 'Operational',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!showAddPropertyModal) return null;

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    if (!propertyData.title.trim()) {
      newErrors.title = 'Property name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    // Actually add the property to state
    handleAddProperty({
      title: propertyData.title,
      description: propertyData.description,
      rooms: propertyData.rooms,
      occupancy: propertyData.occupancy,
      revenue: propertyData.revenue,
      status: propertyData.status,
    });

    // Reset form
    setPropertyData({
      title: '',
      description: '',
      rooms: 0,
      occupancy: '0%',
      revenue: '$0',
      status: 'Operational',
    });
  };

  const handleClose = () => {
    setShowAddPropertyModal(false);
    setErrors({});
    setPropertyData({
      title: '',
      description: '',
      rooms: 0,
      occupancy: '0%',
      revenue: '$0',
      status: 'Operational',
    });
  };

  return (
    <Modal
      isOpen={showAddPropertyModal}
      onClose={handleClose}
      title="Add property"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Add property
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Property name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={propertyData.title}
            onChange={(e) => {
              setPropertyData({ ...propertyData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            className={errors.title ? inputErrorClass : inputClass}
            placeholder="e.g. Skyline Apartments"
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
            value={propertyData.description}
            onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
            className={inputClass + ' h-20 resize-none'}
            placeholder="Brief description of this property"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Unit count
            </label>
            <input
              type="number"
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
              onChange={(e) => setPropertyData({ ...propertyData, status: e.target.value as PropertyStatus })}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="Operational" className="bg-slate-900">Operational</option>
              <option value="Maintenance" className="bg-slate-900">Maintenance</option>
              <option value="Closed" className="bg-slate-900">Closed</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Occupancy Rate
            </label>
            <input
              type="text"
              value={propertyData.occupancy}
              onChange={(e) => setPropertyData({ ...propertyData, occupancy: e.target.value })}
              className={inputClass}
              placeholder="e.g. 85%"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Monthly Revenue
            </label>
            <input
              type="text"
              value={propertyData.revenue}
              onChange={(e) => setPropertyData({ ...propertyData, revenue: e.target.value })}
              className={inputClass}
              placeholder="e.g. $125,000"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
