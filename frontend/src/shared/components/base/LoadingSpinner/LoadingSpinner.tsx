import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  message?: string;
  container?: 'default' | 'fullScreen' | 'overlay' | 'inline';
  className?: string;
  'aria-label'?: string;
  testId?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'spinner',
  size = 'medium',
  color = 'primary',
  message,
  container = 'default',
  className = '',
  'aria-label': ariaLabel,
  testId
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={`${styles.spinner} ${styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${styles[`spinner${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}
            role="status"
            aria-label={ariaLabel || 'Loading...'}
          />
        );
      
      case 'dots':
        return (
          <div className={`${styles.dots} ${styles[`dots${size.charAt(0).toUpperCase() + size.slice(1)}`]}`} role="status" aria-label={ariaLabel || 'Loading...'}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div
            className={`${styles.pulse} ${styles[`pulse${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}
            role="status"
            aria-label={ariaLabel || 'Loading...'}
          />
        );
      
      case 'skeleton':
        return (
          <div className={styles.skeleton} role="status" aria-label={ariaLabel || 'Loading content...'}>
            <div className={styles.skeletonText}></div>
            <div className={styles.skeletonText}></div>
            <div className={styles.skeletonText}></div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const containerClass = container !== 'default' ? styles[container] : '';
  const wrapperClass = container === 'inline' ? styles.inline : styles.container;

  return (
    <div className={`${wrapperClass} ${containerClass} ${className}`} data-testid={testId}>
      <div className={styles.spinnerWrapper}>
        {renderSpinner()}
        {message && <div className={styles.message}>{message}</div>}
      </div>
      <span className={styles.srOnly}>
        {ariaLabel || 'Loading, please wait...'}
      </span>
    </div>
  );
};

// Specialized components
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.buttonSpinner} ${className || ''}`} role="status" aria-label="Loading..." />
);

export const TableSpinner: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className={styles.tableSpinner}>
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