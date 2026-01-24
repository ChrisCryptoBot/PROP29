/**
 * Smart Lockers Service
 * API service layer for Smart Lockers operations
 */

import apiService from '../../../services/ApiService';
import type {
  SmartLocker,
  LockerReservation,
  LockerMetrics,
  CreateLockerRequest,
  UpdateLockerRequest,
  CreateReservationRequest,
  UpdateReservationRequest,
} from '../types/locker.types';
import { logger } from '../../../services/logger';

/**
 * Get all lockers
 */
export async function getLockers(): Promise<SmartLocker[]> {
  try {
    const response = await apiService.get<SmartLocker[]>('/lockers');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch lockers');
    }
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to fetch lockers',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'getLockers' }
    );
    throw error;
  }
}

/**
 * Get locker by ID
 */
export async function getLockerById(id: string): Promise<SmartLocker> {
  try {
    const response = await apiService.get<SmartLocker>(`/lockers/${id}`);
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch locker ${id}`);
    }
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to fetch locker ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'getLockerById', lockerId: id }
    );
    throw error;
  }
}

/**
 * Create locker
 */
export async function createLocker(data: CreateLockerRequest): Promise<SmartLocker> {
  try {
    const response = await apiService.post<SmartLocker>('/lockers', data);
    if (!response.success || !response.data) {
      throw new Error('Failed to create locker');
    }
    logger.info('Locker created successfully', { module: 'lockerService', action: 'createLocker', lockerId: response.data.id });
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to create locker',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'createLocker', data }
    );
    throw error;
  }
}

/**
 * Update locker
 */
export async function updateLocker(id: string, data: UpdateLockerRequest): Promise<SmartLocker> {
  try {
    const response = await apiService.put<SmartLocker>(`/lockers/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(`Failed to update locker ${id}`);
    }
    logger.info('Locker updated successfully', { module: 'lockerService', action: 'updateLocker', lockerId: id });
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to update locker ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'updateLocker', lockerId: id, data }
    );
    throw error;
  }
}

/**
 * Delete locker
 */
export async function deleteLocker(id: string): Promise<void> {
  try {
    const response = await apiService.delete<void>(`/lockers/${id}`);
    if (!response.success) {
      throw new Error(`Failed to delete locker ${id}`);
    }
    logger.info('Locker deleted successfully', { module: 'lockerService', action: 'deleteLocker', lockerId: id });
  } catch (error) {
    logger.error(
      `Failed to delete locker ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'deleteLocker', lockerId: id }
    );
    throw error;
  }
}

/**
 * Get all reservations
 */
export async function getReservations(): Promise<LockerReservation[]> {
  try {
    const response = await apiService.get<LockerReservation[]>('/lockers/reservations');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch reservations');
    }
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to fetch reservations',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'getReservations' }
    );
    throw error;
  }
}

/**
 * Get reservation by ID
 */
export async function getReservationById(id: string): Promise<LockerReservation> {
  try {
    const response = await apiService.get<LockerReservation>(`/lockers/reservations/${id}`);
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch reservation ${id}`);
    }
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to fetch reservation ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'getReservationById', reservationId: id }
    );
    throw error;
  }
}

/**
 * Create reservation
 */
export async function createReservation(data: CreateReservationRequest): Promise<LockerReservation> {
  try {
    const response = await apiService.post<LockerReservation>('/lockers/reservations', data);
    if (!response.success || !response.data) {
      throw new Error('Failed to create reservation');
    }
    logger.info('Reservation created successfully', { module: 'lockerService', action: 'createReservation', reservationId: response.data.id });
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to create reservation',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'createReservation', data }
    );
    throw error;
  }
}

/**
 * Update reservation
 */
export async function updateReservation(id: string, data: UpdateReservationRequest): Promise<LockerReservation> {
  try {
    const response = await apiService.put<LockerReservation>(`/lockers/reservations/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(`Failed to update reservation ${id}`);
    }
    logger.info('Reservation updated successfully', { module: 'lockerService', action: 'updateReservation', reservationId: id });
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to update reservation ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'updateReservation', reservationId: id, data }
    );
    throw error;
  }
}

/**
 * Delete reservation
 */
export async function deleteReservation(id: string): Promise<void> {
  try {
    const response = await apiService.delete<void>(`/lockers/reservations/${id}`);
    if (!response.success) {
      throw new Error(`Failed to delete reservation ${id}`);
    }
    logger.info('Reservation deleted successfully', { module: 'lockerService', action: 'deleteReservation', reservationId: id });
  } catch (error) {
    logger.error(
      `Failed to delete reservation ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'deleteReservation', reservationId: id }
    );
    throw error;
  }
}

/**
 * Get locker metrics
 */
export async function getLockerMetrics(): Promise<LockerMetrics> {
  try {
    const response = await apiService.get<LockerMetrics>('/lockers/metrics');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch locker metrics');
    }
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to fetch locker metrics',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'lockerService', action: 'getLockerMetrics' }
    );
    throw error;
  }
}
