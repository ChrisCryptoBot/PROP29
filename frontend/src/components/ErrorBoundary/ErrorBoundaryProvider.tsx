import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../UI/Button';
import { Card, CardContent } from '../UI/Card';
import { logger } from '../../services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

class ErrorBoundaryProvider extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error
    logger.error('Component error caught by boundary', error, {
      module: 'ErrorBoundary',
      action: 'componentDidCatch',
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to external service (in production)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, report to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error('Error reported to monitoring service:', error);
    }
  };

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    });

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Retry with exponential backoff
    const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, retryDelay);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardContent className="p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
                <i className="fas fa-exclamation-triangle text-red-400 text-3xl" />
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">
                Something went wrong
              </h1>
              
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                An unexpected error occurred in the Security Operations Center. 
                Our system has automatically logged this issue for investigation.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                  <h3 className="text-red-400 font-bold text-sm mb-2 uppercase tracking-widest">
                    Error Details (Development)
                  </h3>
                  <pre className="text-xs text-red-300 font-mono overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}

              {/* Retry Status */}
              {this.state.isRetrying && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-blue-400 font-bold text-sm">
                    Retrying... (Attempt {this.state.retryCount}/{this.maxRetries})
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Retry Button */}
                {this.state.retryCount < this.maxRetries && !this.state.isRetrying && (
                  <Button
                    variant="outline"
                    onClick={this.handleRetry}
                    className="font-black uppercase tracking-widest text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10 px-6"
                  >
                    <i className="fas fa-redo mr-2" />
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                {/* Reset Button */}
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="font-black uppercase tracking-widest text-[10px] border-white/20 text-white hover:bg-white/5 px-6"
                >
                  <i className="fas fa-sync mr-2" />
                  Reset Component
                </Button>

                {/* Reload Page Button */}
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="font-black uppercase tracking-widest text-[10px] border-amber-500/20 text-amber-400 hover:bg-amber-500/10 px-6"
                >
                  <i className="fas fa-refresh mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Support Info */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-slate-500 text-xs">
                  If this problem persists, please contact system administrators.
                  <br />
                  Error ID: <code className="font-mono text-slate-400">{Date.now().toString(36)}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryProvider;