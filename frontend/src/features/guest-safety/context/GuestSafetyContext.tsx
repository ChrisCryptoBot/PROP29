/**
 * Guest Safety Feature Context
 * Provides data and actions to all Guest Safety components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { UseGuestSafetyStateReturn } from '../hooks/useGuestSafetyState';
import { useGuestSafetyState } from '../hooks/useGuestSafetyState';

const GuestSafetyContext = createContext<UseGuestSafetyStateReturn | undefined>(undefined);

interface GuestSafetyProviderProps {
  children: ReactNode;
}

/**
 * Guest Safety Provider
 * Wraps components with context and provides state from useGuestSafetyState hook
 * This is the connection point between the hook and the components
 */
export const GuestSafetyProvider: React.FC<GuestSafetyProviderProps> = ({ children }) => {
  // Use the hook to get all state and actions
  const state = useGuestSafetyState();

  // The hook return type matches our context value, so we can pass it directly
  return (
    <GuestSafetyContext.Provider value={state}>
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

