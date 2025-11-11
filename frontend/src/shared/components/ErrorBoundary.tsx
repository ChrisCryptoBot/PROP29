import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  moduleId?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console and potentially to error reporting service
    console.error('Module Error:', {
      moduleId: this.props.moduleId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Emit error event for monitoring
    if ((window as any).eventBus) {
      (window as any).eventBus.emit('module:error', {
        moduleId: this.props.moduleId,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {this.props.moduleId ? `${this.props.moduleId} Module Error` : 'Module Error'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Something went wrong with this module. Please try refreshing the page.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 overflow-auto">
                    <div className="font-semibold mb-1">Error:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="font-semibold mb-1">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 