/**
 * Smart Lockers - Create Locker Modal
 * Modal for creating new smart lockers with Zod validation
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { createLockerSchema, type CreateLockerInput } from '../../types/locker.schema';
import { LOCKER_SIZES, LOCKER_SIZE_LABELS, LOCKER_FEATURES } from '../../utils/constants';
import { showError } from '../../../../utils/toast';
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

  if (!showCreateModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod validation
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
    } catch (error) {
      // Error is handled by the hook
    }
  };

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

  const toggleFeature = (feature: string) => {
    setFormData((prev: CreateLockerInput) => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter((f: string) => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-card border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-lock text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Create Smart Locker</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">New Hardware Asset Entry</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Locker Number */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Hardware ID / Locker Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lockerNumber}
              onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, lockerNumber: e.target.value.toUpperCase() }))}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner",
                errors.lockerNumber ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
              placeholder="L-XXXX"
            />
            {errors.lockerNumber && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.lockerNumber}</p>
            )}
          </div>

          {/* Location */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Deployment Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, location: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner",
                errors.location ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
              placeholder="Lobby, Floor 2, Zone C"
            />
            {errors.location && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.location}</p>
            )}
          </div>

          {/* Size */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Asset Classification / Size <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData((prev: CreateLockerInput) => ({ ...prev, size: e.target.value as 'small' | 'medium' | 'large' }))}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
            >
              {LOCKER_SIZES.map((size) => (
                <option key={size} value={size} className="bg-slate-900">
                  {LOCKER_SIZE_LABELS[size]}
                </option>
              ))}
            </select>
          </div>

          {/* Features */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Integrated Hardware Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LOCKER_FEATURES.map((feature) => (
                <label
                  key={feature}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all duration-200",
                    formData.features?.includes(feature)
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-lg"
                      : "bg-black/20 border-white/5 text-slate-500 hover:bg-white/5"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.features?.includes(feature) || false}
                    onChange={() => toggleFeature(feature)}
                    className="rounded border-white/10 text-blue-600 focus:ring-blue-500/50 bg-black/40"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-white/10 bg-white/5 -mx-8 -mb-8 px-8 py-6 rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              className="font-black uppercase tracking-widest border-white/10 text-slate-400 hover:text-white"
              onClick={handleClose}
            >
              Abeyance
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="font-black uppercase tracking-widest px-10 shadow-lg shadow-blue-500/20"
              disabled={loading.lockers}
            >
              {loading.lockers ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Deploying...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2" />
                  Commit Asset
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};




