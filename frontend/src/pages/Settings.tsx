import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="section-title">
          <i className="fas fa-cog"></i>
          Settings
        </h1>
      </div>

      <div className="admin-content">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <nav className="admin-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="admin-main">
          {activeTab === 'profile' && (
            <div className="admin-section">
              <h2 className="section-title">
                <i className="fas fa-user"></i>
                Profile Settings
              </h2>
              <div className="settings-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="admin-section">
              <h2 className="section-title">
                <i className="fas fa-shield-alt"></i>
                Security Settings
              </h2>
              <div className="settings-actions">
                <button className="btn-primary">
                  <i className="fas fa-key"></i>
                  Change Password
                </button>
                <button className="btn-secondary">
                  <i className="fas fa-lock"></i>
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="admin-section">
              <h2 className="section-title">
                <i className="fas fa-bell"></i>
                Notification Preferences
              </h2>
              <div className="settings-toggle">
                <div className="toggle-item">
                  <span>Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="toggle-input"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="admin-section">
              <h2 className="section-title">
                <i className="fas fa-palette"></i>
                Appearance
              </h2>
              <div className="settings-toggle">
                <div className="toggle-item">
                  <span>Dark Mode</span>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="toggle-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 
