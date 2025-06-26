import React, { useEffect, useState } from 'react';
import logo from '../../assets/Final_logo.png';

const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500); // Show for 2.5s
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#f8f8f6',
        display: visible ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.8s',
        opacity: visible ? 1 : 0,
      }}
    >
      <img
        src={logo}
        alt="Proper 2.9 Logo"
        style={{
          width: 180,
          height: 180,
          animation: 'splash-bounce 1.2s cubic-bezier(.68,-0.55,.27,1.55) infinite',
        }}
      />
      <style>{`
        @keyframes splash-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen; 