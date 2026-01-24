/**
 * Smart Lockers Module - Badge Helper Functions
 * Centralized badge styling helpers for consistent UI
 */

import type { LockerStatus, LockerSize, ReservationStatus } from '../types/locker.types';

/**
 * Get badge class for locker status
 */
export const getStatusBadgeClass = (status: LockerStatus | string): string => {
  switch (status) {
    case 'available': return 'text-green-800 bg-green-100';
    case 'occupied': return 'text-blue-800 bg-blue-100';
    case 'maintenance': return 'text-yellow-800 bg-yellow-100';
    case 'out_of_service': return 'text-red-800 bg-red-100';
    default: return 'text-slate-800 bg-slate-100';
  }
};

/**
 * Get badge class for locker size
 */
export const getSizeBadgeClass = (size: LockerSize | string): string => {
  switch (size) {
    case 'small': return 'text-slate-800 bg-slate-100';
    case 'medium': return 'text-blue-800 bg-blue-100';
    case 'large': return 'text-purple-800 bg-purple-100';
    default: return 'text-slate-800 bg-slate-100';
  }
};

/**
 * Get badge class for reservation status
 */
export const getReservationStatusBadgeClass = (status: ReservationStatus | string): string => {
  switch (status) {
    case 'active': return 'text-green-800 bg-green-100';
    case 'completed': return 'text-slate-800 bg-slate-100';
    case 'cancelled': return 'text-red-800 bg-red-100';
    default: return 'text-slate-800 bg-slate-100';
  }
};
