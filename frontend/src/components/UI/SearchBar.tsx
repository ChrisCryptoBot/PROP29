import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'dark';
}

/**
 * SearchBar component with built-in debounce
 * Uses setTimeout instead of lodash for zero dependencies
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  disabled = false,
  variant = 'default'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const inputClasses =
    variant === 'dark'
      ? 'w-full pl-10 pr-10 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500/60'
      : 'w-full pl-10 pr-10 py-2 border border-white/20 rounded-lg bg-white/5 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500/60';

  const iconClasses = variant === 'dark' ? 'text-white' : 'text-slate-300';
  const clearClasses = variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-slate-300 hover:text-white';

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <i className={cn('fas fa-search absolute left-3 top-1/2 -translate-y-1/2', iconClasses)}></i>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            inputClasses,
            'disabled:bg-slate-100 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              clearClasses,
              'disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
            aria-label="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export { SearchBar };

