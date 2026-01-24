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
    <div className={cn(
      'text-center py-20 px-8 rounded-2xl border border-dashed border-[color:var(--border-subtle)]/30 bg-[color:var(--console-dark)]/30 backdrop-blur-sm group transition-all hover:bg-white/[0.02]',
      className
    )}>
      <div className="flex justify-center mb-6">
        <i className={cn(icon, 'text-5xl text-[color:var(--text-sub)] opacity-20 group-hover:opacity-40 transition-all duration-500 transform group-hover:scale-110')}></i>
      </div>
      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{title}</h3>
      {description && (
        <p className="text-sm text-[color:var(--text-sub)] max-w-xs mx-auto leading-relaxed mb-8 font-medium">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="font-black uppercase tracking-widest px-10 text-[10px] border-[color:var(--border-subtle)] text-[color:var(--text-sub)] hover:text-white hover:bg-white/5 shadow-lg shadow-black/20"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };

