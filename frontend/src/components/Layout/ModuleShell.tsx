import React from 'react';
import { cn } from '../../utils/cn';

interface ModuleTab<T extends string> {
  id: T;
  label: React.ReactNode;
}

interface ModuleShellProps<T extends string = string> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  tabs?: ModuleTab<T>[];
  activeTab?: T;
  onTabChange?: (tabId: T) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const ModuleShell = <T extends string,>({
  icon,
  title,
  subtitle,
  statusLabel,
  tabs = [],
  activeTab,
  onTabChange,
  actions,
  children,
}: ModuleShellProps<T>) => {
  return (
    <div className="min-h-screen console-theme">
      {/* Header: scrolls with page. Tabs below stick to viewport on scroll (see Module Layout in UI-GOLDSTANDARD). */}
      <header className="glass-strong border-b border-white/10 shadow-2xl relative shrink-0">
        <div className="max-w-[1800px] mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center">
                <div className="text-2xl text-white">{icon}</div>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">{title}</h1>
                {statusLabel && (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    {statusLabel}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-2">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
        </div>
      </header>

      {tabs.length > 0 && onTabChange && activeTab && (
        <div className="sticky top-0 z-[70] bg-[color:var(--console-dark)]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shrink-0">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex justify-center">
              <nav role="tablist" aria-label="Module tabs" className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-[color:var(--console-dark)]',
                      activeTab === tab.id
                        ? 'bg-[rgba(37,99,235,0.3)] text-white border border-[rgba(37,99,235,0.5)] shadow-[0_0_14px_rgba(37,99,235,0.5)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <main className="relative max-w-[1800px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default ModuleShell;
