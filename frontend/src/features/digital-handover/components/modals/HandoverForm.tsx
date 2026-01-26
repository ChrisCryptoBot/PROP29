/**
 * HandoverForm Component
 * 
 * Modal form component for creating and editing handovers.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { ChecklistItemEditor } from '../ChecklistItemEditor';
import { cn } from '../../../../utils/cn';
import type { Handover, ChecklistItem, ShiftType, HandoverPriority as Priority, CreateHandoverRequest } from '../../types';
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

  if (!isOpen) return null;

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
    } catch (error) {
      console.error('Failed to submit handover:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className={`fas ${mode === 'create' ? 'fa-plus' : 'fa-edit'} text-white text-sm`} />
              </div>
              {mode === 'create' ? 'Create New Handover' : 'Edit Handover'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="border-[color:var(--border-subtle)]/50 text-[color:var(--text-sub)] hover:text-white hover:bg-white/5"
            >
              <i className="fas fa-times" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  Shift Type <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as ShiftType })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:border-white/20"
                >
                  {SHIFT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-slate-900 text-white">
                      {SHIFT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  Handover Date <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  value={formData.handoverDate}
                  onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                  className={cn(
                    "w-full h-11 px-4 bg-white/5 border rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-white/20",
                    errors.handoverDate ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.handoverDate && (
                  <p className="text-sm text-red-400">{errors.handoverDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  Handover From <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handoverFrom}
                  onChange={(e) => setFormData({ ...formData, handoverFrom: e.target.value })}
                  className={cn(
                    "w-full h-11 px-4 bg-white/5 border rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30 hover:border-white/20",
                    errors.handoverFrom ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                  placeholder="Enter officer name"
                />
                {errors.handoverFrom && (
                  <p className="text-sm text-red-400">{errors.handoverFrom}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  Handover To <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handoverTo}
                  onChange={(e) => setFormData({ ...formData, handoverTo: e.target.value })}
                  className={cn(
                    "w-full h-11 px-4 bg-white/5 border rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30 hover:border-white/20",
                    errors.handoverTo ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                  placeholder="Enter officer name"
                />
                {errors.handoverTo && (
                  <p className="text-sm text-red-400">{errors.handoverTo}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  Start Time <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={cn(
                    "w-full h-11 px-4 bg-white/5 border rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-white/20",
                    errors.startTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-400">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">
                  End Time <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={cn(
                    "w-full h-11 px-4 bg-white/5 border rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-white/20",
                    errors.endTime ? "border-red-500/50 focus:ring-red-500/30" : "border-white/5"
                  )}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-400">{errors.endTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:border-white/20"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority} className="bg-slate-900 text-white">
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Operational Post</label>
                <input
                  type="text"
                  value={formData.operationalPost}
                  onChange={(e) => setFormData({ ...formData, operationalPost: e.target.value })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30 hover:border-white/20"
                  placeholder="e.g., Lobby, Loading Dock, Patrol"
                />
              </div>
            </div>

            {/* Handover Notes */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Handover Notes</label>
              <textarea
                value={formData.handoverNotes}
                onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-lg text-[color:var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30 hover:border-white/20 min-h-[120px]"
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[color:var(--border-subtle)]/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-white/5 text-slate-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-8 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-[10px] px-8 h-11 border-none"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${mode === 'create' ? 'fa-check' : 'fa-save'} mr-2`} />
                    {mode === 'create' ? 'Create Handover' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};



