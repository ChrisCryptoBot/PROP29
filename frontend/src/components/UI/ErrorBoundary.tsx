/**
 * Enhanced Error Boundary Component
 * Consolidated from multiple implementations with logger integration
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { logger } from '../../services/logger';

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  moduleName?: string;
  errorType?: 'module' | 'network' | 'critical';
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps> | ReactNode;
  moduleName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  testId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error using logger service
    logger.error(
      `ErrorBoundary caught an error${this.props.moduleName ? ` in ${this.props.moduleName}` : ''}`,
      error,
      {
        module: 'ErrorBoundary',
        action: 'componentDidCatch',
        moduleName: this.props.moduleName,
        errorId: this.state.errorId,
        errorInfo: errorInfo.componentStack
      }
    );

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    // Report to external error tracking service
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
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
    if (typeof window !== 'undefined' && (window as any).PerformanceMonitor) {
      (window as any).PerformanceMonitor.recordError(this.props.moduleName || 'global', {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        errorId: this.state.errorId
      });
    }
  };

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

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

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // If fallback is a ReactNode, render it directly
      if (this.props.fallback && typeof this.props.fallback !== 'function') {
        return this.props.fallback;
      }

      // If fallback is a component, render it with props
      if (this.props.fallback && typeof this.props.fallback === 'function') {
        const FallbackComponent = this.props.fallback as React.ComponentType<ErrorFallbackProps>;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo || undefined}
            resetError={this.resetError}
            moduleName={this.props.moduleName}
            errorType={this.getErrorType(this.state.error)}
          />
        );
      }

      // Default fallback UI
      const errorType = this.getErrorType(this.state.error);
      const errorIcon = errorType === 'network' ? '🌐' : errorType === 'critical' ? '💥' : '⚠️';
      const errorTitle = errorType === 'network' ? 'Network Error' : 
                        errorType === 'critical' ? 'Critical Error' : 
                        'Something went wrong';

      return (
        <Card className="border-red-200 bg-red-50" data-testid={this.props.testId || 'error-boundary-fallback'}>
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <span className="mr-2 text-2xl">{errorIcon}</span>
              {this.props.moduleName ? `${this.props.moduleName} - ${errorTitle}` : errorTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4 font-mono text-sm">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
              <details className="mb-4">
                <summary className="text-red-600 text-sm cursor-pointer mb-2">Stack Trace (Development)</summary>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 text-red-800">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={this.resetError}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <i className="fas fa-sync mr-2"></i>
                Reload Page
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

