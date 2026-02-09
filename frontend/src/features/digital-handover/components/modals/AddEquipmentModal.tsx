/**
 * AddEquipmentModal
 *
 * Modal to add new equipment. Submits to createEquipment and triggers refresh.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import type { CreateEquipmentRequest, EquipmentCategory, EquipmentStatus } from '../../types';

const CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: 'security', label: 'Security' },
  { value: 'communication', label: 'Communication' },
  { value: 'surveillance', label: 'Surveillance' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'safety', label: 'Safety' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: EquipmentStatus; label: string }[] = [
  { value: 'operational', label: 'Operational' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'reserved', label: 'Reserved' },
];

export interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEquipmentRequest) => Promise<void>;
}

const initialForm: CreateEquipmentRequest = {
  name: '',
  category: 'other',
  location: '',
  status: 'operational',
  operationalPost: '',
  serialNumber: '',
  manufacturer: '',
  model: '',
  notes: '',
};

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<CreateEquipmentRequest>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name?.trim()) err.name = 'Name is required';
    if (!form.location?.trim()) err.location = 'Location is required';
    setErrors(err);
    if (Object.keys(err).length) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        location: form.location.trim(),
        operationalPost: form.operationalPost?.trim() || undefined,
        serialNumber: form.serialNumber?.trim() || undefined,
        manufacturer: form.manufacturer?.trim() || undefined,
        model: form.model?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Equipment"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add Equipment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Main Lobby Camera"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'err-name' : undefined}
          />
          {errors.name && (
            <p id="err-name" className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as EquipmentCategory }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EquipmentStatus }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Location <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            placeholder="e.g. Building A, Floor 1"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? 'err-location' : undefined}
          />
          {errors.location && (
            <p id="err-location" className="text-red-400 text-xs mt-1">{errors.location}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Operational Post
          </label>
          <input
            type="text"
            value={form.operationalPost ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, operationalPost: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            placeholder="Optional"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Serial Number
            </label>
            <input
              type="text"
              value={form.serialNumber ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              value={form.manufacturer ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Model
          </label>
          <input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Notes
          </label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
