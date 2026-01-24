import React, { createContext, useContext, ReactNode } from 'react';
import { useIoTEnvironmentalState, UseIoTEnvironmentalStateReturn } from '../hooks/useIoTEnvironmentalState';

const IoTEnvironmentalContext = createContext<UseIoTEnvironmentalStateReturn | undefined>(undefined);

interface IoTEnvironmentalProviderProps {
  children: ReactNode;
}

export const IoTEnvironmentalProvider: React.FC<IoTEnvironmentalProviderProps> = ({ children }) => {
  const state = useIoTEnvironmentalState();
  return (
    <IoTEnvironmentalContext.Provider value={state}>
      {children}
    </IoTEnvironmentalContext.Provider>
  );
};

export const useIoTEnvironmentalContext = (): UseIoTEnvironmentalStateReturn => {
  const context = useContext(IoTEnvironmentalContext);
  if (!context) {
    throw new Error('useIoTEnvironmentalContext must be used within IoTEnvironmentalProvider');
  }
  return context;
};

