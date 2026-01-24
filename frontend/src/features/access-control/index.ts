/**
 * Access Control Feature Barrel Export
 * Main entry point for the Access Control feature module
 */

export { default as AccessControlModule } from './AccessControlModuleOrchestrator';
export { AccessControlProvider, useAccessControlContext } from './context/AccessControlContext';
export type { AccessControlContextValue, EmergencyController } from './context/AccessControlContext';

// Export all tab components
export * from './components/tabs';

// Export hook for external use if needed
export { useAccessControlState } from './hooks/useAccessControlState';
export type { UseAccessControlStateReturn } from './hooks/useAccessControlState';
