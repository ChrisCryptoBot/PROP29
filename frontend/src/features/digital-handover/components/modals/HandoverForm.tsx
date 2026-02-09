/**
 * HandoverForm Component
 *
 * Modal form for creating and editing handovers. Uses global Modal (z-[100])
 * so it appears above sticky tabs; gold standard: no close X, footer actions only.
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { ChecklistItemEditor } from '../ChecklistItemEditor';
import { cn } from '../../../../utils/cn';
import type { Handover, ShiftType, HandoverPriority as Priority, CreateHandoverRequest } from '../../types';
import { SHIFT_TYPES, PRIORITIES, PRIORITY_LABELS, SHIFT_TYPE_LABELS } from '../../utils/constants';

export interface HandoverFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHandoverRequest) => Promise<void>;
  initialData?: Handover | null;
  mode?: 'create' | 'edit';
}

/**
 * Handover Form Component
 */
export const HandoverForm: React.FC<HandoverFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const [formData, setFormData] = React.useState<CreateHandoverRequest>({
    shiftType: (initialData?.shiftType || 'morning') as ShiftType,
    handoverDate: initialData?.handoverDate || new Date().toISOString().split('T')[0],
    handoverFrom: initialData?.handoverFrom || '',
    handoverTo: initialData?.handoverTo || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    priority: (initialData?.priority || 'medium') as Priority,
    handoverNotes: initialData?.handoverNotes || '',
    operationalPost: initialData?.operationalPost || '',
    linkedIncidentIds: initialData?.linkedIncidentIds || [],
    checklistItems: (initialData?.checklistItems || []).map((item) => ({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      assignedTo: item.assignedTo,
      dueDate: item.dueDate,
    })),
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        shiftType: (initialData.shiftType || 'morning') as ShiftType,
        handoverDate: initialData.handoverDate || new Date().toISOString().split('T')[0],
        handoverFrom: initialData.handoverFrom || '',
        handoverTo: initialData.handoverTo || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        priority: (initialData.priority || 'medium') as Priority,
        handoverNotes: initialData.handoverNotes || '',
        operationalPost: initialData.operationalPost || '',
        linkedIncidentIds: initialData.linkedIncidentIds || [],
        checklistItems: (initialData.checklistItems || []).map((item) => ({
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          assignedTo: item.assignedTo,
          dueDate: item.dueDate,
        })),
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.handoverFrom.trim()) {
      newErrors.handoverFrom = 'Handover From is required';
    }
    if (!formData.handoverTo.trim()) {
      newErrors.handoverTo = 'Handover To is required';
    }
    if (!formData.handoverDate) {
      newErrors.handoverDate = 'Handover Date is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start Time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form after successful submission
      if (mode === 'create') {
        setFormData({
          shiftType: 'morning',
          handoverDate: new Date().toISOString().split('T')[0],
          handoverFrom: '',
          handoverTo: '',
          startTime: '',
          endTime: '',
          priority: 'medium',
          handoverNotes: '',
          operationalPost: '',
          linkedIncidentIds: [],
          checklistItems: [],
        });
        setErrors({});
      }
    } catch {
      // Error surfaced via toast where applicable
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Handover' : 'Edit Handover'}
      size="lg"
      draggable={true}
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="subtle"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="handover-form"
            disabled={isSubmitting}
            variant="primary"
            className="font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-none"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <i className={cn('fas mr-2', mode === 'create' ? 'fa-check' : 'fa-save')} aria-hidden />
                {mode === 'create' ? 'Create Handover' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="handover-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Shift Type <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as ShiftType })}
                  className="w-full h-10 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                >
                  {SHIFT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-slate-900 text-white">
                      {SHIFT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Handover Date <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  value={formData.handoverDate}
                  onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                  className={cn(
                    "w-full h-10 px-3 py-2 bg-white/5 border rounded-md text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono",
                    errors.handoverDate ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.handoverDate && (
                  <p className="text-sm text-red-400">{errors.handoverDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Handover From <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handoverFrom}
                  onChange={(e) => setFormData({ ...formData, handoverFrom: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 h-10 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500",
                    errors.handoverFrom ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                  placeholder="Enter officer name"
                />
                {errors.handoverFrom && (
                  <p className="text-sm text-red-400">{errors.handoverFrom}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Handover To <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handoverTo}
                  onChange={(e) => setFormData({ ...formData, handoverTo: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 h-10 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500",
                    errors.handoverTo ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                  placeholder="Enter officer name"
                />
                {errors.handoverTo && (
                  <p className="text-sm text-red-400">{errors.handoverTo}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Start Time <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 h-10 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono",
                    errors.startTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-400">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  End Time <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 h-10 bg-white/5 border rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono",
                    errors.endTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-400">{errors.endTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full h-10 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority} className="bg-slate-900 text-white">
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Operational Post</label>
                <input
                  type="text"
                  value={formData.operationalPost}
                  onChange={(e) => setFormData({ ...formData, operationalPost: e.target.value })}
                  className="w-full px-3 py-2 h-10 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                  placeholder="e.g., Lobby, Loading Dock, Patrol"
                />
              </div>
            </div>

            {/* Handover Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Handover Notes</label>
              <textarea
                value={formData.handoverNotes}
                onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500 min-h-[120px] resize-y"
                placeholder="Enter handover notes and important information"
              />
            </div>


            {/* Checklist Items */}
            <ChecklistItemEditor
              items={formData.checklistItems}
              onItemsChange={(items) => {
                setFormData({ ...formData, checklistItems: items });
              }}
            />
      </form>
    </Modal>
  );
};



