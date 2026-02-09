import React, { createContext, useContext, ReactNode } from 'react';
import { useAccountSettingsState, UseAccountSettingsStateReturn } from '../hooks/useAccountSettingsState';

const AccountSettingsContext = createContext<UseAccountSettingsStateReturn | undefined>(undefined);

export interface AccountSettingsProviderProps {
  children: ReactNode;
}

export const AccountSettingsProvider: React.FC<AccountSettingsProviderProps> = ({ children }) => {
  const state = useAccountSettingsState();
  return (
    <AccountSettingsContext.Provider value={state}>
      {children}
    </AccountSettingsContext.Provider>
  );
};

export function useAccountSettingsContext(): UseAccountSettingsStateReturn {
  const ctx = useContext(AccountSettingsContext);
  if (ctx === undefined) throw new Error('useAccountSettingsContext must be used within AccountSettingsProvider');
  return ctx;
}
