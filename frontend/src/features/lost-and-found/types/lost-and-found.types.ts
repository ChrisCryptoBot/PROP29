/**
 * Lost & Found Types
 * TypeScript type definitions for Lost & Found feature
 * Mirrors backend schemas and models
 */

export enum LostFoundStatus {
  LOST = 'lost',
  FOUND = 'found',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  DONATED = 'donated'
}

export interface LostFoundItemLocation {
  area?: string;
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface GuestInfo {
  name: string;
  room: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface LegalCompliance {
  retentionPeriod: number;
  disposalDate?: string;
  disposalMethod?: string;
}

export interface LostFoundItem {
  item_id: string;
  property_id: string;
  item_type: string;
  description: string;
  location_found?: LostFoundItemLocation | string;
  location_lost?: LostFoundItemLocation | string;
  found_date: string;
  lost_date?: string;
  status: LostFoundStatus;
  photo_url?: string;
  claimed_by_guest_id?: string;
  claimed_at?: string;
  found_by?: string;
  notes?: string;
  value_estimate?: number;
  
  // Frontend-only fields (derived/computed)
  name?: string; // Derived from item_type or description
  category?: string; // Derived from item_type
  storageLocation?: string; // Computed
  qrCode?: string; // Generated
  expirationDate?: string; // Computed from retention period
  notificationsSent?: number; // Tracked separately
  lastNotificationDate?: string; // Tracked separately
  guestInfo?: GuestInfo; // Expanded from guest relationships
  legalCompliance?: LegalCompliance; // Computed/derived
  managerApproved?: boolean; // For weapons category
  managerApprovedBy?: string;
  managerApprovedDate?: string;
  
  // Relationship data (populated)
  property_name?: string;
  finder_name?: string;
  claimed_by_guest_name?: string;
}

export interface LostFoundItemCreate {
  property_id: string;
  item_type: string;
  description: string;
  location_found?: LostFoundItemLocation | string;
  location_lost?: LostFoundItemLocation | string;
  photo_url?: string;
  notes?: string;
  value_estimate?: number;
  found_by?: string;
  
  // Additional frontend fields
  category?: string;
  name?: string;
  guestInfo?: Partial<GuestInfo>;
  storageLocation?: string;
}

export interface LostFoundItemUpdate {
  item_type?: string;
  description?: string;
  location_found?: LostFoundItemLocation | string;
  location_lost?: LostFoundItemLocation | string;
  status?: LostFoundStatus;
  photo_url?: string;
  notes?: string;
  value_estimate?: number;
  claimed_by_guest_id?: string;
  
  // Additional frontend fields
  category?: string;
  storageLocation?: string;
  guestInfo?: Partial<GuestInfo>;
}

export interface LostFoundItemFilters {
  property_id?: string;
  status?: LostFoundStatus;
  item_type?: string;
  category?: string;
  storageLocation?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface LostFoundClaim {
  item_id: string;
  claimer_name: string;
  claimer_contact: string;
  description: string;
  claimer_email?: string;
}


export interface LostFoundMetrics {
  total: number;
  found: number;
  claimed: number;
  expired: number;
  donated: number;
  notifications_sent: number;
  recovery_rate: number;
  avg_days_to_claim: number;
  total_value_recovered: number;
  items_by_category?: Record<string, number>;
  items_by_status?: Record<string, number>;
  recovery_trend?: Array<{
    month: string;
    recovered: number;
    total: number;
  }>;
}

export interface LostFoundSettings {
  defaultRetentionPeriod: number;
  expirationWarningDays: number;
  qrCodePrefix: string;
  autoArchiveAfterDays: number;
  autoNotificationEnabled: boolean;
  requirePhotoDocumentation: boolean;
  chainOfCustodyTracking: boolean;
  highValueThreshold: number;
  defaultDisposalMethod: string;
  notificationTemplates: {
    emailSubject: string;
    emailBody: string;
    smsTemplate: string;
  };
}
