/**
 * Shared Components Index
 * All shared components exported from a single location
 */

// Base Components
export * from './base';

// Layout Components
export * from './layout';

// Composite Components
export * from './composite';

// Legacy Components (for backward compatibility)
// Re-export consolidated components from UI
import LoadingSpinnerDefault, { ButtonSpinner, TableSpinner, PageSpinner, InlineSpinner } from '../../components/UI/LoadingSpinner';
export { ButtonSpinner, TableSpinner, PageSpinner, InlineSpinner };
export { LoadingSpinnerDefault as LoadingSpinner };
export { default as LoadingSpinnerDefault } from '../../components/UI/LoadingSpinner';
export { ErrorBoundary, default as ErrorBoundaryDefault } from '../../components/UI/ErrorBoundary';
export type { LoadingSpinnerProps } from '../../components/UI/LoadingSpinner';
export type { ErrorBoundaryProps, ErrorFallbackProps } from '../../components/UI/ErrorBoundary';
export { default as ModuleContainer } from './ModuleContainer'; 