/**
 * HandoverCard Component
 * 
 * Individual handover card component for displaying handover summary.
 */

import React from 'react';
import { Card, CardContent } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { cn } from '../../../utils/cn';
import type { Handover } from '../types';

export interface HandoverCardProps {
  handover: Handover;
  onSelect: (handover: Handover) => void;
  onComplete?: (id: string) => void;
  getShiftTypeBadge: (shiftType: string) => React.ReactNode;
  getStatusBadgeClass: (status: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
}

/**
 * Badge helper function
 */
const getShiftTypeBadge = (shiftType: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    morning: { label: 'Morning', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    afternoon: { label: 'Afternoon', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    night: { label: 'Night', className: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  };

  const badge = badges[shiftType] || badges.morning;
  return (
    <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border', badge.className)}>
      {badge.label}
    </span>
  );
};

/**
 * Status badge class helper
 */
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'in_progress':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'pending':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'overdue':
      return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Priority badge class helper
 */
const getPriorityBadgeClass = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    case 'high':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'low':
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Handover Card Component
 */
export const HandoverCard: React.FC<HandoverCardProps> = ({
  handover,
  onSelect,
  onComplete,
  getShiftTypeBadge: customGetShiftTypeBadge,
  getStatusBadgeClass: customGetStatusBadgeClass,
  getPriorityBadgeClass: customGetPriorityBadgeClass,
}) => {
  const getShiftTypeBadgeFn = customGetShiftTypeBadge || getShiftTypeBadge;
  const getStatusBadgeClassFn = customGetStatusBadgeClass || getStatusBadgeClass;
  const getPriorityBadgeClassFn = customGetPriorityBadgeClass || getPriorityBadgeClass;

  return (
    <Card
      className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 hover:border-blue-500/30 transition-all duration-300 cursor-pointer hover:shadow-2xl shadow-lg"
      onClick={() => onSelect(handover)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20">
              <i className="fas fa-exchange-alt text-white text-lg" />
            </div>
            <div>
              <h4 className="font-black text-[color:var(--text-main)] text-lg uppercase tracking-tighter">
                {handover.handoverFrom} → {handover.handoverTo}
              </h4>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-wider opacity-70">
                {handover.shiftType.charAt(0).toUpperCase() + handover.shiftType.slice(1)} Shift
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getShiftTypeBadgeFn(handover.shiftType)}
            <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getStatusBadgeClassFn(handover.status))}>
              {handover.status.toUpperCase().replace('_', ' ')}
            </span>
            <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border', getPriorityBadgeClassFn(handover.priority))}>
              {handover.priority.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-[color:var(--text-sub)] mb-4 text-sm leading-relaxed font-medium opacity-80">{handover.handoverNotes}</p>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/60">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <i className="fas fa-calendar mr-1.5 text-blue-400" />
              {new Date(handover.handoverDate).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <i className="fas fa-clock mr-1.5 text-blue-400" />
              {handover.startTime} - {handover.endTime}
            </span>
            <span className="flex items-center">
              <i className="fas fa-list-check mr-1.5 text-blue-400" />
              {handover.checklistItems.length} Items
            </span>
          </div>
          {handover.status !== 'completed' && onComplete && (
            <Button
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onComplete(handover.id);
              }}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[9px] px-4 h-8 border-none"
            >
              <i className="fas fa-check mr-1" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};



