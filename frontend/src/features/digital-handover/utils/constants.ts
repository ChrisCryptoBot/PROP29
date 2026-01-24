/**
 * Digital Handover Module - Constants
 * 
 * Constant values used throughout the module.
 */

import type { ShiftType, HandoverStatus, HandoverPriority, ChecklistCategory, ChecklistItemPriority } from '../types';

/**
 * Shift type options
 */
export const SHIFT_TYPES: ShiftType[] = ['morning', 'afternoon', 'night'];

/**
 * Shift type display labels
 */
export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

/**
 * Handover status options
 */
export const HANDOVER_STATUSES: HandoverStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

/**
 * Handover status display labels
 */
export const HANDOVER_STATUS_LABELS: Record<HandoverStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

/**
 * Priority options (for handovers)
 */
export const PRIORITIES: HandoverPriority[] = ['low', 'medium', 'high', 'critical'];

/**
 * Priority display labels (for handovers)
 */
export const PRIORITY_LABELS: Record<HandoverPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/**
 * Checklist item priority options
 */
export const CHECKLIST_ITEM_PRIORITIES: ChecklistItemPriority[] = ['low', 'medium', 'high', 'critical'];

/**
 * Checklist item priority display labels
 */
export const CHECKLIST_ITEM_PRIORITY_LABELS: Record<ChecklistItemPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/**
 * Checklist category options
 */
export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  'security',
  'maintenance',
  'incidents',
  'equipment',
  'general',
];

/**
 * Checklist category display labels
 */
export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  security: 'Security',
  maintenance: 'Maintenance',
  incidents: 'Incidents',
  equipment: 'Equipment',
  general: 'General',
};

/**
 * Default shift configurations
 */
export const DEFAULT_SHIFT_CONFIGURATIONS = {
  morning: { start: '06:00', end: '14:00' },
  afternoon: { start: '14:00', end: '22:00' },
  night: { start: '22:00', end: '06:00' },
} as const;

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  reminderTime: '30',
  escalationTime: '2',
  dailyReports: false,
  checklistNotifications: true,
} as const;

/**
 * Default template settings
 */
export const DEFAULT_TEMPLATE_SETTINGS = {
  defaultPriority: 'medium' as const,
  defaultCategory: 'general' as const,
  autoAssignTasks: true,
  requireApproval: false,
} as const;

/**
 * File upload constraints
 */
export const ATTACHMENT_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  pageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

/**
 * Draft auto-save interval (milliseconds)
 */
export const DRAFT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * IndexedDB database name and version
 */
export const DB_CONFIG = {
  name: 'digital-handover-drafts',
  version: 1,
  storeName: 'handover-drafts',
} as const;
