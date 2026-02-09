/**
 * Profile Settings Context — provides profile state and actions to all tab components.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { UseProfileSettingsStateReturn } from '../hooks/useProfileSettingsState';
import { useProfileSettingsState } from '../hooks/useProfileSettingsState';

const ProfileSettingsContext = createContext<UseProfileSettingsStateReturn | undefined>(undefined);

interface ProfileSettingsProviderProps {
  children: ReactNode;
}

export const ProfileSettingsProvider: React.FC<ProfileSettingsProviderProps> = ({ children }) => {
  const state = useProfileSettingsState();
  return (
    <ProfileSettingsContext.Provider value={state}>
      {children}
    </ProfileSettingsContext.Provider>
  );
};

export const useProfileSettingsContext = (): UseProfileSettingsStateReturn => {
  const context = useContext(ProfileSettingsContext);
  if (!context) {
    throw new Error('useProfileSettingsContext must be used within ProfileSettingsProvider');
  }
  return context;
};
