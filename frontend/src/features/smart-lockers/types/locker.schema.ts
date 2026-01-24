/**
 * Smart Lockers Module - Zod Validation Schemas
 * Input validation schemas for locker and reservation operations
 */

import { z } from 'zod';
import { LOCKER_SIZES, LOCKER_STATUSES, RESERVATION_STATUSES, LOCKER_FEATURES } from '../utils/constants';

/**
 * Locker Size Schema
 */
export const lockerSizeSchema = z.enum(['small', 'medium', 'large']);

/**
 * Locker Status Schema
 */
export const lockerStatusSchema = z.enum(['available', 'occupied', 'maintenance', 'out_of_service']);

/**
 * Reservation Status Schema
 */
export const reservationStatusSchema = z.enum(['active', 'completed', 'cancelled']);

/**
 * Locker Feature Schema
 */
export const lockerFeatureSchema = z.enum(['RFID', 'NFC', 'LED Status', 'Temperature Sensor', 'Humidity Sensor', 'Motion Detection', 'Keypad', 'Biometric'] as [string, ...string[]]);

/**
 * Create Locker Schema
 */
export const createLockerSchema = z.object({
  lockerNumber: z.string()
    .min(1, 'Locker number is required')
    .max(20, 'Locker number must be 20 characters or less')
    .regex(/^[A-Z0-9\-_]+$/, 'Locker number must contain only letters, numbers, hyphens, and underscores'),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be 200 characters or less'),
  size: lockerSizeSchema,
  features: z.array(lockerFeatureSchema)
    .default([])
    .optional(),
}).strict();

export type CreateLockerInput = z.infer<typeof createLockerSchema>;

/**
 * Update Locker Schema
 */
export const updateLockerSchema = z.object({
  lockerNumber: z.string()
    .min(1, 'Locker number is required')
    .max(20, 'Locker number must be 20 characters or less')
    .regex(/^[A-Z0-9\-_]+$/, 'Locker number must contain only letters, numbers, hyphens, and underscores')
    .optional(),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be 200 characters or less')
    .optional(),
  status: lockerStatusSchema.optional(),
  size: lockerSizeSchema.optional(),
  batteryLevel: z.number()
    .min(0, 'Battery level must be between 0 and 100')
    .max(100, 'Battery level must be between 0 and 100')
    .optional(),
  signalStrength: z.number()
    .min(0, 'Signal strength must be between 0 and 100')
    .max(100, 'Signal strength must be between 0 and 100')
    .optional(),
  features: z.array(lockerFeatureSchema)
    .default([])
    .optional(),
}).strict();

export type UpdateLockerInput = z.infer<typeof updateLockerSchema>;

/**
 * Create Reservation Schema
 */
export const createReservationSchema = z.object({
  lockerId: z.string()
    .min(1, 'Locker ID is required'),
  guestId: z.string()
    .min(1, 'Guest ID is required'),
  guestName: z.string()
    .min(1, 'Guest name is required')
    .max(100, 'Guest name must be 100 characters or less')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Guest name contains invalid characters'),
  startTime: z.string()
    .datetime('Start time must be a valid ISO datetime'),
  endTime: z.string()
    .datetime('End time must be a valid ISO datetime'),
  purpose: z.string()
    .min(1, 'Purpose is required')
    .max(200, 'Purpose must be 200 characters or less'),
}).strict()
.refine((data: { startTime: string; endTime: string }) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/**
 * Update Reservation Schema
 */
export const updateReservationSchema = z.object({
  guestId: z.string()
    .min(1, 'Guest ID is required')
    .optional(),
  guestName: z.string()
    .min(1, 'Guest name is required')
    .max(100, 'Guest name must be 100 characters or less')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Guest name contains invalid characters')
    .optional(),
  startTime: z.string()
    .datetime('Start time must be a valid ISO datetime')
    .optional(),
  endTime: z.string()
    .datetime('End time must be a valid ISO datetime')
    .optional(),
  status: reservationStatusSchema.optional(),
  purpose: z.string()
    .min(1, 'Purpose is required')
    .max(200, 'Purpose must be 200 characters or less')
    .optional(),
}).strict()
.refine((data: { startTime?: string; endTime?: string }) => {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

/**
 * Settings Schema
 */
export const lockerSettingsSchema = z.object({
  batteryAlertThreshold: z.number()
    .min(0, 'Battery alert threshold must be between 0 and 100')
    .max(100, 'Battery alert threshold must be between 0 and 100'),
  signalStrengthAlertThreshold: z.number()
    .min(0, 'Signal strength alert threshold must be between 0 and 100')
    .max(100, 'Signal strength alert threshold must be between 0 and 100'),
});

export type LockerSettingsInput = z.infer<typeof lockerSettingsSchema>;
