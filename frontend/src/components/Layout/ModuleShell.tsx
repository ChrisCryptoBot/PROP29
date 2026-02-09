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
      <header className="glass-strong border-b border-white/10 relative shrink-0">
        <div className="max-w-[1800px] mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="w-16 h-16 rounded-md glass-card flex items-center justify-center">
                <div className="text-2xl text-white">{icon}</div>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="module-header-title">{title}</h1>
                {statusLabel && (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {statusLabel}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)] mt-2">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
        </div>
      </header>

      {/* Tab bar: UI-GOLDSTANDARD §5 — flat, sticky, left-aligned; active = white + 2px blue bottom border (no pill, no glow) */}
      {tabs.length > 0 && onTabChange && activeTab && (
        <div
          className="sticky top-0 z-[70] shrink-0 border-b border-white/10 bg-[color:var(--console-dark)]"
          style={{ minHeight: '48px' }}
        >
          <div className="max-w-[1800px] mx-auto px-6">
            <nav
              role="tablist"
              aria-label="Module tabs"
              className="flex items-stretch gap-0 -mb-px"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors duration-150',
                      'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]',
                      isActive
                        ? 'text-white border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main
        className="relative max-w-[1800px] mx-auto px-6 py-8"
        role={tabs.length > 0 && activeTab ? 'tabpanel' : undefined}
        id={tabs.length > 0 && activeTab ? `panel-${activeTab}` : undefined}
        aria-labelledby={tabs.length > 0 && activeTab ? `tab-${activeTab}` : undefined}
      >
        {children}
      </main>
    </div>
  );
};

export default ModuleShell;
