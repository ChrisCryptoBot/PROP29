/**
 * Status Badge Component
 * Displays visitor status with appropriate styling
 */

import React from 'react';
import { cn } from '../../../../utils/cn';
import type { VisitorStatus } from '../../types/visitor-security.types';

export interface StatusBadgeProps {
  status: VisitorStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, className }) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'checked_out':
        return 'text-[color:var(--text-sub)] bg-white/5 border-white/5';
      case 'overdue':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'registered':
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.toUpperCase().replace('_', ' ');
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border",
        getStatusClasses(status),
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
