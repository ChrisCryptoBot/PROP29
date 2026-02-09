/**
 * CreateMaintenanceRequestModal
 *
 * Modal to create a new maintenance request. Submits to createMaintenanceRequest and triggers refresh.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import type { CreateMaintenanceRequestRequest, MaintenancePriority } from '../../types';

const PRIORITIES: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export interface CreateMaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMaintenanceRequestRequest) => Promise<void>;
  /** Optional: current user name for reportedBy default */
  defaultReportedBy?: string;
}

const initialForm: CreateMaintenanceRequestRequest = {
  title: '',
  description: '',
  location: '',
  priority: 'medium',
  reportedBy: '',
  equipmentId: '',
  notes: '',
};

export const CreateMaintenanceRequestModal: React.FC<CreateMaintenanceRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultReportedBy = '',
}) => {
  const [form, setForm] = useState<CreateMaintenanceRequestRequest & { equipmentId?: string; notes?: string }>({
    ...initialForm,
    reportedBy: defaultReportedBy,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...initialForm,
        reportedBy: defaultReportedBy,
        equipmentId: '',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen, defaultReportedBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.title?.trim()) err.title = 'Title is required';
    if (!form.description?.trim()) err.description = 'Description is required';
    if (!form.location?.trim()) err.location = 'Location is required';
    if (!form.reportedBy?.trim()) err.reportedBy = 'Reported by is required';
    setErrors(err);
    if (Object.keys(err).length) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        priority: form.priority,
        reportedBy: form.reportedBy.trim(),
        equipmentId: form.equipmentId?.trim() || undefined,
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
      title="Create Maintenance Request"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Request'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            placeholder="e.g. Camera not recording"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'err-title' : undefined}
          />
          {errors.title && (
            <p id="err-title" className="text-red-400 text-xs mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500 resize-none"
            placeholder="Describe the issue and required action"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'err-description' : undefined}
          />
          {errors.description && (
            <p id="err-description" className="text-red-400 text-xs mt-1">{errors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
              placeholder="e.g. Building A, Lobby"
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? 'err-location' : undefined}
            />
            {errors.location && (
              <p id="err-location" className="text-red-400 text-xs mt-1">{errors.location}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as MaintenancePriority }))}
              className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Reported By <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.reportedBy}
            onChange={(e) => setForm((p) => ({ ...p, reportedBy: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            placeholder="Your name or ID"
            aria-invalid={!!errors.reportedBy}
            aria-describedby={errors.reportedBy ? 'err-reportedBy' : undefined}
          />
          {errors.reportedBy && (
            <p id="err-reportedBy" className="text-red-400 text-xs mt-1">{errors.reportedBy}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)] mb-1">
            Equipment ID
          </label>
          <input
            type="text"
            value={form.equipmentId ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, equipmentId: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-white/10 bg-black/30 text-[color:var(--text-main)] focus:border-blue-500"
            placeholder="Optional – link to equipment"
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
