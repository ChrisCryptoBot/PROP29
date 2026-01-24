/**
 * Smart Lockers Module - Constants
 * Centralized constants for the Smart Lockers feature
 */

import type { LockerStatus, LockerSize, ReservationStatus } from '../types/locker.types';

/**
 * Locker Status Options
 */
export const LOCKER_STATUSES: LockerStatus[] = ['available', 'occupied', 'maintenance', 'out_of_service'];

export const LOCKER_STATUS_LABELS: Record<LockerStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  out_of_service: 'Out of Service',
};

/**
 * Locker Size Options
 */
export const LOCKER_SIZES: LockerSize[] = ['small', 'medium', 'large'];

export const LOCKER_SIZE_LABELS: Record<LockerSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

/**
 * Reservation Status Options
 */
export const RESERVATION_STATUSES: ReservationStatus[] = ['active', 'completed', 'cancelled'];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Locker Features Options
 */
export const LOCKER_FEATURES = [
  'RFID',
  'NFC',
  'LED Status',
  'Temperature Sensor',
  'Humidity Sensor',
  'Motion Detection',
  'Keypad',
  'Biometric',
] as const;

export type LockerFeature = typeof LOCKER_FEATURES[number];

/**
 * Default Configurations
 */
export const DEFAULT_LOCKER_FEATURES: LockerFeature[] = ['RFID', 'NFC', 'LED Status'];

export const BATTERY_ALERT_THRESHOLD = 20; // Percentage
export const SIGNAL_STRENGTH_ALERT_THRESHOLD = 50; // Percentage

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
