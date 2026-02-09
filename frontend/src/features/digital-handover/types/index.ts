/**
 * Digital Handover Module - Type Exports
 * 
 * Central export point for all type definitions.
 */

// Core handover types
export type {
  ShiftType,
  HandoverStatus,
  HandoverPriority,
  VerificationStatus,
  Handover,
  ChecklistItem,
  ChecklistCategory,
  ChecklistItemStatus,
  ChecklistItemPriority,
  Attachment,
  AttachmentType,
  HandoverMetrics,
  MonthlyHandoverData,
  StaffMember,
  ShiftTimelineEntry,
  CreateHandoverRequest,
  UpdateHandoverRequest,
  HandoverFilters,
  HandoverSortOptions,
} from './handover.types';

// Verification types
export type {
  VerificationSignature,
  VerificationRequest,
  VerificationRequestStatus,
  CreateVerificationRequest,
  SubmitVerificationSignatureRequest,
  VerificationStatusSummary,
} from './verification.types';

// Equipment types
export type {
  EquipmentStatus,
  Equipment,
  EquipmentCategory,
  MaintenanceRequest,
  MaintenancePriority,
  MaintenanceRequestStatus,
  EquipmentChecklistItem,
  CreateEquipmentRequest,
  CreateMaintenanceRequestRequest,
} from './equipment.types';

// Settings types
export type {
  ShiftConfiguration,
  NotificationSettings,
  TemplateSettings,
  ChecklistTemplate,
  ChecklistTemplateItem,
  AutoHandoverRule,
  OverdueReminderRule,
  DataRetentionSettings,
  DataRetentionPeriod,
  HandoverSettings,
  UpdateHandoverSettingsRequest,
} from './settings.types';
