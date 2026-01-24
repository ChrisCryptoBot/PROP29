/**
 * Digital Handover Module - Settings Types
 * 
 * Type definitions for module settings, configurations, and templates.
 */

import type { ShiftType } from './handover.types';

/**
 * Shift time configuration
 */
export interface ShiftConfiguration {
  start: string; // Time string (HH:mm)
  end: string; // Time string (HH:mm)
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  reminderTime: string; // Minutes before shift end (e.g., "30")
  escalationTime: string; // Hours after shift end (e.g., "2")
  dailyReports: boolean;
  checklistNotifications: boolean;
}

/**
 * Template/default settings
 */
export interface TemplateSettings {
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
  defaultCategory: 'security' | 'maintenance' | 'incidents' | 'equipment' | 'general';
  autoAssignTasks: boolean;
  requireApproval: boolean;
}

/**
 * Checklist template
 */
export interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  operationalPost?: string; // Post-specific template
  items: ChecklistTemplateItem[];
  isDefault: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  createdBy: string;
}

export interface ChecklistTemplateItem {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  required: boolean; // Whether this item is required
  order: number; // Display order
}

/**
 * Auto-handover rule configuration
 */
export interface AutoHandoverRule {
  id: string;
  enabled: boolean;
  leadTimeMinutes: number; // Minutes before shift change to create handover
  shiftTypes: ShiftType[]; // Which shifts this applies to
  operationalPosts?: string[]; // Which posts this applies to (empty = all)
}

/**
 * Overdue reminder rule
 */
export interface OverdueReminderRule {
  id: string;
  enabled: boolean;
  reminderIntervalHours: number; // Hours after shift end to send reminder
  maxReminders: number; // Maximum number of reminders
  escalationEnabled: boolean; // Whether to escalate to supervisor
}

/**
 * Data retention settings
 */
export interface DataRetentionSettings {
  retainHandoverRecords: DataRetentionPeriod;
  archiveCompletedHandovers: DataRetentionPeriod;
}

export type DataRetentionPeriod = 
  | '7days' 
  | '30days' 
  | '90days' 
  | '180days' 
  | '1year' 
  | 'forever';

/**
 * Complete handover settings
 */
export interface HandoverSettings {
  shiftConfigurations: Record<ShiftType, ShiftConfiguration>;
  notificationSettings: NotificationSettings;
  templateSettings: TemplateSettings;
  autoHandoverRules: AutoHandoverRule[];
  overdueReminderRules: OverdueReminderRule[];
  dataRetention: DataRetentionSettings;
}

/**
 * Request/Response types for settings API
 */
export type UpdateHandoverSettingsRequest = Partial<HandoverSettings>;
