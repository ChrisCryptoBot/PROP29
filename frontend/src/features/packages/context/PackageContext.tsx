/**
 * Package Context
 * React Context for Package feature
 * Provides global state and actions to components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePackageState, UsePackageStateReturn } from '../hooks/usePackageState';

// Define the context value type (matches the hook return type)
export interface PackageContextValue extends UsePackageStateReturn {}

// Create the context
const PackageContext = createContext<PackageContextValue | undefined>(undefined);

// Provider component
export interface PackageProviderProps {
    children: ReactNode;
}

export const PackageProvider: React.FC<PackageProviderProps> = ({ children }) => {
    const state = usePackageState();

    return (
        <PackageContext.Provider value={state}>
            {children}
        </PackageContext.Provider>
    );
};

// Custom hook to use the context
export const usePackageContext = (): PackageContextValue => {
    const context = useContext(PackageContext);
    if (context === undefined) {
        throw new Error('usePackageContext must be used within a PackageProvider');
    }
    return context;
};

// Export the context for testing or advanced use cases
export { PackageContext };

