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

  const hasLabelOrDescription = (label && label.trim()) || (description && description.trim());

  return (
    <div className={cn(hasLabelOrDescription ? 'flex items-center justify-between' : 'inline-flex items-center', className)}>
      {hasLabelOrDescription && (
        <div className="flex-1 mr-4">
          {label && label.trim() && (
            <h3 className="font-medium text-[color:var(--text-main)]">{label}</h3>
          )}
          {description && description.trim() && (
            <p className="text-sm text-[color:var(--text-sub)]">{description}</p>
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
            'relative bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:transition-all peer-checked:bg-blue-600',
            sizeClasses[size],
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        ></div>
      </label>
    </div>
  );
};

export { Toggle };

