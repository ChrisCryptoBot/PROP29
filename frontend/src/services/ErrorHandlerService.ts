/**
 * Centralized error handling service
 * Provides consistent error handling and logging
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandlerService {
  /**
   * Handle general errors
   */
  static handle(error: Error | unknown, context: string): string {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const fullMessage = `${context}: ${errorMessage}`;
    
    // Log error for debugging
    console.error(`[${context}]`, error);
    
    return fullMessage;
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: ApiError, defaultMessage: string): string {
    if (error.status === 404) {
      return 'Resource not found';
    }
    if (error.status === 403) {
      return 'Access denied';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later';
    }
    
    return error.message || defaultMessage;
  }

  /**
   * Log error for monitoring
   */
  static logError(error: Error | unknown, context: string): void {
    const errorInfo = {
      context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('[Error Log]', errorInfo);
    
    // In production, send to error tracking service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   errorTrackingService.captureException(error, { extra: errorInfo });
    // }
  }
}
