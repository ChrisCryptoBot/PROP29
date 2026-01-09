import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ghost: 'text-slate-700 hover:bg-slate-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700'
    };

    const sizes = {
      default: 'h-10 py-2 px-4 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10'
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
