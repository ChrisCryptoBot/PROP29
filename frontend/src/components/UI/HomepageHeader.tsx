import React, { useState, useEffect, useRef } from 'react';
import { SearchBar } from './SearchBar';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../services/logger';

const HomepageHeader: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('Security Administrator');
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Handle search functionality
      logger.debug('HomepageHeader: Searching', { module: 'HomepageHeader', action: 'handleSearch', searchTerm });
      // You can implement search logic here
    }
  };

  const handleProfileAction = (action: string) => {
    setProfileDropdownOpen(false);
    switch (action) {
      case 'profile':
        navigate('/modules/profile-settings');
        break;
      case 'settings':
        navigate('/modules/profile-settings');
        break;
      case 'logout':
        // Handle logout
        logger.info('HomepageHeader: Logging out', { module: 'HomepageHeader', action: 'handleProfileAction', actionType: action });
        break;
      default:
        break;
    }
  };

  return (
    <header className="homepage-header" style={{
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #1e1b4b 100%)',
      color: 'white',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 1001,
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Left: Logo and Brand */}
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', minWidth: 0 }} />

      {/* Center: Search Bar */}
      <div className="header-center" style={{ flex: 1, maxWidth: '100%', margin: '0 4vw', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '1400px' }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search incidents, locations, staff, threats..."
            variant="dark"
            className="w-full"
          />
          <input
            type="submit"
            value=""
            style={{
              position: 'absolute',
              right: '0',
              top: '0',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none'
            }}
          />
        </form>
      </div>

      {/* Right: Profile Dropdown */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="profile-dropdown" ref={profileDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', marginRight: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.2' }}>
                {userName}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.2' }}>
                {userRole}
              </div>
            </div>
            <i 
              className={`fas fa-chevron-${profileDropdownOpen ? 'up' : 'down'}`}
              style={{ fontSize: '12px', opacity: 0.7 }}
            />
          </button>

          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              minWidth: '200px',
              zIndex: 1000
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  {userName}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                  {userRole}
                </div>
              </div>
              
              <button
                onClick={() => handleProfileAction('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '14px 18px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#374151',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fas fa-user mr-3" style={{ width: '18px' }}></i>
                Profile
              </button>
              
              <button
                onClick={() => handleProfileAction('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '14px 18px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#374151',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fas fa-cog mr-3" style={{ width: '18px' }}></i>
                Settings
              </button>
              
              <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }}></div>
              
              <button
                onClick={() => handleProfileAction('logout')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '14px 18px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#dc2626',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fas fa-sign-out-alt mr-3" style={{ width: '18px' }}></i>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HomepageHeader;
