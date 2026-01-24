/**
 * Lost & Found Context
 * React Context for Lost & Found feature
 * Provides global state and actions to components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useLostFoundState, UseLostFoundStateReturn } from '../hooks/useLostFoundState';

interface LostFoundContextValue extends UseLostFoundStateReturn {
    // Modal controls (managed by orchestrator)
    setShowRegisterModal?: (show: boolean) => void;
    setShowEditModal?: (show: boolean) => void;
    setShowDetailsModal?: (show: boolean) => void;
    setShowReportModal?: (show: boolean) => void;
}

const LostFoundContext = createContext<LostFoundContextValue | undefined>(undefined);

export function useLostFoundContext(): LostFoundContextValue {
    const context = useContext(LostFoundContext);
    if (!context) {
        throw new Error('useLostFoundContext must be used within LostFoundProvider');
    }
    return context;
}

interface LostFoundProviderProps {
    children: ReactNode;
    modalControls?: {
        setShowRegisterModal: (show: boolean) => void;
        setShowEditModal: (show: boolean) => void;
        setShowDetailsModal: (show: boolean) => void;
        setShowReportModal: (show: boolean) => void;
    };
}

export function LostFoundProvider({ children, modalControls }: LostFoundProviderProps) {
    const state = useLostFoundState();

    const contextValue: LostFoundContextValue = {
        ...state,
        ...modalControls,
    };

    return (
        <LostFoundContext.Provider value={contextValue}>
            {children}
        </LostFoundContext.Provider>
    );
}

