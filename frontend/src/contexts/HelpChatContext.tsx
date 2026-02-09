/**
 * Global state for the Help & Support live chat panel.
 * When open, the chat stays visible across module navigation so users can
 * follow the bot's steps while clicking through the system.
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HelpChatContextValue {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const HelpChatContext = createContext<HelpChatContextValue | null>(null);

export function HelpChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);
  return (
    <HelpChatContext.Provider value={{ isChatOpen, openChat, closeChat }}>
      {children}
    </HelpChatContext.Provider>
  );
}

export function useHelpChat(): HelpChatContextValue {
  const ctx = useContext(HelpChatContext);
  if (!ctx) {
    throw new Error('useHelpChat must be used within HelpChatProvider');
  }
  return ctx;
}

export function useHelpChatOptional(): HelpChatContextValue | null {
  return useContext(HelpChatContext);
}
