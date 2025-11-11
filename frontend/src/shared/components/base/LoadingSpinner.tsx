/**
 * Loading Spinner Component for PROPER 2.9
 * Consistent loading states across all modules
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerClasses = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-3 text-sm text-gray-600 text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 