/**
 * Smart Lockers - Reservation Modal
 * Gold standard: uses shared Modal, flat content, footer actions.
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { createReservationSchema, type CreateReservationInput } from '../../types/locker.schema';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const submitData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };
    const validationResult = createReservationSchema.safeParse(submitData);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((error: ZodIssue) => {
        if (error.path[0]) newErrors[error.path[0].toString()] = error.message;
      });
      setErrors(newErrors);
      return;
    }
    try {
      await createReservation(validationResult.data);
      handleClose();
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <Modal
      isOpen={showReservationModal}
      onClose={handleClose}
      title="Create Reservation"
      size="md"
      footer={
        <>
          <Button type="button" variant="subtle" onClick={handleClose} className="font-black uppercase tracking-widest">
            Cancel
          </Button>
          <Button
            type="submit"
            form="reservation-form"
            variant="primary"
            className="font-black uppercase tracking-widest px-10"
            disabled={loading.reservations}
          >
            {loading.reservations ? (
              <><i className="fas fa-spinner fa-spin mr-2" />Processing...</>
            ) : (
              <><i className="fas fa-check mr-2" />Create Reservation</>
            )}
          </Button>
        </>
      }
    >
      <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Locker <span className="text-red-500">*</span></label>
          <select
            value={formData.lockerId}
            onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, lockerId: e.target.value }))}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 [&>option]:bg-slate-900',
              errors.lockerId ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
          >
            <option value="">Select locker</option>
            {lockers.filter(l => l.status === 'available').map((locker) => (
              <option key={locker.id} value={locker.id}>
                {locker.lockerNumber} – {formatLocationDisplay(locker.location) || '—'}
              </option>
            ))}
          </select>
          {errors.lockerId && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.lockerId}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Guest ID <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.guestId}
            onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, guestId: e.target.value }))}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 placeholder-slate-500',
              errors.guestId ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
            placeholder="e.g. G-1001"
          />
          {errors.guestId && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.guestId}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Guest name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.guestName}
            onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, guestName: e.target.value }))}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 placeholder-slate-500',
              errors.guestName ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
            placeholder="John Doe"
          />
          {errors.guestName && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.guestName}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Start <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, startTime: e.target.value }))}
              className={cn(
                'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10',
                errors.startTime ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
              )}
            />
            {errors.startTime && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">End <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, endTime: e.target.value }))}
              className={cn(
                'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10',
                errors.endTime ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
              )}
            />
            {errors.endTime && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.endTime}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Purpose <span className="text-red-500">*</span></label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData((prev: CreateReservationInput) => ({ ...prev, purpose: e.target.value }))}
            rows={2}
            className={cn(
              'w-full px-3 py-2 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:bg-white/10 placeholder-slate-500 resize-none',
              errors.purpose ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/5 focus:ring-blue-500/20'
            )}
            placeholder="Reason for reservation"
          />
          {errors.purpose && <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1 mt-1">{errors.purpose}</p>}
        </div>
      </form>
    </Modal>
  );
};
