import React, { Suspense } from 'react';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
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
        size="large" 
        message={`Loading ${module.name}...`}
      />
    </div>
  );

  return (
    <div className={`module-container ${className}`}>
      <ErrorBoundary 
        moduleName={module.name}
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
