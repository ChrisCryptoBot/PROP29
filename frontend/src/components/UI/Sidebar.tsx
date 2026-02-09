import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { SearchBar } from './SearchBar';
import { logger } from '../../services/logger';
import { useNotifications } from '../../contexts/NotificationsContext';
import './Sidebar.css';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: SidebarItem[];
  badge?: string;
  badgeColor?: 'red' | 'orange' | 'green' | 'blue';
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount } = useNotifications();
  const [expandedSections, setExpandedSections] = useState<string[]>(['enhanced-security']);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const recentNotifications = useMemo(
    () => [...notifications].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 3),
    [notifications]
  );

  const sidebarItems: SidebarItem[] = [
    {
      id: 'enhanced-security',
      label: 'Enhanced Security Modules',
      icon: 'fas fa-shield-alt',
      children: [
        { id: 'patrol-command', label: 'Patrol Command Center', icon: 'fas fa-route', path: '/modules/patrol' },
        { id: 'access-control', label: 'Access Control', icon: 'fas fa-key', path: '/modules/access-control' },
        { id: 'security-operations-center', label: 'Security Operations Center', icon: 'fas fa-video', path: '/modules/security-operations-center' },
        { id: 'event-log', label: 'Incident Log', icon: 'fas fa-list-alt', path: '/modules/event-log' },
        { id: 'visitors', label: 'Visitor Security', icon: 'fas fa-users', path: '/modules/visitors' },
        { id: 'guest-safety', label: 'Guest Safety', icon: 'fas fa-user-shield', path: '/modules/guest-safety' },
        { id: 'property-items', label: 'Property Items', icon: 'fas fa-archive', path: '/modules/property-items' },
        { id: 'smart-lockers', label: 'Smart Lockers', icon: 'fas fa-lock', path: '/modules/smart-lockers' },
        { id: 'smart-parking', label: 'Smart Parking', icon: 'fas fa-car', path: '/modules/smart-parking' },
        { id: 'digital-handover', label: 'Digital Handover', icon: 'fas fa-exchange-alt', path: '/modules/digital-handover' },
        { id: 'team-chat', label: 'Team Chat', icon: 'fas fa-comments', path: '/modules/team-chat' },
        { id: 'iot-monitoring', label: 'IoT Monitoring', icon: 'fas fa-microchip', path: '/modules/iot-monitoring' },
        { id: 'system-admin', label: 'System Administration', icon: 'fas fa-cog', path: '/modules/system-administration' },
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      logger.debug('Sidebar: Navigating to item', { module: 'Sidebar', action: 'handleItemClick', label: item.label, path: item.path });
      navigate(item.path);
    }
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return false;
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 text-white';
      case 'orange': return 'bg-orange-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'blue': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleProfileAction = (action: string) => {
    setProfileDropdownOpen(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      case 'help':
        navigate('/help');
        break;
      case 'logout':
        navigate('/login');
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={cn(
        "sidebar-container",
        isCollapsed && "collapsed"
      )}
    >
      {/* Sidebar Header - product name + subtitle */}
      <div className="sidebar-header">
        <div className="flex items-center justify-center w-full gap-2">
          {!isCollapsed && (
            <div className="min-w-0 flex flex-col">
              <h2 className="text-base font-black uppercase tracking-tight text-[color:var(--text-main)] truncate">Proper 2.9</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--text-sub)]">Security Consoles</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="sidebar-search">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search modules..."
          />
        </div>
      )}

      {/* Navigation - Enhanced Security Modules dropdown */}
      <nav className="sidebar-nav" role="navigation" aria-label="Security modules">
        {sidebarItems.map((item) => (
          <div key={item.id} className="sidebar-section">
            <button
              type="button"
              onClick={() => toggleSection(item.id)}
              className={cn(
                "sidebar-item",
                expandedSections.includes(item.id) && "expanded"
              )}
              aria-expanded={expandedSections.includes(item.id)}
              aria-controls={`sidebar-modules-${item.id}`}
              id={`sidebar-toggle-${item.id}`}
            >
              <i className={item.icon} aria-hidden></i>
              {!isCollapsed && (
                <>
                  <span className="sidebar-label">{item.label}</span>
                  <i className={cn(
                    "fas fa-chevron-down sidebar-chevron",
                    expandedSections.includes(item.id) && "rotate-180"
                  )} aria-hidden></i>
                </>
              )}
            </button>

            {!isCollapsed && expandedSections.includes(item.id) && item.children && (
              <div
                id={`sidebar-modules-${item.id}`}
                className="sidebar-children"
                role="group"
                aria-labelledby={`sidebar-toggle-${item.id}`}
              >
                <div className="sidebar-children-label">Modules</div>
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleItemClick(child)}
                    className={cn(
                      "sidebar-child",
                      isItemActive(child) && "active"
                    )}
                  >
                    <i className={child.icon} aria-hidden></i>
                    <span className="sidebar-label">{child.label}</span>
                    {child.badge && (
                      <span className={cn(
                        "sidebar-module-badge",
                        getBadgeColor(child.badgeColor || 'blue')
                      )}>
                        {child.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-profile">
        {!isCollapsed ? (
          <div className="profile-expanded" onClick={handleProfileClick}>
            <div className="profile-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="profile-info">
              <div className="profile-name">Admin User</div>
              <div className="profile-role">Administrator</div>
            </div>
            <div className="profile-status">
              <div className="status-dot"></div>
            </div>
            <i className={cn(
              "fas fa-chevron-down profile-arrow",
              profileDropdownOpen && "rotate-180"
            )}></i>
          </div>
        ) : (
          <div className="profile-collapsed" onClick={handleProfileClick}>
            <div className="profile-avatar-small">
              <i className="fas fa-user"></i>
            </div>
          </div>
        )}

        {/* Profile Dropdown - flat styling */}
        {profileDropdownOpen && !isCollapsed && (
          <div
            className="profile-dropdown"
            role="menu"
            aria-label="User menu"
          >
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-avatar" aria-hidden>
                <i className="fas fa-user"></i>
              </div>
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-name">Admin User</div>
                <div className="profile-dropdown-email">admin@proper29.com</div>
              </div>
            </div>

            <div className="profile-dropdown-items">
              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('profile')}
                role="menuitem"
              >
                <i className="fas fa-user-cog" aria-hidden></i>
                <span>Profile Settings</span>
              </button>
              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('settings')}
                role="menuitem"
              >
                <i className="fas fa-cog" aria-hidden></i>
                <span>Account Settings</span>
              </button>
              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('notifications')}
                role="menuitem"
              >
                <i className="fas fa-bell" aria-hidden></i>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-count" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {recentNotifications.length > 0 && (
                <div className="profile-dropdown-recent">
                  <div className="profile-dropdown-recent-label">Recent alerts</div>
                  {recentNotifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="profile-dropdown-recent-item"
                      onClick={() => {
                        handleProfileAction('notifications');
                      }}
                      role="menuitem"
                    >
                      <span className="profile-dropdown-recent-title">{n.title}</span>
                      <span className="profile-dropdown-recent-time">
                        {new Date(n.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="profile-dropdown-recent-viewall"
                    onClick={() => handleProfileAction('notifications')}
                    role="menuitem"
                  >
                    View all notifications
                  </button>
                </div>
              )}
              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('help')}
                role="menuitem"
              >
                <i className="fas fa-question-circle" aria-hidden></i>
                <span>Help & Support</span>
              </button>
              <div className="profile-dropdown-divider" role="separator"></div>
              <button
                type="button"
                className="profile-dropdown-item logout-item"
                onClick={() => handleProfileAction('logout')}
                role="menuitem"
              >
                <i className="fas fa-sign-out-alt" aria-hidden></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer - design tokens */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="text-center space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">© 2024 Proper 2.9</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] italic text-[color:var(--text-sub)] mt-1">Security Management System</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
