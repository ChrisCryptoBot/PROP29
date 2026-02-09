/**
 * Clear all app-related localStorage so the next load shows login and no stale cache.
 * Use after "Clear cache and sign out" or for a full local reset.
 */

const AUTH_KEYS = ['access_token', 'refresh_token', 'user', 'token'] as const;

const APP_CACHE_KEYS = [
  // Auth (redundant with AUTH_KEYS but explicit)
  'access_token',
  'refresh_token',
  'user',
  'token',
  // Incident log
  'incident-log-cache',
  'incident-log-status-filter',
  'incident-log-source-filter',
  'incident-log-saved-filters',
  'incident-log.operation.queue',
  // Visitor security
  'visitor-security-cache',
  'visitor-security.operation.queue',
  // Property items
  'property-items-lkg-state',
  'property-items-cache-timestamp',
  'property-items-offline-queue',
  // Security operations
  'security-operations.audit-log',
  'security-operations-camera-wall-layouts',
  'security-operations-camera-wall-presets',
  'security-operations-camera-wall-settings',
  'security-operations.queue',
  // Patrol
  'patrol.operations.queue',
  'patrol.checkin.queue',
  // Access control
  'access-control.operation.queue',
  // Banned individuals
  'banned_individuals_audit_log',
  // Global UI
  'global_clock_offset_minutes',
  'global_clock_position',
  // Desktop / misc
  'desktopErrorQueue',
  'propertyId',
  'userId',
] as const;

/**
 * Remove known app keys from localStorage.
 * Always includes auth keys so the next load will show the login page.
 */
export function clearAppCache(): void {
  const keysToRemove = [...new Set([...AUTH_KEYS, ...APP_CACHE_KEYS])];
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
  // Remove any keys that look like temporary app keys (e.g. incident-log:*, visitor-security:*)
  try {
    const len = localStorage.length;
    const keys: string[] = [];
    for (let i = 0; i < len; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (
        k.startsWith('incident-log:') ||
        k.startsWith('incident-log-') ||
        k.startsWith('visitor-security:') ||
        k.startsWith('visitor-security-')
      ) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Nuclear option: clear entire localStorage for this origin.
 * Use when you want to guarantee login on next load and remove any third-party keys too.
 */
export function clearAllLocalStorage(): void {
  localStorage.clear();
}
