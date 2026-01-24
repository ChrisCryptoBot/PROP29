/**
 * Enhanced Loading Spinner Component
 * Consolidated from multiple implementations with full variant support
 */

import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  message?: string;
  container?: 'default' | 'fullScreen' | 'overlay' | 'inline';
  className?: string;
  'aria-label'?: string;
  testId?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'spinner',
  size = 'medium',
  color = 'primary',
  message,
  container = 'default',
  className = '',
  'aria-label': ariaLabel,
  testId
}) => {
  // Normalize size prop (support both 'sm'/'md'/'lg' and 'small'/'medium'/'large')
  const normalizedSize = size === 'sm' ? 'small' : 
                         size === 'md' ? 'medium' : 
                         size === 'lg' ? 'large' : size;

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={`${styles['loading-spinner']} ${styles[`loading-spinner-${normalizedSize}`]} ${styles[`loading-spinner-${color}`]}`}
            role="status"
            aria-label={ariaLabel || 'Loading...'}
          />
        );
      
      case 'dots':
        return (
          <div className={`${styles['loading-dots']} ${styles[`loading-dots-${normalizedSize}`]}`} role="status" aria-label={ariaLabel || 'Loading...'}>
            <div className={styles['loading-dot']}></div>
            <div className={styles['loading-dot']}></div>
            <div className={styles['loading-dot']}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div
            className={`${styles['loading-pulse']} ${styles[`loading-pulse-${normalizedSize}`]}`}
            role="status"
            aria-label={ariaLabel || 'Loading...'}
          />
        );
      
      case 'skeleton':
        return (
          <div className={styles['loading-skeleton']} role="status" aria-label={ariaLabel || 'Loading content...'}>
            <div className={styles['loading-skeleton-text']}></div>
            <div className={styles['loading-skeleton-text']}></div>
            <div className={styles['loading-skeleton-text']}></div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const containerClass = container !== 'default' ? styles[`loading-container-${container}`] : '';
  const wrapperClass = container === 'inline' ? styles['loading-inline'] : styles['loading-container'];

  return (
    <div className={`${wrapperClass} ${containerClass} ${className}`} data-testid={testId}>
      <div className={styles['loading-spinner-wrapper']}>
        {renderSpinner()}
        {message && <div className={styles['loading-message']}>{message}</div>}
      </div>
      <span className={styles['sr-only']}>
        {ariaLabel || 'Loading, please wait...'}
      </span>
    </div>
  );
};

// Specialized components for common use cases
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles['loading-button-spinner']} ${className || ''}`} role="status" aria-label="Loading..." />
);

export const TableSpinner: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className={styles['loading-table-spinner']}>
    <LoadingSpinner variant="spinner" size="medium" message={message} />
  </div>
);

export const PageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading page...' }) => (
  <LoadingSpinner 
    variant="spinner" 
    size="large" 
    container="fullScreen" 
    message={message}
    aria-label="Page loading, please wait..."
  />
);

export const InlineSpinner: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => (
  <LoadingSpinner variant="spinner" size={size} container="inline" />
);

export default LoadingSpinner;

