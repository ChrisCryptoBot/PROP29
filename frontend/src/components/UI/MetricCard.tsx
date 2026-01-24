import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend: 'up' | 'down';
  trendValue: string;
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendValue, className = '', onClick }) => (
  <div 
    className={`metric-card ${className} ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div className="metric-header">
      <div className="metric-icon">
        <i className={icon}></i>
      </div>
      <div className={`metric-trend ${trend === 'down' ? 'down' : ''}`}>
        <i className={`fas fa-arrow-${trend}`}></i> {trendValue}
      </div>
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-label">{title}</div>
  </div>
);

export default MetricCard; 
