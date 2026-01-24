import React, { ReactNode, useEffect, useState } from 'react';
import Sidebar from '../UI/Sidebar';
import { GlobalClock } from '../UI/GlobalClock';
import { GlobalRefreshButton } from '../UI/GlobalRefreshButton';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // No overflow-x-auto / overflow here: ancestors with overflow break position:sticky on module tabs (UI-GOLDSTANDARD).
    <div className="min-h-screen min-w-[1280px] console-theme bg-[color:var(--console-dark)]">
      <GlobalClock />
      <Sidebar />
      <main className="ml-[17.5rem] w-[calc(100%-17.5rem)]">
        <div className="flex justify-end px-6 pt-4">
          <div className="flex items-center gap-3">
            <GlobalRefreshButton />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
