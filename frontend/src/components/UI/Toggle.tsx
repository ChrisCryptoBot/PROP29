import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-9 h-5 after:h-4 after:w-4',
    md: 'w-11 h-6 after:h-5 after:w-5',
    lg: 'w-14 h-7 after:h-6 after:w-6'
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <h3 className="font-medium text-slate-900">{label}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
      )}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={cn(
            'bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:transition-all peer-checked:bg-blue-600',
            sizeClasses[size],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        ></div>
      </label>
    </div>
  );
};

export { Toggle };
