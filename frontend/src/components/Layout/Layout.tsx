import React, { ReactNode } from 'react';
import Sidebar from '../UI/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-[17.5rem] w-[calc(100%-17.5rem)]">
        {children}
      </main>
    </div>
  );
};

export default Layout;