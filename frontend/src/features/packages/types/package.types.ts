/**
 * Package Types
 * Type definitions for the Packages module
 * Mirrors backend schemas for type safety
 */

// PackageStatus enum (matches backend PackageStatus)
export enum PackageStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  NOTIFIED = 'notified',
  DELIVERED = 'delivered',
  EXPIRED = 'expired'
}

// Package entity (matches backend PackageResponse)
export interface Package {
  package_id: string;
  property_id: string;
  guest_id?: string;
  tracking_number?: string;
  sender_name?: string;
  sender_contact?: string;
  description?: string;
  size?: string;
  weight?: number;
  status: PackageStatus;
  received_at: string; // ISO datetime string
  notified_at?: string; // ISO datetime string
  delivered_at?: string; // ISO datetime string
  delivered_to?: string;
  location?: {
    area?: string;
    floor?: string;
    building?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notes?: string;
  photo_url?: string;
  received_by?: string;
}

// Package create request (matches backend PackageCreate)
export interface PackageCreate {
  property_id: string;
  guest_id?: string;
  tracking_number?: string;
  sender_name?: string;
  sender_contact?: string;
  description?: string;
  size?: string;
  weight?: number;
  location?: {
    area?: string;
    floor?: string;
    building?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notes?: string;
  photo_url?: string;
}

// Package update request (matches backend PackageUpdate)
export interface PackageUpdate {
  guest_id?: string;
  tracking_number?: string;
  sender_name?: string;
  sender_contact?: string;
  description?: string;
  size?: string;
  weight?: number;
  status?: PackageStatus;
  location?: {
    area?: string;
    floor?: string;
    building?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notes?: string;
  photo_url?: string;
  delivered_to?: string;
}

// Package filters
export interface PackageFilters {
  property_id?: string;
  status?: PackageStatus;
  guest_id?: string;
  tracking_number?: string;
}

// Package metrics (for analytics)
export interface PackageMetrics {
  total: number;
  pending: number;
  received: number;
  notified: number;
  delivered: number;
  expired: number;
}

// Package settings (for settings tab)
export interface PackageSettings {
  defaultStorageLocation?: string;
  autoNotificationTiming?: string;
  packageRetentionPeriod?: number;
  qrCodeSize?: string;
  automaticPhotoDocumentation?: boolean;
  signatureRequiredByDefault?: boolean;
  smsNotifications?: boolean;
}
