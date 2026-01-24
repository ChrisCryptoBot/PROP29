/**
 * Security Clearance Badge Component
 * Displays security clearance status with appropriate styling
 */

import React from 'react';
import { cn } from '../../../../utils/cn';
import type { SecurityClearance } from '../../types/visitor-security.types';

export interface SecurityClearanceBadgeProps {
  clearance: SecurityClearance | string;
  className?: string;
}

export const SecurityClearanceBadge: React.FC<SecurityClearanceBadgeProps> = React.memo(({ clearance, className }) => {
  const getClearanceClasses = (clearance: string) => {
    switch (clearance) {
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'denied':
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border",
        getClearanceClasses(clearance),
        className
      )}
    >
      {clearance.toUpperCase()}
    </span>
  );
});

SecurityClearanceBadge.displayName = 'SecurityClearanceBadge';
