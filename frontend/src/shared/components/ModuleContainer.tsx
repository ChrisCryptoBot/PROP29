import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import type { ModuleDefinition } from '../../types/module';

interface ModuleContainerProps {
  module: ModuleDefinition;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({
  module,
  children,
  fallback,
  className = ''
}) => {
  const defaultFallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner 
        size="lg" 
        text={`Loading ${module.name}...`}
      />
    </div>
  );

  return (
    <div className={`module-container ${className}`}>
      <ErrorBoundary 
        moduleId={module.id}
        fallback={fallback}
      >
        <Suspense fallback={defaultFallback}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default ModuleContainer; 