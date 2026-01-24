import React, { createContext, useContext, ReactNode } from 'react';
import { useTeamChatState } from '../hooks/useTeamChatState';

type TeamChatContextType = ReturnType<typeof useTeamChatState>;

const TeamChatContext = createContext<TeamChatContextType | undefined>(undefined);

export const TeamChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const state = useTeamChatState();
    return (
        <TeamChatContext.Provider value={state}>
            {children}
        </TeamChatContext.Provider>
    );
};

export const useTeamChatContext = () => {
    const context = useContext(TeamChatContext);
    if (context === undefined) {
        throw new Error('useTeamChatContext must be used within a TeamChatProvider');
    }
    return context;
};

