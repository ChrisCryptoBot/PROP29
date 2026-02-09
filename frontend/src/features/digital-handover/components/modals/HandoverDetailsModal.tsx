/**
 * HandoverDetailsModal Component
 *
 * Modal for displaying detailed handover information. Uses global Modal (UI gold standard).
 */

import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { cn } from '../../../../utils/cn';
import type { Handover } from '../../types';

export interface HandoverDetailsModalProps {
  handover: Handover;
  onClose: () => void;
  onEdit?: (handover: Handover) => void;
  onDelete?: (id: string) => void;
  /** When provided, Delete button opens this confirm flow instead of calling onDelete directly */
  onDeleteRequest?: (handover: Handover) => void;
  getShiftTypeBadge: (shiftType: string) => React.ReactNode;
  getStatusBadgeClass: (status: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
}

export const HandoverDetailsModal: React.FC<HandoverDetailsModalProps> = ({
  handover,
  onClose,
  onEdit,
  onDelete,
  onDeleteRequest,
  getShiftTypeBadge,
  getStatusBadgeClass,
  getPriorityBadgeClass,
}) => {
  const handleDeleteClick = () => {
    if (onDeleteRequest) {
      onDeleteRequest(handover);
    } else if (onDelete) {
      onDelete(handover.id);
    }
  };

  return (
    <Modal
      isOpen={!!handover}
      onClose={onClose}
      title="Handover details"
      size="xl"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(handover)}>
              Edit
            </Button>
          )}
          {(onDelete || onDeleteRequest) && (
            <Button variant="destructive" onClick={handleDeleteClick} aria-label="Delete handover">
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</span>
            <span className={cn('px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getStatusBadgeClass(handover.status))}>
              {handover.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Priority</span>
            <span className={cn('px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getPriorityBadgeClass(handover.priority))}>
              {handover.priority.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Shift</span>
            {getShiftTypeBadge(handover.shiftType)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Effective date</p>
            <p className="text-white font-bold">{new Date(handover.handoverDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Duty cycle</p>
            <p className="text-white font-bold">{handover.startTime} – {handover.endTime}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">From</p>
            <p className="text-white font-bold">{handover.handoverFrom}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">To</p>
            <p className="text-white font-bold">{handover.handoverTo}</p>
          </div>
          {handover.operationalPost && (
            <div className="lg:col-span-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Post / zone</p>
              <p className="text-white font-bold">{handover.operationalPost}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Notes</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {handover.handoverNotes || 'No notes recorded.'}
            </p>
          </div>
          <div className="space-y-4">
            {handover.specialInstructions && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/80 mb-2">Special instructions</p>
                <p className="text-sm text-amber-200/90">{handover.specialInstructions}</p>
              </div>
            )}
            {handover.equipmentStatus && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Equipment</p>
                <p className="text-sm text-slate-300">{handover.equipmentStatus}</p>
              </div>
            )}
          </div>
        </div>

        {handover.checklistItems && handover.checklistItems.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">
              Checklist ({handover.checklistItems.filter(i => i.status === 'completed').length}/{handover.checklistItems.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handover.checklistItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-md">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm uppercase tracking-tight truncate">{item.title}</p>
                    <span className={cn(
                      'inline-block mt-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border',
                      item.status === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}>
                      {item.status}
                    </span>
                  </div>
                  {item.status === 'completed' && <i className="fas fa-check text-green-400 text-xs" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>ID: <span className="text-slate-400 font-mono font-normal">{handover.id.slice(0, 8).toUpperCase()}</span></span>
          <span>Created: <span className="text-slate-400 font-normal">{new Date(handover.createdAt).toLocaleString()}</span></span>
          {(handover.completedAt || handover.completedBy) && (
            <span className="text-blue-400">Verified by {handover.completedBy || 'System'} @ {new Date(handover.completedAt || handover.createdAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};



