/**
 * Register Item Modal
 * Form for registering new lost & found items. Uses global Modal (UI gold standard).
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { LostFoundItemCreate } from '../../types/lost-and-found.types';
import { useAuth } from '../../../../contexts/AuthContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500 [&>option]:bg-slate-900';

interface RegisterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterItemModal: React.FC<RegisterItemModalProps> = ({ isOpen, onClose }) => {
  const { createItem, loading } = useLostFoundContext();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<LostFoundItemCreate>>({
    item_type: '',
    description: '',
    location_found: '',
    value_estimate: undefined,
    notes: '',
    category: '',
    name: '',
    storageLocation: '',
    guestInfo: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_type || !formData.description || !formData.location_found) return;
    const propertyId = user?.roles?.[0] || 'default-property-id';
    const itemToCreate: LostFoundItemCreate = {
      property_id: propertyId,
      item_type: formData.item_type || formData.name || 'Unknown',
      description: formData.description,
      location_found: formData.location_found || '',
      value_estimate: formData.value_estimate,
      notes: formData.notes,
      category: formData.category,
      name: formData.name,
      storageLocation: formData.storageLocation,
    };
    const result = await createItem(itemToCreate);
    if (result) {
      setFormData({
        item_type: '',
        description: '',
        location_found: '',
        value_estimate: undefined,
        notes: '',
        category: '',
        name: '',
        storageLocation: '',
        guestInfo: {},
      });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'item-name') setFormData((prev) => ({ ...prev, name: value, item_type: value }));
    else if (id === 'category') setFormData((prev) => ({ ...prev, category: value, item_type: value }));
    else if (id === 'description') setFormData((prev) => ({ ...prev, description: value }));
    else if (id === 'location-found') setFormData((prev) => ({ ...prev, location_found: value }));
    else if (id === 'estimated-value') setFormData((prev) => ({ ...prev, value_estimate: parseFloat(value) || undefined }));
    else if (id === 'storage-location') setFormData((prev) => ({ ...prev, storageLocation: value }));
    else if (id === 'notes') setFormData((prev) => ({ ...prev, notes: value }));
  };

  const canSubmit =
    !loading.items &&
    !!formData.name &&
    !!formData.category &&
    !!formData.description &&
    !!formData.location_found;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register item"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={loading.items}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {loading.items ? 'Registering…' : 'Register item'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="item-name" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Item name *
            </label>
            <input
              type="text"
              id="item-name"
              value={formData.name || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. iPhone, keys"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Category *
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={handleChange}
              className={inputClass + ' appearance-none cursor-pointer'}
              required
            >
              <option value="">Select category</option>
              <option value="Electronics">Electronics</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Personal Items">Personal Items</option>
              <option value="Accessories">Accessories</option>
              <option value="Clothing">Clothing</option>
              <option value="Weapons">Weapons (manager approval)</option>
              <option value="Documents">Documents</option>
              <option value="Other">Other</option>
            </select>
            {formData.category === 'Weapons' && (
              <p className="mt-2 text-xs text-amber-400">Manager approval required for weapons.</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="Color, brand, size, etc."
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location-found" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Location found *
            </label>
            <input
              type="text"
              id="location-found"
              value={typeof formData.location_found === 'string' ? formData.location_found : ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Lobby, pool deck"
              required
            />
          </div>
          <div>
            <label htmlFor="estimated-value" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Estimated value ($)
            </label>
            <input
              type="number"
              id="estimated-value"
              value={formData.value_estimate ?? ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
              min={0}
              step={0.01}
            />
          </div>
        </div>
        <div>
          <label htmlFor="storage-location" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Storage location
          </label>
          <select
            id="storage-location"
            value={formData.storageLocation || ''}
            onChange={handleChange}
            className={inputClass + ' appearance-none cursor-pointer'}
          >
            <option value="">Select storage</option>
            <option value="Storage Room A - Shelf 1">Storage Room A - Shelf 1</option>
            <option value="Storage Room A - Shelf 2">Storage Room A - Shelf 2</option>
            <option value="Storage Room A - Safe 1">Storage Room A - Safe 1</option>
            <option value="Storage Room B - Drawer 1">Storage Room B - Drawer 1</option>
            <option value="Storage Room A - Secure Area">Storage Room A - Secure Area</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="Additional information"
          />
        </div>
      </form>
    </Modal>
  );
};
