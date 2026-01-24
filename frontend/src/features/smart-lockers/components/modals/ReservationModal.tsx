/**
 * Smart Lockers - Reservation Modal
 * Modal for creating locker reservations with Zod validation
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { createReservationSchema, type CreateReservationInput } from '../../types/locker.schema';
import { showError } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';
import type { ZodIssue } from 'zod';

export const ReservationModal: React.FC = () => {
  const { createReservation, lockers, loading, showReservationModal, setShowReservationModal } = useSmartLockersContext();
  const [formData, setFormData] = useState<CreateReservationInput>({
    lockerId: '',
    guestId: '',
    guestName: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    purpose: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!showReservationModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Convert datetime-local format to ISO string
    const submitData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    // Zod validation
    const validationResult = createReservationSchema.safeParse(submitData);
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
      await createReservation(validationResult.data);
      handleClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    setFormData({
      lockerId: '',
      guestId: '',
      guestName: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      purpose: '',
    });
    setErrors({});
    setShowReservationModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-card border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl animate-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-calendar-plus text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Create Reservation</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">New Locker Registry Entry</p>
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
          {/* Locker ID */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Locker Selection <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lockerId}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, lockerId: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white appearance-none focus:outline-none focus:ring-2 transition-all shadow-inner",
                errors.lockerId ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
            >
              <option value="" className="bg-slate-900">Select an available locker</option>
              {lockers.filter(l => l.status === 'available').map((locker) => (
                <option key={locker.id} value={locker.id} className="bg-slate-900">
                  {locker.lockerNumber} - {locker.location}
                </option>
              ))}
            </select>
            {errors.lockerId && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.lockerId}</p>
            )}
          </div>

          {/* Guest ID */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Guest Identification <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.guestId}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, guestId: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner",
                errors.guestId ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
              placeholder="G-XXXXX"
            />
            {errors.guestId && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.guestId}</p>
            )}
          </div>

          {/* Guest Name */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, guestName: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner",
                errors.guestName ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
              placeholder="John Doe"
            />
            {errors.guestName && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.guestName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Commencement <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, startTime: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 bg-black/40 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all shadow-inner",
                  errors.startTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
                )}
              />
              {errors.startTime && (
                <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.startTime}</p>
              )}
            </div>

            {/* End Time */}
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Termination <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, endTime: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 bg-black/40 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all shadow-inner",
                  errors.endTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
                )}
              />
              {errors.endTime && (
                <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Registry Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, purpose: e.target.value }))}
              rows={3}
              className={cn(
                "w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all shadow-inner resize-none",
                errors.purpose ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-blue-500/50"
              )}
              placeholder="Operational requirement or reason for access..."
            />
            {errors.purpose && (
              <p className="text-[10px] font-bold uppercase tracking-tight text-red-400 mt-2 ml-1">{errors.purpose}</p>
            )}
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
              disabled={loading.reservations}
            >
              {loading.reservations ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2" />
                  Commit Registry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};



