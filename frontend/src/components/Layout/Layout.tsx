import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../UI/Sidebar';
import { GlobalClock } from '../UI/GlobalClock';
import { GlobalRefreshButton } from '../UI/GlobalRefreshButton';
import { NotificationBell } from '../UI/NotificationBell';
import { NotificationToastListener } from '../UI/NotificationToastListener';
import { useHelpChatOptional } from '../../contexts/HelpChatContext';
import { LiveChatPanel } from '../../features/help-support/components/LiveChatPanel';

interface LayoutProps {
  /** When provided, render this instead of <Outlet /> (e.g. Dashboard.tsx). When omitted, Layout acts as a route parent and renders Outlet. */
  children?: ReactNode;
}

/**
 * App shell: sidebar, header, and main content (Outlet or children).
 * Live Chat panel is rendered here so it stays open when navigating between modules (when inside HelpChatProvider).
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const helpChat = useHelpChatOptional();

  return (
    // No overflow-x-auto / overflow here: ancestors with overflow break position:sticky on module tabs (UI-GOLDSTANDARD).
    <div className="min-h-screen min-w-[1280px] console-theme bg-[color:var(--console-dark)]">
      <NotificationToastListener />
      <GlobalClock />
      <Sidebar />
      <main className="ml-[17.5rem] w-[calc(100%-17.5rem)]">
        <div className="flex justify-end items-center gap-3 px-6 pt-4">
          <NotificationBell />
          <GlobalRefreshButton />
        </div>
        {children != null ? children : <Outlet />}
      </main>
      {helpChat && <LiveChatPanel isOpen={helpChat.isChatOpen} onClose={helpChat.closeChat} />}
    </div>
  );
};

export default Layout;
