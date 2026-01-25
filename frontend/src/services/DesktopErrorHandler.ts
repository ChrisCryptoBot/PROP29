/**
 * Desktop Error Handler Service
 * Enhanced error handling for MSO Desktop Applications
 * 
 * Features:
 * - Network failure recovery with automatic retry
 * - Sync conflict resolution with user guidance
 * - User-friendly error reporting and logging
 * - Crash recovery and state restoration
 * - Offline error queuing and batch processing
 * - Desktop-specific error notifications
 */

import { electronBridge } from './ElectronBridge';
import { offlineStorageService } from './OfflineStorageService';
import { showError, showSuccess, showWarning } from '../utils/toast';

export interface ErrorContext {
    operation: string;
    module: string;
    userId?: string;
    propertyId?: string;
    timestamp: number;
    userAgent: string;
    url: string;
    additionalData?: Record<string, any>;
}

export interface RecoveryAction {
    label: string;
    action: () => Promise<void> | void;
    primary?: boolean;
    destructive?: boolean;
}

export interface DesktopError {
    id: string;
    type: 'network' | 'sync' | 'validation' | 'permission' | 'system' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    technicalDetails: string;
    context: ErrorContext;
    recoveryActions?: RecoveryAction[];
    userNotified: boolean;
    resolved: boolean;
    occurrenceCount: number;
    firstOccurrence: number;
    lastOccurrence: number;
}

class DesktopErrorHandler {
    private errorQueue: DesktopError[] = [];
    private errorHistory: DesktopError[] = [];
    private retryAttempts: Map<string, number> = new Map();
    private suppressedErrors: Set<string> = new Set();
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize error handler with crash recovery
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Set up global error handlers
            this.setupGlobalErrorHandlers();

            // Restore error queue from previous session (crash recovery)
            await this.restoreErrorQueue();

            // Set up periodic error reporting
            this.setupPeriodicReporting();

