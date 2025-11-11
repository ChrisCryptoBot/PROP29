import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  moduleName?: string;
  errorType?: 'module' | 'network' | 'critical';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  moduleName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  testId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error (${this.props.moduleName || 'Unknown Module'})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to external error tracking service
    if (window.errorTracker) {
      window.errorTracker.captureException(error, {
        tags: { 
          module: this.props.moduleName || 'unknown',
          errorBoundary: true 
        },
        extra: { 
          errorInfo,
          errorId: this.state.errorId,
          componentStack: errorInfo.componentStack
        }
      });
    }

    // Report to performance monitor
    if (window.PerformanceMonitor) {
      window.PerformanceMonitor.recordError(this.props.moduleName || 'global', {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        errorId: this.state.errorId
      });
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const fallbackProps: ErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo || undefined,
        resetError: this.resetError,
        moduleName: this.props.moduleName,
        errorType: this.getErrorType(this.state.error)
      };

      if (this.props.fallback) {
        return <this.props.fallback {...fallbackProps} />;
      }

      return <ModuleErrorFallback {...fallbackProps} />;
    }

    return this.props.children;
  }

  private getErrorType(error: Error): 'module' | 'network' | 'critical' {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('fetch') || message.includes('http')) {
      return 'network';
    }

    if (name.includes('syntax') || name.includes('reference') || name.includes('type')) {
      return 'critical';
    }

    return 'module';
  }
}

// Default error fallback component
export const ModuleErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  moduleName,
  errorType = 'module'
}) => {
  const errorTypeClass = styles[`${errorType}Error`];
  const errorDetails = {
    'Error ID': errorInfo?.componentStack ? crypto.randomUUID().slice(0, 8) : 'N/A',
    'Module': moduleName || 'Unknown',
    'Time': new Date().toLocaleString(),
    'User Agent': navigator.userAgent.slice(0, 50) + '...',
    'URL': window.location.href
  };

  return (
    <div className={styles.errorContainer} data-testid="error-boundary-fallback">
      <div className={`${styles.errorCard} ${errorTypeClass}`}>
        <div className={styles.errorHeader}>
          <div className={styles.errorIcon}>
            {errorType === 'network' ? '🌐' : errorType === 'critical' ? '💥' : '⚠️'}
          </div>
          <div>
            <h2 className={styles.errorTitle}>
              {errorType === 'network' ? 'Network Error' : 
               errorType === 'critical' ? 'Critical Error' : 
               'Something went wrong'}
            </h2>
            <p className={styles.errorSubtitle}>
              {moduleName ? `${moduleName} module encountered an error` : 'An unexpected error occurred'}
            </p>
          </div>
        </div>

        <div className={styles.errorMessage}>
          {error.message}
        </div>

        {process.env.NODE_ENV === 'development' && errorInfo?.componentStack && (
          <div className={styles.errorStack}>
            {errorInfo.componentStack}
          </div>
        )}

        <div className={styles.errorDetails}>
          <h3 className={styles.errorDetailsTitle}>Error Details</h3>
          <ul className={styles.errorDetailsList}>
            {Object.entries(errorDetails).map(([label, value]) => (
              <li key={label} className={styles.errorDetailsItem}>
                <span className={styles.errorDetailsLabel}>{label}:</span>
                <span className={styles.errorDetailsValue}>{value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.errorActions}>
          <button
            className={`${styles.errorButton} ${styles.primary}`}
            onClick={resetError}
            type="button"
          >
            🔄 Try Again
          </button>
          <button
            className={styles.errorButton}
            onClick={() => window.location.reload()}
            type="button"
          >
            🔄 Reload Page
          </button>
          <button
            className={styles.errorButton}
            onClick={() => window.history.back()}
            type="button"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// Global type declarations
declare global {
  interface Window {
    errorTracker?: {
      captureException: (error: Error, context?: any) => void;
    };
    PerformanceMonitor?: {
      recordError: (moduleName: string, error: any) => void;
    };
  }
}

export default ErrorBoundary;
