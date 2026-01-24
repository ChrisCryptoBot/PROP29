/**
 * Visitor Context
 * React Context for Visitor Security feature
 * Provides global state and actions to components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useVisitorState, UseVisitorStateReturn } from '../hooks/useVisitorState';

// Define the context value type (matches the hook return type)
export interface VisitorContextValue extends UseVisitorStateReturn {}

// Create the context
const VisitorContext = createContext<VisitorContextValue | undefined>(undefined);

// Provider component
export interface VisitorProviderProps {
  children: ReactNode;
}

export const VisitorProvider: React.FC<VisitorProviderProps> = ({ children }) => {
  const state = useVisitorState();

  return (
    <VisitorContext.Provider value={state}>
      {children}
    </VisitorContext.Provider>
  );
};

// Custom hook to use the context
export const useVisitorContext = (): VisitorContextValue => {
  const context = useContext(VisitorContext);
  if (context === undefined) {
    throw new Error('useVisitorContext must be used within a VisitorProvider');
  }
  return context;
};

// Export the context for testing or advanced use cases
export { VisitorContext };

