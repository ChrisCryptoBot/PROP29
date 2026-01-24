/**
 * Centralized Logging Service
 * Replaces console.log statements throughout the application
 * Provides structured logging with levels, context, and production-safe behavior
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogContext {
    module?: string;
    component?: string;
    action?: string;
    userId?: string;
    [key: string]: any;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error;
    data?: any;
}

class Logger {
    private static instance: Logger;
    private isDevelopment: boolean;
    private logBuffer: LogEntry[] = [];
    private maxBufferSize = 100;

    private constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private createLogEntry(
        level: LogLevel,
        message: string,
        context?: LogContext,
        error?: Error,
        data?: any
    ): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
            data,
        };
    }

    private addToBuffer(entry: LogEntry): void {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    private formatMessage(entry: LogEntry): string {
        const { timestamp, level, message, context } = entry;
        const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';
        return `[${timestamp}] ${level}${contextStr}: ${message}`;
    }

    private shouldLog(level: LogLevel): boolean {
        if (this.isDevelopment) return true;
        // In production, only log WARN and ERROR
        return level === LogLevel.WARN || level === LogLevel.ERROR;
    }

    public debug(message: string, context?: LogContext, data?: any): void {
        const entry = this.createLogEntry(LogLevel.DEBUG, message, context, undefined, data);
        this.addToBuffer(entry);

        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage(entry), data || '');
        }
    }

    public info(message: string, context?: LogContext, data?: any): void {
        const entry = this.createLogEntry(LogLevel.INFO, message, context, undefined, data);
        this.addToBuffer(entry);

        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage(entry), data || '');
        }
    }

    public warn(message: string, context?: LogContext, data?: any): void {
        const entry = this.createLogEntry(LogLevel.WARN, message, context, undefined, data);
        this.addToBuffer(entry);

        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(entry), data || '');
        }
    }

    public error(message: string, error?: Error, context?: LogContext, data?: any): void {
        const entry = this.createLogEntry(LogLevel.ERROR, message, context, error, data);
        this.addToBuffer(entry);

        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(entry), error || '', data || '');
        }

        // In production, you might want to send errors to a monitoring service
        if (!this.isDevelopment && error) {
            this.sendToMonitoring(entry);
        }
    }

    private sendToMonitoring(entry: LogEntry): void {
        // Integrate with monitoring service (e.g., Sentry, LogRocket, DataDog)
        // Check for available monitoring services in window object
        
        try {
            // Sentry integration
            if (typeof window !== 'undefined' && (window as any).Sentry) {
                if (entry.error) {
                    (window as any).Sentry.captureException(entry.error, {
                        level: entry.level.toLowerCase(),
                        tags: {
                            module: entry.context?.module,
                            action: entry.context?.action,
                        },
                        extra: {
                            message: entry.message,
                            context: entry.context,
                            data: entry.data,
                            timestamp: entry.timestamp,
                        },
                    });
                } else {
                    (window as any).Sentry.captureMessage(entry.message, {
                        level: entry.level.toLowerCase() as 'debug' | 'info' | 'warning' | 'error',
                        tags: {
                            module: entry.context?.module,
                            action: entry.context?.action,
                        },
                        extra: {
                            context: entry.context,
                            data: entry.data,
                            timestamp: entry.timestamp,
                        },
                    });
                }
            }

            // LogRocket integration
            if (typeof window !== 'undefined' && (window as any).LogRocket) {
                if (entry.error) {
                    (window as any).LogRocket.captureException(entry.error, {
                        tags: entry.context,
                        extra: {
                            message: entry.message,
                            data: entry.data,
                            level: entry.level,
                        },
                    });
                } else {
                    (window as any).LogRocket.log(entry.message, {
                        level: entry.level,
                        ...entry.context,
                        data: entry.data,
                    });
                }
            }

            // DataDog RUM integration
            if (typeof window !== 'undefined' && (window as any).DD_RUM) {
                if (entry.error) {
                    (window as any).DD_RUM.addError(entry.error, {
                        source: 'logger',
                        message: entry.message,
                        context: entry.context,
                        data: entry.data,
                    });
                } else if (entry.level === 'ERROR' || entry.level === 'WARN') {
                    (window as any).DD_RUM.addError(new Error(entry.message), {
                        source: 'logger',
                        level: entry.level,
                        context: entry.context,
                        data: entry.data,
                    });
                }
            }

            // Custom monitoring service integration
            // Check for custom error tracking function
            if (typeof window !== 'undefined' && (window as any).errorTracker?.capture) {
                (window as any).errorTracker.capture(entry);
            }
        } catch (monitoringError) {
            // Fail silently - don't let monitoring errors break the app
            // Only log in development
            if (this.isDevelopment) {
                console.error('Monitoring service error:', monitoringError);
            }
        }
    }

    public getRecentLogs(count: number = 50): LogEntry[] {
        return this.logBuffer.slice(-count);
    }

    public clearBuffer(): void {
        this.logBuffer = [];
    }

    // Convenience methods for common logging patterns
    public apiCall(endpoint: string, method: string, context?: LogContext): void {
        this.debug(`API Call: ${method} ${endpoint}`, { ...context, action: 'api_call' });
    }

    public apiError(endpoint: string, error: Error, context?: LogContext): void {
        this.error(`API Error: ${endpoint}`, error, { ...context, action: 'api_error' });
    }

    public userAction(action: string, context?: LogContext): void {
        this.info(`User Action: ${action}`, { ...context, action: 'user_action' });
    }

    public componentMount(componentName: string): void {
        this.debug(`Component Mounted: ${componentName}`, { component: componentName });
    }

    public componentUnmount(componentName: string): void {
        this.debug(`Component Unmounted: ${componentName}`, { component: componentName });
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for easier imports
export const log = {
    debug: (message: string, context?: LogContext, data?: any) => logger.debug(message, context, data),
    info: (message: string, context?: LogContext, data?: any) => logger.info(message, context, data),
    warn: (message: string, context?: LogContext, data?: any) => logger.warn(message, context, data),
    error: (message: string, error?: Error, context?: LogContext, data?: any) => logger.error(message, error, context, data),
    apiCall: (endpoint: string, method: string, context?: LogContext) => logger.apiCall(endpoint, method, context),
    apiError: (endpoint: string, error: Error, context?: LogContext) => logger.apiError(endpoint, error, context),
    userAction: (action: string, context?: LogContext) => logger.userAction(action, context),
    componentMount: (componentName: string) => logger.componentMount(componentName),
    componentUnmount: (componentName: string) => logger.componentUnmount(componentName),
};
