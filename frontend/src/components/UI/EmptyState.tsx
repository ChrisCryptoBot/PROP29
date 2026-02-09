import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export type EmptyStateAction =
  | {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'destructive';
    }
  | React.ReactNode;

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
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
    <div className={cn(
      'text-center py-20 px-8 rounded-md border border-dashed border-white/10 bg-[color:var(--glass-card-bg)] group transition-colors',
      className
    )}>
      <div className="flex justify-center mb-6">
        <i className={cn(icon, 'text-5xl text-[color:var(--text-muted)] transition-opacity')} aria-hidden></i>
      </div>
      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{title}</h3>
      {description && (
        <p className="text-sm text-[color:var(--text-sub)] max-w-xs mx-auto leading-relaxed mb-8 font-medium opacity-95">
          {description}
        </p>
      )}
      {action && (
        typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action ? (
          <Button
            onClick={(action as { onClick: () => void }).onClick}
            variant="outline"
            className="font-black uppercase tracking-widest px-10 text-[10px] border border-white/10 text-[color:var(--text-sub)] hover:text-white hover:bg-white/10 hover:border-white/20"
          >
            {(action as { label: string }).label}
          </Button>
        ) : (
          action
        )
      )}
    </div>
  );
};

export { EmptyState };

