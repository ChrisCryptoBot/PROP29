/**
 * Smart Lockers Feature Context
 * Provides data and actions to all Smart Lockers components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useSmartLockersState, UseSmartLockersStateReturn } from '../hooks/useSmartLockersState';

const SmartLockersContext = createContext<UseSmartLockersStateReturn | undefined>(undefined);

interface SmartLockersProviderProps {
  children: ReactNode;
}

/**
 * Smart Lockers Provider
 * Wraps components with context and provides state from useSmartLockersState hook
 * This is the connection point between the hook and the components
 */
export const SmartLockersProvider: React.FC<SmartLockersProviderProps> = ({ children }) => {
  // Use the hook to get all state and actions
  const state = useSmartLockersState();

  // The hook return type matches our context value, so we can pass it directly
  return (
    <SmartLockersContext.Provider value={state}>
      {children}
    </SmartLockersContext.Provider>
  );
};

export const useSmartLockersContext = (): UseSmartLockersStateReturn => {
  const context = useContext(SmartLockersContext);
  if (!context) {
    throw new Error('useSmartLockersContext must be used within SmartLockersProvider');
  }
  return context;
};

