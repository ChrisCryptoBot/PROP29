import React, { useState, useRef } from 'react';
import BackToDashboardButton from './BackToDashboardButton';

interface ModuleHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  setActiveTab?: (tabId: string) => void;
  loading?: boolean;
}

const MAX_VISIBLE_TABS = 6;

const ModuleHeader: React.FC<ModuleHeaderProps> = ({ icon, title, subtitle, tabs = [], activeTab, setActiveTab, loading }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const visibleTabs = tabs.slice(0, MAX_VISIBLE_TABS);
  const moreTabs = tabs.slice(MAX_VISIBLE_TABS);

  return (
    <div className="module-header" style={{ 
      position: 'relative', 
      minHeight: 64, 
      width: '100%',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 50%, rgba(226, 232, 240, 0.95) 100%)',
      borderBottom: '2px solid rgba(226, 232, 240, 0.4)',
      padding: '1rem 0',
      marginTop: 0,
      paddingTop: 0,
      boxShadow: '0 4px 15px rgba(226, 232, 240, 0.2)'
    }}>
      {/* Light gray accent bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #e2e8f0, #cbd5e1, #94a3b8)',
        borderRadius: '0 0 3px 3px',
        boxShadow: '0 2px 8px rgba(226, 232, 240, 0.4)'
      }} />
      
      {/* Left: Back button */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 1, height: '100%', marginLeft: 20 }}>
        <BackToDashboardButton />
      </div>
      
      {/* Center: Icon, title, and subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
          <span style={{ marginRight: '0.75rem', fontSize: '2rem', color: '#1a1a1a', textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>{icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: 700, fontSize: '2rem', color: '#1a1a1a', textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>{title}</span>
            {subtitle && (
              <span style={{ 
                fontSize: '0.95rem', 
                color: '#2d2d2d', 
                fontWeight: 400,
                marginTop: '0.25rem'
              }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Right: Dropdown Tabs */}
      {tabs.length > 0 && setActiveTab && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 1, height: '100%' }} ref={dropdownRef}>
          <button
            className="module-tabs-dropdown-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              fontSize: 16,
              fontWeight: 500,
              border: '1px solid #dbeafe',
              borderRadius: 8,
              background: '#ffffff',
              color: '#2563eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              zIndex: 2
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#2563eb';
            }}
            onClick={() => setShowDropdown(v => !v)}
            disabled={loading}
            aria-haspopup="listbox"
            aria-expanded={showDropdown}
          >
            {title} Menu <span className="ml-2">⋮</span>
          </button>
          {showDropdown && (
            <div
              className="module-tabs-dropdown-list"
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                minWidth: 224,
                background: '#fff',
                border: '1px solid #dbeafe',
                borderRadius: 8,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 10,
                padding: 0
              }}
              role="listbox"
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`module-tabs-dropdown-item${tab.id === activeTab ? ' active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: tab.id === activeTab ? 500 : 400,
                    color: tab.id === activeTab ? '#2563eb' : '#6b7280',
                    background: tab.id === activeTab ? '#eff6ff' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (tab.id !== activeTab) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tab.id !== activeTab) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowDropdown(false);
                  }}
                  disabled={loading}
                  role="option"
                  aria-selected={tab.id === activeTab}
                >
                  <i className={`fas ${
                    tab.id === 'management' ? 'fa-tasks' :
                    tab.id === 'tracking' ? 'fa-map-marker-alt' :
                    tab.id === 'optimization' ? 'fa-brain' :
                    tab.id === 'analytics' ? 'fa-chart-bar' :
                    tab.id === 'settings' ? 'fa-cog' :
                    'fa-circle'
                  } mr-3`} style={{ fontSize: '14px', width: '16px' }}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleHeader; 