/**
 * Base Components Index for PROPER 2.9
 * Exports all base UI components
 * 
 * Note: ErrorBoundary and LoadingSpinner have been consolidated to components/UI/
 * These exports maintain backward compatibility
 */

export { ErrorBoundary, default as ErrorBoundaryDefault } from '../../../components/UI/ErrorBoundary';
import LoadingSpinnerDefault, { ButtonSpinner, TableSpinner, PageSpinner, InlineSpinner } from '../../../components/UI/LoadingSpinner';
export type { ErrorBoundaryProps, ErrorFallbackProps } from '../../../components/UI/ErrorBoundary';
export type { LoadingSpinnerProps } from '../../../components/UI/LoadingSpinner';
export { ButtonSpinner, TableSpinner, PageSpinner, InlineSpinner };
export { LoadingSpinnerDefault as LoadingSpinner };
export { default as LoadingSpinnerDefault } from '../../../components/UI/LoadingSpinner';
export { default as AIUpdateGuide } from './AIUpdateGuide';
