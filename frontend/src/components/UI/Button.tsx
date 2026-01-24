import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'destructive' | 'subtle' | 'link' | 'warning' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      default: 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10 transition-all',
      primary: 'bg-[rgba(37,99,235,0.2)] text-white border border-[rgba(37,99,235,0.3)] shadow-[0_0_10px_rgba(37,99,235,0.2)] hover:bg-[rgba(37,99,235,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]',
      outline: 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
      ghost: 'text-slate-400 hover:bg-white/5 hover:text-white',
      destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300',
      subtle: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
      link: 'text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline',
      warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300',
      glass: 'bg-white/5 backdrop-blur-sm border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
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

