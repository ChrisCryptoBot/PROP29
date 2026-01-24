/**
 * Smart Lockers Module - Type Definitions
 * Centralized type definitions for the Smart Lockers feature
 */

export type LockerStatus = 'available' | 'occupied' | 'maintenance' | 'out_of_service';
export type LockerSize = 'small' | 'medium' | 'large';
export type ReservationStatus = 'active' | 'completed' | 'cancelled';

/**
 * Smart Locker entity
 */
export interface SmartLocker {
  id: string;
  lockerNumber: string;
  location: string;
  status: LockerStatus;
  size: LockerSize;
  currentGuestId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  batteryLevel?: number;
  signalStrength?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Locker Reservation entity
 */
export interface LockerReservation {
  id: string;
  lockerId: string;
  guestId: string;
  guestName: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  purpose: string;
}

/**
 * Locker Metrics
 */
export interface LockerMetrics {
  totalLockers: number;
  availableLockers: number;
  occupiedLockers: number;
  maintenanceLockers: number;
  utilizationRate: number;
  averageOccupancyTime: number;
  batteryAlerts: number;
  signalIssues: number;
}

/**
 * API Request/Response Types
 */
export interface CreateLockerRequest {
  lockerNumber: string;
  location: string;
  size: LockerSize;
  features?: string[];
}

export interface UpdateLockerRequest {
  lockerNumber?: string;
  location?: string;
  status?: LockerStatus;
  size?: LockerSize;
  batteryLevel?: number;
  signalStrength?: number;
  features?: string[];
}

export interface CreateReservationRequest {
  lockerId: string;
  guestId: string;
  guestName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface UpdateReservationRequest {
  guestId?: string;
  guestName?: string;
  startTime?: string;
  endTime?: string;
  status?: ReservationStatus;
  purpose?: string;
}

/**
 * Form Data Types (for modals)
 */
export interface LockerFormData {
  lockerNumber: string;
  location: string;
  size: LockerSize;
  features: string[];
}

export interface ReservationFormData {
  lockerId: string;
  guestId: string;
  guestName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}
