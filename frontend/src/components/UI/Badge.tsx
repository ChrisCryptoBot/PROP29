import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm'
    };
    
    const variants = {
      default: 'border-transparent text-blue-300 bg-white/5 shadow-[0_0_12px_rgba(37,99,235,0.35)]',
      secondary: 'border-transparent text-slate-300 bg-white/5 shadow-[0_0_10px_rgba(148,163,184,0.25)]',
      destructive: 'border-transparent text-red-300 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      outline: 'text-slate-200 border-white/20 bg-white/5',
      success: 'border-transparent text-green-300 bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.4)]',
      warning: 'border-transparent text-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      info: 'border-transparent text-cyan-300 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
    };

    return (
      <div
        className={cn(baseClasses, sizeClasses[size], variants[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

