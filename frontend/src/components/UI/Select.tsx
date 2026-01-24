import React from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    className,
    containerClassName,
    children,
    ...props
}) => {
    return (
        <div className={cn("space-y-1.5", containerClassName)}>
            {label && (
                <label
                    className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1"
                    htmlFor={props.id}
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                <select
                    className={cn(
                        "w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm font-bold text-[color:var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/5 [&>option]:bg-[color:var(--console-dark)] [&>option]:text-[color:var(--text-main)]",
                        error && "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[color:var(--text-sub)] opacity-40 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-chevron-down text-[10px]" />
                </div>
            </div>
            {error && (
                <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-50 ml-1">
                    {helperText}
                </p>
            )}
        </div>
    );
};

Select.displayName = 'Select';
