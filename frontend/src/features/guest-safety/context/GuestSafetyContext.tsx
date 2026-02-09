/**
 * Guest Safety Feature Context
 * Provides data and actions to all Guest Safety components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { UseGuestSafetyStateReturn } from '../hooks/useGuestSafetyState';
import type { TabId } from '../types/guest-safety.types';
import { useGuestSafetyState } from '../hooks/useGuestSafetyState';

const GuestSafetyContext = createContext<UseGuestSafetyStateReturn | undefined>(undefined);

interface GuestSafetyProviderProps {
  children: ReactNode;
  /** Optional: set by orchestrator so tabs can navigate (e.g. "Go to Incidents"). */
  setActiveTab?: (tabId: TabId) => void;
}

/**
 * Guest Safety Provider
 * Wraps components with context and provides state from useGuestSafetyState hook
 * This is the connection point between the hook and the components
 */
export const GuestSafetyProvider: React.FC<GuestSafetyProviderProps> = ({ children, setActiveTab }) => {
  const state = useGuestSafetyState();
  const value: UseGuestSafetyStateReturn = { ...state, setActiveTab: setActiveTab ?? (() => {}) };
  return (
    <GuestSafetyContext.Provider value={value}>
      {children}
    </GuestSafetyContext.Provider>
  );
};

export const useGuestSafetyContext = (): UseGuestSafetyStateReturn => {
  const context = useContext(GuestSafetyContext);
  if (!context) {
    throw new Error('useGuestSafetyContext must be used within GuestSafetyProvider');
  }
  return context;
};

