import React, { createContext, useContext, ReactNode } from 'react';
import { useSecurityOperationsState, UseSecurityOperationsStateReturn } from '../hooks/useSecurityOperationsState';

const SecurityOperationsContext = createContext<UseSecurityOperationsStateReturn | undefined>(undefined);

interface SecurityOperationsProviderProps {
  children: ReactNode;
}

export const SecurityOperationsProvider: React.FC<SecurityOperationsProviderProps> = ({ children }) => {
  const state = useSecurityOperationsState();
  return (
    <SecurityOperationsContext.Provider value={state}>
      {children}
    </SecurityOperationsContext.Provider>
  );
};

export const useSecurityOperationsContext = (): UseSecurityOperationsStateReturn => {
  const context = useContext(SecurityOperationsContext);
  if (!context) {
    throw new Error('useSecurityOperationsContext must be used within a SecurityOperationsProvider');
  }
  return context;
};

