/**
 * Access Control Feature Context
 * Provides data and actions to all Access Control components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccessControlState } from '../hooks/useAccessControlState';
import type { AccessPoint, AccessControlUser, AccessEvent, AccessMetrics, AccessControlAuditEntry } from '../../../shared/types/access-control.types';
import type { HeldOpenAlert } from '../../../services/AccessControlUtilities';

export interface EmergencyController {
  mode: 'lockdown' | 'unlock';
  initiatedBy: string;
  timestamp: string;
  priority: number;
  timeoutDuration?: number;
  timeoutTimer?: ReturnType<typeof setTimeout>;
}

export interface AccessControlContextValue {
  // Data
  accessPoints: AccessPoint[];
  users: AccessControlUser[];
  accessEvents: AccessEvent[];
  metrics: AccessMetrics | null;
  heldOpenAlerts: HeldOpenAlert[];
  auditLog: AccessControlAuditEntry[];
  
  // Emergency Mode
  emergencyMode: 'normal' | 'lockdown' | 'unlock';
  emergencyController: EmergencyController | null;
  emergencyTimeoutDuration: number; // in seconds
  
  // Loading states
  loading: {
    accessPoints: boolean;
    users: boolean;
    accessEvents: boolean;
    metrics: boolean;
  };
  
  // Actions
  refreshAccessPoints: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshAccessEvents: (filters?: Record<string, string>) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  createAccessPoint: (point: Partial<AccessPoint>) => Promise<AccessPoint>;
  updateAccessPoint: (id: string, updates: Partial<AccessPoint>) => Promise<AccessPoint>;
  deleteAccessPoint: (id: string) => Promise<void>;
  createUser: (user: Partial<AccessControlUser>) => Promise<AccessControlUser>;
  updateUser: (id: string, updates: Partial<AccessControlUser>) => Promise<AccessControlUser>;
  deleteUser: (id: string) => Promise<void>;
  
  // Emergency Actions (options.skipConfirm = caller already confirmed; options.reason = audit + API)
  handleEmergencyLockdown: (options?: { skipConfirm?: boolean; reason?: string }) => Promise<void>;
  handleEmergencyUnlock: (options?: { skipConfirm?: boolean; reason?: string }) => Promise<void>;
  handleNormalMode: (options?: { reason?: string }) => Promise<void>;
  acknowledgeHeldOpenAlert: (alertId: string) => void;
  
  // Access Point Actions
  toggleAccessPoint: (pointId: string) => Promise<void>;
  syncCachedEvents: (accessPointId: string) => Promise<void>;
  reviewAgentEvent: (eventId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  exportAccessEvents: (format?: 'csv' | 'json') => Promise<void>;
  exportAccessReport: (format: 'pdf' | 'csv') => Promise<void>;
  recordAuditEntry: (entry: { action: string; status: 'success' | 'failure' | 'info'; target?: string; reason?: string; source?: 'web_admin' | 'mobile_agent' | 'system' }) => void;
  refreshAuditLog: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextValue | undefined>(undefined);

interface AccessControlProviderProps {
  children: ReactNode;
}

/**
 * Access Control Provider
 * Wraps components with context and provides state from useAccessControlState hook
 * This is the connection point between the hook and the components
 */
export const AccessControlProvider: React.FC<AccessControlProviderProps> = ({ children }) => {
  // Use the hook to get all state and actions
  const state = useAccessControlState();

  // The hook return type matches our context value, so we can pass it directly
  return (
    <AccessControlContext.Provider value={state}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControlContext = (): AccessControlContextValue => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControlContext must be used within AccessControlProvider');
  }
  return context;
};

