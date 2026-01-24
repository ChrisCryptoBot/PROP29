import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../services/logger';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  stats: { label: string; value: string | number }[];
  enhancement?: { type: string; icon: string; label: string };
  className?: string;
  route?: string;
  onClick?: () => void;
  color?: string;
  children?: React.ReactNode;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  icon, 
  stats, 
  enhancement, 
  className = '',
  route,
  onClick,
  color = '#f59e0b',
  children
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    if (route) {
      logger.debug('ModuleCard: Navigating to route', { module: 'ModuleCard', action: 'handleClick', title, route });
      navigate(route);
    } else {
      logger.debug('ModuleCard: No route provided', { module: 'ModuleCard', action: 'handleClick', title });
    }
  };

  return (
    <div 
      className={`module-card ${className} ${(route || onClick) ? 'clickable' : ''}`}
      onClick={handleClick}
      style={{ cursor: (route || onClick) ? 'pointer' : 'default' }}
    >
      {enhancement && (
        <div className={`enhancement-badge ${enhancement.type}`}>
          <i className={enhancement.icon}></i>
          {enhancement.label}
        </div>
      )}
      <div className="module-header">
        <div className="module-icon" style={{ background: color, borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <i className={icon} style={{ fontSize: 24, color: '#222' }}></i>
        </div>
      </div>
      <div className="module-content">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="module-stats">
          {stats.map((stat, index) => (
            <span key={index} className="module-stat">
              {stat.label}: <strong>{stat.value}</strong>
            </span>
          ))}
        </div>
        {children}
      </div>
      {(route || onClick) && (
        <div className="module-action">
          <i className="fas fa-arrow-right"></i>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
