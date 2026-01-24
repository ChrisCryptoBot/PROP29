/**
 * Guest Safety - Constants
 * Centralizes constants used across the module
 */

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS = {
  alertThreshold: 5, // minutes
  autoEscalation: true,
  notificationChannels: {
    inApp: true,
    sms: true,
    email: true,
  },
  responseTeamAssignment: 'automatic' as const,
};
