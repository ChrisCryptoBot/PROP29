import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { SearchBar } from './SearchBar';
import { logger } from '../../services/logger';
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['enhanced-security']);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="flex items-center justify-center w-full">
          {!isCollapsed && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">P2.9</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Proper 2.9</h2>
              <p className="text-sm text-gray-600">Security Systems</p>
            </div>
          )}
          {isCollapsed && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P2.9</span>
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

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
          <div key={item.id} className="sidebar-section">
            <button
              onClick={() => toggleSection(item.id)}
              className={cn(
                "sidebar-item",
                expandedSections.includes(item.id) && "expanded"
              )}
            >
              <i className={item.icon}></i>
              {!isCollapsed && (
                <>
                  <span className="sidebar-label">{item.label}</span>
                  <i className={cn(
                    "fas fa-chevron-down transition-transform duration-200",
                    expandedSections.includes(item.id) && "rotate-180"
                  )}></i>
                </>
              )}
            </button>

            {!isCollapsed && expandedSections.includes(item.id) && item.children && (
              <div className="sidebar-children">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleItemClick(child)}
                    className={cn(
                      "sidebar-child",
                      isItemActive(child) && "active"
                    )}
                  >
                    <i className={child.icon}></i>
                    <span className="sidebar-label">{child.label}</span>
                    {child.badge && (
                      <span className={cn(
                        "badge text-xs px-2 py-1 rounded-full",
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

        {/* Profile Dropdown */}
        {profileDropdownOpen && !isCollapsed && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-name">Admin User</div>
                <div className="profile-dropdown-email">admin@proper29.com</div>
              </div>
            </div>

            <div className="profile-dropdown-items">
              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('profile')}
              >
                <i className="fas fa-user-cog"></i>
                <span>Profile Settings</span>
              </button>
              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('settings')}
              >
                <i className="fas fa-cog"></i>
                <span>Account Settings</span>
              </button>
              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('notifications')}
              >
                <i className="fas fa-bell"></i>
                <span>Notifications</span>
                <span className="notification-count">3</span>
              </button>
              <button
                className="profile-dropdown-item"
                onClick={() => handleProfileAction('help')}
              >
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
              </button>
              <div className="profile-dropdown-divider"></div>
              <button
                className="profile-dropdown-item logout-item"
                onClick={() => handleProfileAction('logout')}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="text-center space-y-3">
            <div>
              <p className="text-sm text-gray-500">© 2024 Proper 2.9</p>
              <p className="text-xs text-gray-400">Security Management System</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
