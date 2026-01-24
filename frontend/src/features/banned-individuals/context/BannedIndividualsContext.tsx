import React, { createContext, useContext, ReactNode } from 'react';
import { useBannedIndividualsState } from '../hooks/useBannedIndividualsState';

type BannedIndividualsContextType = ReturnType<typeof useBannedIndividualsState>;

const BannedIndividualsContext = createContext<BannedIndividualsContextType | undefined>(undefined);

export const BannedIndividualsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const state = useBannedIndividualsState();
    return (
        <BannedIndividualsContext.Provider value={state}>
            {children}
        </BannedIndividualsContext.Provider>
    );
};

export const useBannedIndividualsContext = () => {
    const context = useContext(BannedIndividualsContext);
    if (context === undefined) {
        throw new Error('useBannedIndividualsContext must be used within a BannedIndividualsProvider');
    }
    return context;
};

