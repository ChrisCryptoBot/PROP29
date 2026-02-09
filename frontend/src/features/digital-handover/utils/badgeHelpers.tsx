/**
 * Digital Handover — Badge helpers (single source of truth)
 * Use for shift type, status, and priority badges across the module.
 */

import React from 'react';
import { cn } from '../../../utils/cn';

const SHIFT_BADGES: Record<string, { label: string; className: string }> = {
  morning: { label: 'Morning', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  afternoon: { label: 'Afternoon', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  night: { label: 'Night', className: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const BASE_BADGE = 'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border';

export function getShiftTypeBadge(shiftType: string): React.ReactNode {
  const badge = SHIFT_BADGES[shiftType] || SHIFT_BADGES.morning;
  return (
    <span className={cn(BASE_BADGE, badge.className)}>
      {badge.label}
    </span>
  );
}

export function getShiftTypeBadgeClass(shiftType: string): string {
  const badge = SHIFT_BADGES[shiftType] || SHIFT_BADGES.morning;
  return cn(BASE_BADGE, badge.className);
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    completed: 'text-green-400 bg-green-500/10 border-green-500/20',
    in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    overdue: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return cn(BASE_BADGE, map[status] ?? 'text-white/40 bg-white/5 border-white/5');
}

export function getPriorityBadgeClass(priority: string): string {
  const map: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    low: 'text-white/40 bg-white/5 border-white/5',
  };
  return cn(BASE_BADGE, map[priority] ?? 'text-white/40 bg-white/5 border-white/5');
}
