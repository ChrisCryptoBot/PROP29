import React, { createContext, useContext, ReactNode } from 'react';
import { useSmartParkingState } from '../hooks/useSmartParkingState';

type SmartParkingContextType = ReturnType<typeof useSmartParkingState>;

const SmartParkingContext = createContext<SmartParkingContextType | undefined>(undefined);

export const SmartParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const state = useSmartParkingState();

    return (
        <SmartParkingContext.Provider value={state}>
            {children}
        </SmartParkingContext.Provider>
    );
};

export const useSmartParkingContext = () => {
    const context = useContext(SmartParkingContext);
    if (context === undefined) {
        throw new Error('useSmartParkingContext must be used within a SmartParkingProvider');
    }
    return context;
};

