// PROPER 2.9 Shared Types
// This file contains TypeScript types and interfaces for the application

// Export all shared types
export * from './common.types';
export * from './api.types';
export * from './ui.types';
export * from './module.types';
export * from './events.types';
export * from './notifications.types';
export * from './performance.types';

// Export auth types (includes User type)
export * from './auth.types';

// Export access control types (using 'export type' for isolated modules compatibility)
export type {
  AccessPoint,
  AccessControlUser,
  AccessEvent,
  Credential,
  AccessSchedule,
  TemporaryAccess,
  CachedEvent,
  AccessMetrics,
  AccessPointGroup,
  RoleZoneMapping,
  VisitorRegistration,
  HeldOpenAlert,
  EmergencyOverride,
  BiometricConfig,
  AccessTimeoutsConfig,
  EmergencyOverrideConfig,
  AccessLoggingConfig,
  NotificationSettingsConfig,
  BackupRecoveryConfig,
  AccessPointFormData,
  UserFormData,
  TemporaryAccessFormData,
  ReportFormData,
  UserFilters,
  AccessPointFilters,
  AccessEventFilters,
  UserRole,
  UserStatus,
  AccessLevel,
  AccessAction,
  AccessResult,
  CredentialType,
  CredentialStatus,
} from './access-control.types';

// Export AI types
export * from './ai.types';

// Utility types for better TypeScript experience
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Async return type helper
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;