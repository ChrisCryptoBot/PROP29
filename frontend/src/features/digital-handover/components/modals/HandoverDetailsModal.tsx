/**
 * HandoverDetailsModal Component
 * 
 * Modal for displaying detailed handover information.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import type { Handover } from '../../types';

export interface HandoverDetailsModalProps {
  handover: Handover;
  onClose: () => void;
  onEdit?: (handover: Handover) => void;
  onDelete?: (id: string) => void;
  getShiftTypeBadge: (shiftType: string) => React.ReactNode;
  getStatusBadgeClass: (status: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
}

/**
 * Handover Details Modal Component
 */
export const HandoverDetailsModal: React.FC<HandoverDetailsModalProps> = ({
  handover,
  onClose,
  onEdit,
  onDelete,
  getShiftTypeBadge,
  getStatusBadgeClass,
  getPriorityBadgeClass,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-8 pt-8 pb-6 border-b border-white/5">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center text-2xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-file-alt text-white text-xl" />
              </div>
              Handover Clearance Record
            </div>
            <div className="flex items-center space-x-3">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(handover)}
                  className="border-white/5 text-blue-300 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 h-10 shadow-lg shadow-blue-500/10"
                >
                  <i className="fas fa-edit mr-2" />
                  Edit Entry
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this handover?')) {
                      onDelete(handover.id);
                    }
                  }}
                  className="border-red-500/20 text-red-500 hover:text-white hover:bg-red-500/20 font-black uppercase tracking-widest text-[10px] px-6 h-10"
                >
                  <i className="fas fa-trash-alt mr-2" />
                  Purge Record
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-white/5 text-slate-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-4 h-10"
              >
                <i className="fas fa-times" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center space-x-3 pr-6 border-r border-white/5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Operation Status</div>
              <span className={cn('px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getStatusBadgeClass(handover.status))}>
                {handover.status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center space-x-3 pr-6 border-r border-white/5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hazard Level</div>
              <span className={cn('px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getPriorityBadgeClass(handover.priority))}>
                {handover.priority.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Temporal Phase</div>
              {getShiftTypeBadge(handover.shiftType)}
            </div>
          </div>

          {/* Read-Only Data Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective Date</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center space-x-3 group-hover:border-blue-500/30 transition-all">
                <i className="fas fa-calendar-day text-blue-400 opacity-50" />
                <span className="text-sm font-medium text-white">{new Date(handover.handoverDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="group">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duty Cycle</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center space-x-3 group-hover:border-blue-500/30 transition-all">
                <i className="fas fa-clock text-blue-400 opacity-50" />
                <span className="text-sm font-medium text-white">{handover.startTime} - {handover.endTime}</span>
              </div>
            </div>

            <div className="group">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relieved Officer</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center space-x-3 group-hover:border-blue-500/30 transition-all">
                <i className="fas fa-user-minus text-blue-400 opacity-50" />
                <span className="text-sm font-medium text-white uppercase tracking-tight">{handover.handoverFrom}</span>
              </div>
            </div>

            <div className="group">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Incoming Officer</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center space-x-3 group-hover:border-blue-500/30 transition-all">
                <i className="fas fa-user-plus text-blue-400 opacity-50" />
                <span className="text-sm font-medium text-white uppercase tracking-tight">{handover.handoverTo}</span>
              </div>
            </div>

            {handover.operationalPost && (
              <div className="group lg:col-span-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operational Post / Zone</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center space-x-3 group-hover:border-blue-500/30 transition-all">
                  <i className="fas fa-shield-alt text-blue-400 opacity-50" />
                  <span className="text-sm font-medium text-white uppercase tracking-tight">{handover.operationalPost}</span>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Intelligence (Notes, Special Instructions) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-book-open text-blue-400 text-xs" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Shift Narrative & Observations</h4>
              </div>
              <div className="bg-white/5 border border-white/5 p-5 rounded-xl min-h-[150px] relative group hover:border-blue-500/20 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <i className="fas fa-pen-fancy text-4xl text-white" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap relative z-10">
                  {handover.handoverNotes || "No tactical observations recorded for this shift cycle."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {handover.specialInstructions && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-exclamation-circle text-amber-500 text-xs" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70">Critical Instructions</h4>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-sm text-amber-200/80 italic">
                    {handover.specialInstructions}
                  </div>
                </div>
              )}

              {handover.equipmentStatus && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-tools text-blue-400 text-xs" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asset & Equipment Integrity</h4>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-slate-300">
                    {handover.equipmentStatus}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Items */}
          {handover.checklistItems && handover.checklistItems.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-tasks text-blue-400 text-xs" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operational Checklist</h4>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {handover.checklistItems.filter(i => i.status === 'completed').length} / {handover.checklistItems.length} Tasks Finalized
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {handover.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl transition-all hover:bg-white/10 hover:border-blue-500/20 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[color:var(--text-main)] text-sm uppercase tracking-tight truncate group-hover:text-blue-400 transition-colors">{item.title}</div>
                      <div className="flex items-center gap-3 mt-2 overflow-hidden">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border',
                            item.status === 'completed'
                              ? 'text-green-400 bg-green-500/10 border-green-500/20'
                              : item.status === 'skipped'
                                ? 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          )}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 opacity-60 truncate">{item.category}</span>
                        {item.assignedTo && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 opacity-60 border-l border-white/5 pl-3">Ref: {item.assignedTo}</span>
                        )}
                      </div>
                    </div>
                    {item.status === 'completed' ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                        <i className="fas fa-check text-green-400 text-xs" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center ml-4">
                        <i className="fas fa-hourglass-half text-slate-600 text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-white/5">
            <div className="flex items-center space-x-6">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                System Artifact: <span className="text-slate-400 font-mono">DH-{handover.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Generated: <span className="text-slate-400">{new Date(handover.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {(handover.completedAt || handover.completedBy) && (
              <div className="flex items-center bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
                <i className="fas fa-user-shield text-blue-400 mr-3" />
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  Verified by <span className="text-white ml-2">{handover.completedBy || "System Admin"}</span>
                  <span className="ml-3 opacity-60">@{new Date(handover.completedAt || handover.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



