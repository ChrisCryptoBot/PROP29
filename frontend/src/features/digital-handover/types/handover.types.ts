/**
 * Digital Handover Module - Core Handover Types
 * 
 * Type definitions for handover entities, statuses, and related data structures.
 */

import type { VerificationSignature } from './verification.types';

export type ShiftType = 'morning' | 'afternoon' | 'night';

export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type HandoverPriority = 'low' | 'medium' | 'high' | 'critical';

export type VerificationStatus = 'pending' | 'verified' | 'disputed';

/**
 * Core Handover entity
 */
export interface Handover {
  id: string;
  shiftType: ShiftType;
  handoverFrom: string;
  handoverTo: string;
  handoverDate: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // Time string (HH:mm)
  endTime: string; // Time string (HH:mm)
  status: HandoverStatus;
  priority: HandoverPriority;
  handoverNotes: string;
  checklistItems: ChecklistItem[];
  attachments: Attachment[];
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  completedAt?: string; // ISO datetime string
  completedBy?: string;
  verificationStatus: VerificationStatus;
  handoverRating?: number; // 1-5 scale
  feedback?: string;
  incidentsSummary: string;
  pendingTasks: string[]; // TODO: Convert to Task[] type
  specialInstructions: string;
  equipmentStatus: string;
  // Strategic features
  operationalPost?: string; // Post name (e.g., "Lobby", "Loading Dock", "Patrol")
  linkedIncidentIds?: string[]; // References to IncidentLog module
  verificationSignature?: VerificationSignature;
}

/**
 * Checklist item within a handover
 */
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  status: ChecklistItemStatus;
  priority: ChecklistItemPriority;
  assignedTo?: string;
  dueDate?: string; // ISO date string
  completedAt?: string; // ISO datetime string
  completedBy?: string;
  notes?: string;
}

export type ChecklistCategory = 'security' | 'maintenance' | 'incidents' | 'equipment' | 'general';

export type ChecklistItemStatus = 'pending' | 'completed' | 'skipped';

export type ChecklistItemPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Attachment/Media file associated with a handover
 */
export interface Attachment {
  id: string;
  handoverId: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  fileUrl: string; // URL to access the file
  uploadedAt: string; // ISO datetime string
  uploadedBy: string;
  description?: string;
  attachmentType: AttachmentType;
}

export type AttachmentType = 'photo' | 'audio' | 'document' | 'other';

/**
 * Handover metrics for analytics
 */
export interface HandoverMetrics {
  totalHandovers: number;
  completedHandovers: number;
  pendingHandovers: number;
  overdueHandovers: number;
  averageCompletionTime: string; // e.g., "12 min"
  completionRate: number; // percentage (0-100)
  handoversByShift: Record<ShiftType, number>;
  handoversByStatus: Record<HandoverStatus, number>;
  monthlyHandovers: MonthlyHandoverData[];
  checklistCompletionRate: number; // percentage (0-100)
  averageRating: number; // 1-5 scale
}

export interface MonthlyHandoverData {
  month: string; // e.g., "Jan", "Feb"
  count: number;
}

/**
 * Staff member (from handover config/staff API)
 */
export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  status?: string;
}

/**
 * Shift timeline entry (from handover analytics/timeline API)
 */
export interface ShiftTimelineEntry {
  shift: string;
  time: string;
  staff: string;
  status: string;
}

/**
 * Request types for API operations
 */
export interface CreateHandoverRequest {
  shiftType: ShiftType;
  handoverFrom: string;
  handoverTo: string;
  handoverDate: string;
  startTime: string;
  endTime: string;
  priority: HandoverPriority;
  handoverNotes: string;
  checklistItems: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  operationalPost?: string;
  linkedIncidentIds?: string[];
}

export interface UpdateHandoverRequest {
  shiftType?: ShiftType;
  handoverFrom?: string;
  handoverTo?: string;
  handoverDate?: string;
  startTime?: string;
  endTime?: string;
  status?: HandoverStatus;
  priority?: HandoverPriority;
  handoverNotes?: string;
  checklistItems?: ChecklistItem[];
  pendingTasks?: string[];
  specialInstructions?: string;
  equipmentStatus?: string;
  linkedIncidentIds?: string[];
}

export interface HandoverFilters {
  status?: HandoverStatus[];
  shiftType?: ShiftType[];
  priority?: HandoverPriority[];
  handoverFrom?: string;
  handoverTo?: string;
  dateFrom?: string;
  dateTo?: string;
  operationalPost?: string;
  searchQuery?: string;
}

export interface HandoverSortOptions {
  field: 'handoverDate' | 'createdAt' | 'priority' | 'status' | 'handoverFrom' | 'handoverTo';
  direction: 'asc' | 'desc';
}
