import React from 'react';

const Incidents: React.FC = () => {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="section-title">
          <i className="fas fa-exclamation-triangle"></i>
          Incident Management
        </h1>
      </div>

      <div className="admin-main">
        <div className="admin-section">
          <h2 className="section-title">
            <i className="fas fa-clipboard-list"></i>
            Active Incidents
          </h2>
          <p className="section-description">
            Monitor and manage security incidents with AI-powered prediction and automated response protocols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Incidents; 