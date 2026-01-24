import React, { createContext, useContext, ReactNode } from 'react';
import { useEmergencyEvacuationState, UseEmergencyEvacuationStateReturn } from '../hooks/useEmergencyEvacuationState';

const EmergencyEvacuationContext = createContext<UseEmergencyEvacuationStateReturn | undefined>(undefined);

interface EmergencyEvacuationProviderProps {
  children: ReactNode;
}

export const EmergencyEvacuationProvider: React.FC<EmergencyEvacuationProviderProps> = ({ children }) => {
  const state = useEmergencyEvacuationState();
  return (
    <EmergencyEvacuationContext.Provider value={state}>
      {children}
    </EmergencyEvacuationContext.Provider>
  );
};

export const useEmergencyEvacuationContext = (): UseEmergencyEvacuationStateReturn => {
  const context = useContext(EmergencyEvacuationContext);
  if (!context) {
    throw new Error('useEmergencyEvacuationContext must be used within EmergencyEvacuationProvider');
  }
  return context;
};

