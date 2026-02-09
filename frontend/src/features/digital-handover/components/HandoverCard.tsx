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
import { getShiftTypeBadge as defaultGetShiftTypeBadge, getStatusBadgeClass as defaultGetStatusBadgeClass, getPriorityBadgeClass as defaultGetPriorityBadgeClass } from '../utils/badgeHelpers';

export interface HandoverCardProps {
  handover: Handover;
  onSelect: (handover: Handover) => void;
  onComplete?: (id: string) => void;
  getShiftTypeBadge?: (shiftType: string) => React.ReactNode;
  getStatusBadgeClass?: (status: string) => string;
  getPriorityBadgeClass?: (priority: string) => string;
}

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
  const getShiftTypeBadgeFn = customGetShiftTypeBadge ?? defaultGetShiftTypeBadge;
  const getStatusBadgeClassFn = customGetStatusBadgeClass ?? defaultGetStatusBadgeClass;
  const getPriorityBadgeClassFn = customGetPriorityBadgeClass ?? defaultGetPriorityBadgeClass;

  return (
    <Card
      className="bg-slate-900/50 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
      onClick={() => onSelect(handover)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="card-title-icon-box">
              <i className="fas fa-exchange-alt text-white" />
            </div>
            <div>
              <h4 className="card-title-text">
                {handover.handoverFrom} → {handover.handoverTo}
              </h4>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-wider">
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



