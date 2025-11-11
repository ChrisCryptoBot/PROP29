/**
 * Page Container Component for PROPER 2.9
 * Consistent page layout and structure for all modules
 */

import React, { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  children,
  className = '',
  actions,
  breadcrumbs
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumbs */}
            {breadcrumbs && (
              <div className="mb-4">
                {breadcrumbs}
              </div>
            )}
            
            {/* Title and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className="flex items-center space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 