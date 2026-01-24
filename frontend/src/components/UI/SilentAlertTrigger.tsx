import React from 'react';

// Minimal Dot with Pulse Animation SVG
const SilentAlertTrigger: React.FC<{ onTrigger?: () => void }> = ({ onTrigger }) => {
  return (
    <button
      className="silent-alert"
      onClick={onTrigger}
      title="Trigger Silent Security Alert"
      aria-label="Trigger Silent Security Alert"
      style={{
        position: 'fixed',
        top: 15,
        right: 60,
        zIndex: 1000,
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        outline: 'none',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        {/* Outer ring */}
        <circle cx="10" cy="10" r="8" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
        {/* Main dot */}
        <circle cx="10" cy="10" r="3" fill="#3b82f6" />
        {/* Inner highlight */}
        <circle cx="9" cy="9" r="1" fill="#ffffff" opacity="0.6" />
        {/* Pulse animation (subtle) */}
        <circle cx="10" cy="10" r="6" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </button>
  );
};

export default SilentAlertTrigger; 
