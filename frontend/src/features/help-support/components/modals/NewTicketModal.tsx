import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import type { CreateTicketPayload, TicketPriority, TicketCategory } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateTicketPayload;
  setForm: (v: CreateTicketPayload | ((prev: CreateTicketPayload) => CreateTicketPayload)) => void;
  onSubmit: (payload: CreateTicketPayload) => void;
}

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' }
];

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit
}) => {
  const handleSubmit = () => {
    if (!form.title?.trim() || !form.description?.trim()) return;
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Support Ticket"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.title?.trim() || !form.description?.trim()}
          >
            Create Ticket
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the issue"
            aria-required
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Detailed description, steps to reproduce, etc."
            aria-required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [&_option]:bg-slate-800 [&_option]:text-slate-100"
            >
              {PRIORITIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TicketCategory }))}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-white/10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [&_option]:bg-slate-800 [&_option]:text-slate-100"
            >
              {CATEGORIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