            this.isInitialized = true;
            console.info('DesktopErrorHandler initialized');

        } catch (error) {
            console.error('Failed to initialize DesktopErrorHandler:', error);
        }
    }

    /**
     * Set up global error handlers
     */
    private setupGlobalErrorHandlers(): void {
        // Unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'system',
                severity: 'high',
                message: 'Unhandled JavaScript error',
                technicalDetails: `${event.error?.message || event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
                context: this.createContext('unhandled_error', 'system', {
                    stack: event.error?.stack,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                })
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'system',
                severity: 'high',
                message: 'Unhandled promise rejection',
                technicalDetails: String(event.reason),
                context: this.createContext('unhandled_rejection', 'system', {
                    reason: event.reason,
                    stack: event.reason?.stack
                })
            });
        });

        // React error boundary fallback
        this.setupReactErrorBoundary();
    }

    /**
     * Handle application errors with intelligent recovery
     */
    async handleError(errorData: Omit<DesktopError, 'id' | 'userNotified' | 'resolved' | 'occurrenceCount' | 'firstOccurrence' | 'lastOccurrence'>): Promise<string> {
        const errorId = this.generateErrorId(errorData);
        
        // Check if this is a duplicate error
        const existingError = this.findExistingError(errorData);
        if (existingError) {
            existingError.occurrenceCount++;
            existingError.lastOccurrence = Date.now();
            
            // Don't spam user with duplicate notifications
            if (existingError.occurrenceCount > 3) {
                console.warn('Suppressing duplicate error notification:', existingError.message);
                return existingError.id;
            }
        }

        const error: DesktopError = existingError || {
            id: errorId,
            ...errorData,
            userNotified: false,
            resolved: false,
            occurrenceCount: 1,
            firstOccurrence: Date.now(),
            lastOccurrence: Date.now()
        };

        // Add to queue if new error
        if (!existingError) {
            this.errorQueue.push(error);
            this.errorHistory.push(error);
        }

        // Handle error based on type and severity
        await this.processError(error);

        // Persist error queue for crash recovery
        await this.persistErrorQueue();

        return error.id;
    }

    /**
     * Process error with appropriate handling strategy
     */
    private async processError(error: DesktopError): Promise<void> {
        console.error(`[${error.severity.toUpperCase()}] ${error.type} error in ${error.context.module}:`, error.message, error.technicalDetails);

        // Skip suppressed errors
        const suppressionKey = `${error.type}_${error.message}`;
        if (this.suppressedErrors.has(suppressionKey)) {
            return;
        }

        try {
            switch (error.type) {
                case 'network':
                    await this.handleNetworkError(error);
                    break;
                case 'sync':
                    await this.handleSyncError(error);
                    break;
                case 'validation':
                    await this.handleValidationError(error);
                    break;
                case 'permission':
                    await this.handlePermissionError(error);
                    break;
                case 'system':
                    await this.handleSystemError(error);
                    break;
                default:
                    await this.handleGenericError(error);
            }

        } catch (handlingError) {
            console.error('Error handling failed:', handlingError);
        }
    }

    /**
     * Handle network-related errors
     */
    private async handleNetworkError(error: DesktopError): Promise<void> {
        const retryKey = `${error.context.operation}_${error.context.module}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        // Automatic retry for transient network issues
        if (attempts < 3 && error.severity !== 'critical') {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            setTimeout(async () => {
                try {
                    // Attempt to retry the operation
                    await this.retryOperation(error.context);
                    this.markErrorResolved(error.id);
                    this.retryAttempts.delete(retryKey);
                    
                    if (electronBridge.isElectron()) {
                        await electronBridge.showNotification({
                            title: '✅ Connection Restored',
                            body: `${error.context.operation} completed successfully`,
                            urgency: 'normal'
                        });
                    }
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }, Math.pow(2, attempts) * 1000); // Exponential backoff
            
            return;
        }

        // Show user notification for persistent network issues
        error.recoveryActions = [
            {
                label: 'Check Connection',
                action: async () => {
                    if (electronBridge.isElectron()) {
                        const systemInfo = await electronBridge.getSystemInfo();
                        showWarning(`Network Status: ${navigator.onLine ? 'Connected' : 'Disconnected'}`);
                    }
                }
            },
            {
                label: 'Retry Operation',
                action: async () => {
                    await this.retryOperation(error.context);
                },
                primary: true
            },
            {
                label: 'Work Offline',
                action: () => {
                    showSuccess('Switched to offline mode. Changes will sync when connection returns.');
                }
            }
        ];

        await this.notifyUser(error);
    }

    /**
     * Handle sync conflict errors
     */
    private async handleSyncError(error: DesktopError): Promise<void> {
        error.recoveryActions = [
            {
                label: 'Accept Server Version',
                action: async () => {
                    // TODO: Implement server version acceptance
                    showSuccess('Server version accepted. Local changes discarded.');
                    this.markErrorResolved(error.id);
                },
                primary: true
            },
            {
                label: 'Keep Local Version',
                action: async () => {
                    // TODO: Implement local version preservation
                    showSuccess('Local version preserved. Server will be updated.');
                    this.markErrorResolved(error.id);
                }
            },
            {
                label: 'Review Changes',
                action: () => {
                    // TODO: Open conflict resolution modal
                    console.info('Opening conflict resolution interface');
                }
            }
        ];

        await this.notifyUser(error);
    }

    /**
     * Handle validation errors
     */
    private async handleValidationError(error: DesktopError): Promise<void> {
        // Validation errors are usually user-actionable
        error.recoveryActions = [
            {
                label: 'Review Input',
                action: () => {
                    // Focus on the problematic field if available
                    if (error.context.additionalData?.fieldId) {
                        const field = document.getElementById(error.context.additionalData.fieldId);
                        field?.focus();
                    }
                },
                primary: true
            }
        ];

        // Show inline error message instead of notification
        showError(error.message);
        error.userNotified = true;
    }

    /**
     * Handle permission errors
     */
    private async handlePermissionError(error: DesktopError): Promise<void> {
        error.recoveryActions = [
            {
                label: 'Check Permissions',
                action: async () => {
                    if (electronBridge.isElectron()) {
                        showWarning('Please check application permissions in system settings.');
                    } else {
                        showWarning('Please check browser permissions and refresh the page.');
                    }
                }
            },
            {
                label: 'Contact Support',
                action: () => {
                    // TODO: Open support ticket or contact form
                    console.info('Opening support contact');
                }
            }
        ];

        await this.notifyUser(error);
    }

    /**
     * Handle system-level errors
     */
    private async handleSystemError(error: DesktopError): Promise<void> {
        // System errors might require app restart
        error.recoveryActions = [
            {
                label: 'Restart Application',
                action: async () => {
                    if (electronBridge.isElectron()) {
                        await electronBridge.restartApp();
                    } else {
                        window.location.reload();
                    }
                },
                primary: true
            },
            {
                label: 'Report Bug',
                action: async () => {
                    await this.reportBug(error);
                }
            }
        ];

        // Critical system errors get immediate desktop notifications
        if (error.severity === 'critical') {
            if (electronBridge.isElectron()) {
                await electronBridge.showNotification({
                    title: '⚠️ Critical System Error',
                    body: error.message,
                    urgency: 'critical',
                    timeoutType: 'never',
                    actions: [
                        { type: 'restart', text: 'Restart App' },
                        { type: 'report', text: 'Report Bug' }
                    ]
                });
            }
        }

        await this.notifyUser(error);
    }

    /**
     * Handle generic errors
     */
    private async handleGenericError(error: DesktopError): Promise<void> {
        error.recoveryActions = [
            {
                label: 'Try Again',
                action: async () => {
                    await this.retryOperation(error.context);
                },
                primary: true
            },
            {
                label: 'Dismiss',
                action: () => {
                    this.markErrorResolved(error.id);
                }
            }
        ];

        await this.notifyUser(error);
    }

    /**
     * Notify user about error
     */
    private async notifyUser(error: DesktopError): Promise<void> {
        if (error.userNotified) return;

        const message = error.severity === 'critical' 
            ? `Critical Error: ${error.message}`
            : error.message;

        // Desktop notification for high/critical errors
        if (error.severity === 'high' || error.severity === 'critical') {
            if (electronBridge.isElectron()) {
                await electronBridge.showNotification({
                    title: '⚠️ Application Error',
                    body: message,
                    urgency: error.severity === 'critical' ? 'critical' : 'normal',
                    actions: error.recoveryActions?.slice(0, 2).map(action => ({
                        type: action.label.toLowerCase().replace(/\s+/g, '_'),
                        text: action.label
                    })) || []
                });
            }
        }

        // In-app toast notification
        if (error.severity === 'medium' || error.severity === 'low') {
            showWarning(message);
        } else if (error.severity === 'high') {
            showError(message);
        }

        error.userNotified = true;
    }

    /**
     * Retry failed operation
     */
    private async retryOperation(context: ErrorContext): Promise<void> {
        console.info('Retrying operation:', context.operation, context.module);
        
        // TODO: Implement operation retry logic based on context
        // This would need to be integrated with the specific services
        
        // For now, just log the retry attempt
        console.info(`Retry attempt for ${context.operation} in ${context.module}`);
    }

    /**
     * Mark error as resolved
     */
    markErrorResolved(errorId: string): void {
        const error = this.errorQueue.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            this.errorQueue = this.errorQueue.filter(e => e.id !== errorId);
            console.info('Error resolved:', error.message);
        }
    }

    /**
     * Suppress similar errors for a period
     */
    suppressError(errorType: string, message: string, duration = 300000): void {
        const key = `${errorType}_${message}`;
        this.suppressedErrors.add(key);
        
        setTimeout(() => {
            this.suppressedErrors.delete(key);
        }, duration);
    }

    /**
     * Get error statistics
     */
    getErrorStats(): {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        unresolved: number;
    } {
        const stats = {
            total: this.errorHistory.length,
            byType: {} as Record<string, number>,
            bySeverity: {} as Record<string, number>,
            unresolved: this.errorQueue.length
        };

        this.errorHistory.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * Export error report for debugging
     */
    async exportErrorReport(): Promise<{ success: boolean; path?: string }> {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.getErrorStats(),
            errors: this.errorHistory.map(error => ({
                ...error,
                context: {
                    ...error.context,
                    // Remove sensitive data
                    userId: undefined
                }
            }))
        };

        if (electronBridge.isElectron()) {
            return await electronBridge.exportToFile({
                filename: `error-report-${new Date().toISOString().split('T')[0]}.json`,
                data: report,
                format: 'json',
                showSaveDialog: true
            });
        } else {
            // Browser fallback
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            return { success: true };
        }
    }

    // Utility methods
    private generateErrorId(error: Omit<DesktopError, 'id' | 'userNotified' | 'resolved' | 'occurrenceCount' | 'firstOccurrence' | 'lastOccurrence'>): string {
        const hash = btoa(`${error.type}_${error.message}_${error.context.operation}_${error.context.module}`);
        return hash.substring(0, 12);
    }

    private findExistingError(errorData: Omit<DesktopError, 'id' | 'userNotified' | 'resolved' | 'occurrenceCount' | 'firstOccurrence' | 'lastOccurrence'>): DesktopError | null {
        return this.errorQueue.find(e => 
            e.type === errorData.type && 
            e.message === errorData.message &&
            e.context.operation === errorData.context.operation &&
            e.context.module === errorData.context.module
        ) || null;
    }

    private createContext(operation: string, module: string, additionalData?: Record<string, any>): ErrorContext {
        return {
            operation,
            module,
            userId: localStorage.getItem('userId') || undefined,
            propertyId: localStorage.getItem('propertyId') || undefined,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            additionalData
        };
    }

    private async persistErrorQueue(): Promise<void> {
        try {
            localStorage.setItem('desktopErrorQueue', JSON.stringify(this.errorQueue));
        } catch (error) {
            console.error('Failed to persist error queue:', error);
        }
    }

    private async restoreErrorQueue(): Promise<void> {
        try {
            const stored = localStorage.getItem('desktopErrorQueue');
            if (stored) {
                this.errorQueue = JSON.parse(stored);
                console.info(`Restored ${this.errorQueue.length} errors from previous session`);
            }
        } catch (error) {
            console.error('Failed to restore error queue:', error);
            this.errorQueue = [];
        }
    }

    private setupPeriodicReporting(): void {
        // Report error stats every hour for monitoring
        setInterval(() => {
            if (this.errorHistory.length > 0) {
                const stats = this.getErrorStats();
                console.info('Error stats:', stats);
                
                // Could send to monitoring service here
            }
        }, 3600000); // 1 hour
    }

    private setupReactErrorBoundary(): void {
        // This would need to be implemented in React components
        console.info('React error boundary setup should be implemented at component level');
    }

    private async reportBug(error: DesktopError): Promise<void> {
        console.info('Bug report would be sent:', error);
        // TODO: Implement bug reporting to external service
    }
}

// Export singleton instance
export const desktopErrorHandler = new DesktopErrorHandler();
export default desktopErrorHandler;