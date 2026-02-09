import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { getStatusBadgeVariant, getPriorityBadgeVariant, formatTicketCategory } from '../../utils/helpSupportHelpers';
import type { SupportTicket, UpdateTicketPayload, TicketStatus, TicketPriority, TicketCategory } from '../../types';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket | null;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  onUpdate: (id: string, payload: UpdateTicketPayload) => void;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' }
];

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  isEditMode,
  setEditMode,
  onUpdate
}) => {
  const [editForm, setEditForm] = useState<UpdateTicketPayload>({});

  useEffect(() => {
    if (ticket) {
      setEditForm({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category
      });
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = () => {
    onUpdate(ticket.id, editForm);
    setEditMode(false);
  };

  const body = isEditMode ? (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Title</label>
        <input
          type="text"
          value={editForm.title ?? ''}
          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
        <textarea
          value={editForm.description ?? ''}
          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</label>
          <select
            value={editForm.status ?? ticket.status}
            onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as TicketStatus }))}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Priority</label>
          <select
            value={editForm.priority ?? ticket.priority}
            onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
          <select
            value={editForm.category ?? ticket.category}
            onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value as TicketCategory }))}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
        <span className="text-slate-400 text-sm">{formatTicketCategory(ticket.category)}</span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description</p>
        <p className="text-white whitespace-pre-wrap">{ticket.description}</p>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-white/5 pt-4">
        <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
        {ticket.assignedTo && <p>Assigned to: {ticket.assignedTo}</p>}
      </div>
    </div>
  );

  const footer = isEditMode ? (
    <>
      <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={onClose}>Close</Button>
      <Button variant="outline" onClick={() => setEditMode(true)}>
        <i className="fas fa-edit mr-1" aria-hidden />
        Edit
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Ticket' : ticket.title}
      size="lg"
      footer={footer}
    >
      {body}
    </Modal>
  );
};
