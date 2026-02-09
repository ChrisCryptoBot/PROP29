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
      default: 'border-transparent text-blue-300 bg-white/5',
      secondary: 'border-transparent text-slate-300 bg-white/5',
      destructive: 'border-transparent text-red-300 bg-red-500/10',
      outline: 'text-slate-200 border-white/20 bg-white/5',
      success: 'border-transparent text-green-300 bg-green-500/10',
      warning: 'border-transparent text-amber-300 bg-amber-500/10',
      info: 'border-transparent text-cyan-300 bg-cyan-500/10'
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

