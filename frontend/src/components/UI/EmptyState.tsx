import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'destructive';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'fas fa-inbox',
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('text-center py-12 px-6', className)}>
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className={cn(icon, 'text-3xl text-slate-400')}></i>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          <i className="fas fa-plus mr-2"></i>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
