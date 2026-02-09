/**
 * Smart Lockers - Add Locker Modal
 * Gold standard: uses shared Modal, flat content, footer actions.
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { createLockerSchema, type CreateLockerInput } from '../../types/locker.schema';
import { LOCKER_SIZES, LOCKER_SIZE_LABELS, LOCKER_FEATURES } from '../../utils/constants';
import { cn } from '../../../../utils/cn';
import type { ZodIssue } from 'zod';

export const CreateLockerModal: React.FC = () => {
  const { createLocker, loading, showCreateModal, setShowCreateModal } = useSmartLockersContext();
  const [formData, setFormData] = useState<CreateLockerInput>({
    lockerNumber: '',
    location: '',
    size: 'medium',
    features: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      lockerNumber: '',
      location: '',
      size: 'medium',
      features: [],
    });
    setErrors({});
    setShowCreateModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = createLockerSchema.safeParse(formData);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((error: ZodIssue) => {
        if (error.path[0]) {
          newErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    try {
      await createLocker(validationResult.data);
      handleClose();
    } catch {
      // Error is handled by the hook
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev: CreateLockerInput) => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter((f: string) => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  return (
    <Modal
      isOpen={showCreateModal}
      onClose={handleClose}
      title="Add Locker"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="subtle"
            onClick={handleClose}
            className="font-black uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="create-locker-form"
            className="font-black uppercase tracking-widest px-10"
            disabled={loading.lockers}
          >
            {loading.lockers ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2" />
                Add Locker
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="create-locker-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Locker number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.lockerNumber}
            onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, lockerNumber: e.target.value.toUpperCase() }))}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 placeholder-slate-500',
              errors.lockerNumber ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
            placeholder="e.g. L-1001"
          />
          {errors.lockerNumber && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.lockerNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, location: e.target.value }))}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 placeholder-slate-500',
              errors.location ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
            placeholder="e.g. Lobby, Floor 2"
          />
          {errors.location && (
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Size <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, size: e.target.value as 'small' | 'medium' | 'large' }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 [&>option]:bg-slate-900"
          >
            {LOCKER_SIZES.map((size) => (
              <option key={size} value={size}>
                {LOCKER_SIZE_LABELS[size]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Features
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LOCKER_FEATURES.map((feature) => (
              <label
                key={feature}
                className={cn(
                  'flex items-center space-x-2 p-2 border rounded-md cursor-pointer transition-colors text-sm',
                  formData.features?.includes(feature)
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature) || false}
                  onChange={() => toggleFeature(feature)}
                  className="rounded border-white/5 text-blue-600 focus:ring-blue-500/50 bg-slate-900/50"
                />
                <span className="font-medium uppercase tracking-wider">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
