/**
 * Visitor List Item Component
 * Reusable component for displaying visitor information in lists
 */

import React from 'react';
import { Avatar } from '../../../../components/UI/Avatar';
import { Button } from '../../../../components/UI/Button';
import { StatusBadge } from './StatusBadge';
import { SecurityClearanceBadge } from './SecurityClearanceBadge';
import { cn } from '../../../../utils/cn';
import type { Visitor } from '../../types/visitor-security.types';

export interface VisitorListItemProps {
  visitor: Visitor;
  onSelect?: (visitor: Visitor) => void;
  onCheckIn?: (visitorId: string) => void;
  onCheckOut?: (visitorId: string) => void;
  onGenerateQR?: (visitor: Visitor) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const VisitorListItem: React.FC<VisitorListItemProps> = React.memo(({
  visitor,
  onSelect,
  onCheckIn,
  onCheckOut,
  onGenerateQR,
  showActions = true,
  compact = false
}) => {
  const handleClick = () => {
    onSelect?.(visitor);
  };

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckIn?.(visitor.id);
  };

  const handleCheckOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckOut?.(visitor.id);
  };

  const handleGenerateQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateQR?.(visitor);
  };

  const isOverdue = visitor.status === 'overdue';

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all group",
        onSelect ? 'cursor-pointer' : '',
        isOverdue
          ? "bg-red-500/5 border-red-500/30 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      )}
      onClick={handleClick}
    >
      {isOverdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse" />
      )}

      <div className="flex items-center space-x-4 flex-1">
        <div className="relative">
          <Avatar className={cn(
            "border",
            isOverdue
              ? "bg-red-900/50 border-red-500/50 ring-2 ring-red-500/20"
              : "bg-gradient-to-br from-blue-700 to-indigo-900 border-white/10"
          )}>
            {visitor.first_name[0]}{visitor.last_name[0]}
          </Avatar>
          {isOverdue && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-black shadow-lg z-10">
              <i className="fas fa-clock text-[8px] text-white animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn("font-bold transition-colors", isOverdue ? "text-red-400" : "text-[color:var(--text-main)] group-hover:text-blue-400")}>
              {visitor.first_name} {visitor.last_name}
            </h4>
            {isOverdue && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded animate-pulse">
                EXPIRED
              </span>
            )}
          </div>
          <p className="text-sm text-[color:var(--text-sub)]/70">
            {visitor.purpose} <span className="mx-1 opacity-30">•</span> {visitor.location}
          </p>
          {visitor.event_name && !compact && (
            <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              {visitor.event_name}
            </span>
          )}
        </div>
      </div>
      {showActions && (
        <div className="flex items-center space-x-3">
          <SecurityClearanceBadge clearance={visitor.security_clearance} />
          {visitor.status === 'registered' && onCheckIn && (
            <Button
              size="sm"
              onClick={handleCheckIn}
              variant="primary"
              className="text-[10px] font-black uppercase tracking-widest px-4"
            >
              Check In
            </Button>
          )}
          {(visitor.status === 'checked_in' || visitor.status === 'overdue') && onCheckOut && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckOut}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-4 hover:text-white",
                isOverdue
                  ? "border-red-500/30 text-red-400 hover:bg-red-500 hover:border-red-500"
                  : "text-[color:var(--text-sub)] border-[color:var(--border-subtle)]"
              )}
            >
              Check Out
            </Button>
          )}
          {visitor.qr_code && onGenerateQR && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateQR}
              className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
            >
              <i className="fas fa-qrcode" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

VisitorListItem.displayName = 'VisitorListItem';
