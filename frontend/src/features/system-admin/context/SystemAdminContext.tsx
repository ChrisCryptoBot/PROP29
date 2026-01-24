import React, { createContext, useContext, ReactNode } from 'react';
import { useSystemAdminState } from '../hooks/useSystemAdminState';

type SystemAdminContextType = ReturnType<typeof useSystemAdminState>;

const SystemAdminContext = createContext<SystemAdminContextType | undefined>(undefined);

export const SystemAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const state = useSystemAdminState();
    return (
        <SystemAdminContext.Provider value={state}>
            {children}
        </SystemAdminContext.Provider>
    );
};

export const useSystemAdminContext = () => {
    const context = useContext(SystemAdminContext);
    if (context === undefined) {
        throw new Error('useSystemAdminContext must be used within a SystemAdminProvider');
    }
    return context;
};

