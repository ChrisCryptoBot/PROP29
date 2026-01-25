/**
 * Electron Bridge Service
 * Desktop integration for MSO deployment
 * Provides communication between React app and Electron main process
 * 
 * Features:
 * - Desktop notifications for critical alerts
 * - System tray integration and management
 * - File system operations (exports, reports)
 * - Window management and controls
 * - Auto-updater integration
 * - System-level integration hooks
 */

import { Incident, BulkOperationResult } from '../features/incident-log/types/incident-log.types';

interface ElectronAPI {
    // IPC Communication
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
    
    // Platform info
    platform: string;
    arch: string;
    version: string;
}

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    urgency?: 'normal' | 'critical' | 'low';
    actions?: Array<{ type: string; text: string }>;
    silent?: boolean;
    timeoutType?: 'default' | 'never';
}

interface FileExportOptions {
    filename: string;
    data: any;
    format: 'json' | 'csv' | 'pdf' | 'excel';
    showSaveDialog?: boolean;
    defaultPath?: string;
}

interface WindowSettings {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maximized?: boolean;
    fullscreen?: boolean;
    alwaysOnTop?: boolean;
    focusable?: boolean;
}

class ElectronBridge {
    private electronAPI: ElectronAPI | null = null;
    private isElectronEnvironment = false;
    private notificationQueue: NotificationOptions[] = [];
    private systemTrayEnabled = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize Electron API connection
     */
    private initialize(): void {
        // Check if running in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            this.electronAPI = (window as any).electronAPI;
            this.isElectronEnvironment = true;
            console.info('ElectronBridge initialized - Desktop features available');
            
            // Set up event listeners
            this.setupEventListeners();
        } else {
            console.info('ElectronBridge initialized - Browser mode (limited features)');
        }
    }

    /**
     * Set up IPC event listeners
     */
    private setupEventListeners(): void {
        if (!this.electronAPI) return;

        // Handle notification clicks
        this.electronAPI.on('notification-click', (action: string, data: any) => {
            this.handleNotificationClick(action, data);
        });

        // Handle system tray events
        this.electronAPI.on('tray-click', () => {
            this.showMainWindow();
        });

        // Handle application lifecycle
        this.electronAPI.on('app-before-quit', () => {
            this.handleAppShutdown();
        });

        // Handle deep links (for MSO integration)
        this.electronAPI.on('deep-link', (url: string) => {
            this.handleDeepLink(url);
        });
    }

    /**
     * Check if running in Electron environment
     */
    isElectron(): boolean {
        return this.isElectronEnvironment;
    }

    /**
     * Get Electron status (for compatibility with other modules)
     */
    getElectronStatus(): { isElectron: boolean; platform?: string } {
        return {
            isElectron: this.isElectronEnvironment,
            platform: this.electronAPI?.platform
        };
    }

    /**
     * Setup application menu (stub for compatibility)
     */
    setupApplicationMenu(): void {
        if (!this.isElectronEnvironment) return;
        // This would be implemented in the Electron main process
        console.info('Application menu setup requested');
    }

    /**
     * Setup security shortcuts (stub for compatibility)
     */
    setupSecurityShortcuts(): void {
        if (!this.isElectronEnvironment) return;
        // This would be implemented in the Electron main process
        console.info('Security shortcuts setup requested');
    }

    /**
     * Event listener registration (for compatibility)
     */
    on(event: string, callback: (...args: any[]) => void): void {
        if (!this.electronAPI) return;
        this.electronAPI.on(event, callback);
    }

    /**
     * Select evidence file
     */
    async selectEvidenceFile(): Promise<string | null> {
        if (!this.isElectronEnvironment) return null;
        try {
            return await this.electronAPI!.invoke('select-evidence-file');
        } catch (error) {
            console.error('Failed to select evidence file:', error);
            return null;
        }
    }

    /**
     * Select export directory
     */
    async selectExportDirectory(): Promise<string | null> {
        if (!this.isElectronEnvironment) return null;
        try {
            return await this.electronAPI!.invoke('select-export-directory');
        } catch (error) {
            console.error('Failed to select export directory:', error);
            return null;
        }
    }

    /**
     * Get platform information
     */
    getPlatformInfo(): { platform: string; arch: string; version: string } | null {
        if (!this.electronAPI) return null;
        
        return {
            platform: this.electronAPI.platform,
            arch: this.electronAPI.arch,
            version: this.electronAPI.version
        };
    }

    /**
     * Show desktop notification
     */
    async showNotification(options: NotificationOptions): Promise<boolean> {
        // Fallback to web notifications if not in Electron
        if (!this.isElectronEnvironment) {
            return this.showWebNotification(options);
        }

        try {
            const result = await this.electronAPI!.invoke('show-notification', options);
            console.info('Desktop notification shown:', options.title);
            return result;
        } catch (error) {
            console.error('Failed to show desktop notification:', error);
            // Fallback to web notification
            return this.showWebNotification(options);
        }
    }

    /**
     * Show critical incident alert
     */
    async showCriticalIncidentAlert(incident: Incident): Promise<void> {
        const options: NotificationOptions = {
            title: '🚨 Critical Incident Alert',
            body: `${incident.title}\nLocation: ${typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}`,
            urgency: 'critical',
            actions: [
                { type: 'view', text: 'View Details' },
                { type: 'acknowledge', text: 'Acknowledge' }
            ],
            timeoutType: 'never'
        };

        await this.showNotification(options);
        
        // Also flash the taskbar/dock icon
        await this.flashWindow();
    }

    /**
     * Show bulk operation completion notification
     */
    async showBulkOperationResult(result: BulkOperationResult): Promise<void> {
        const success = result.failed === 0;
        const options: NotificationOptions = {
            title: success ? '✅ Bulk Operation Complete' : '⚠️ Bulk Operation Completed with Errors',
            body: `${result.successful} successful, ${result.failed} failed, ${result.skipped} skipped`,
            urgency: success ? 'normal' : 'critical',
            actions: [
                { type: 'view-results', text: 'View Results' }
            ]
        };

        await this.showNotification(options);
    }

    /**
     * Show agent performance alert
     */
    async showAgentPerformanceAlert(agentId: string, trustScore: number): Promise<void> {
        const options: NotificationOptions = {
            title: '📊 Agent Performance Alert',
            body: `Agent ${agentId.slice(0, 8)} trust score dropped to ${trustScore}%`,
            urgency: trustScore < 30 ? 'critical' : 'normal',
            actions: [
                { type: 'view-agent', text: 'View Agent Details' }
            ]
        };

        await this.showNotification(options);
    }

    /**
     * Export data to file
     */
    async exportToFile(options: FileExportOptions): Promise<{ success: boolean; path?: string; error?: string }> {
        if (!this.isElectronEnvironment) {
            // Fallback to browser download
            return this.downloadInBrowser(options);
        }

        try {
            const result = await this.electronAPI!.invoke('export-file', options);
            console.info('File exported successfully:', result.path);
            return result;
        } catch (error) {
            console.error('File export failed:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Export incident report
     */
    async exportIncidentReport(incidents: Incident[], format: 'json' | 'csv' | 'pdf' = 'pdf'): Promise<boolean> {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `incident-report-${timestamp}.${format}`;

        const result = await this.exportToFile({
            filename,
            data: incidents,
            format,
            showSaveDialog: true,
            defaultPath: `~/Documents/Proper-MSO/Reports/${filename}`
        });

        if (result.success) {
            await this.showNotification({
                title: '📄 Report Exported',
                body: `Incident report saved as ${filename}`,
                actions: [{ type: 'open-file', text: 'Open File' }]
            });
        }

        return result.success;
    }

    /**
     * Manage system tray
     */
    async setSystemTray(enabled: boolean, tooltip?: string): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('set-system-tray', { enabled, tooltip });
            this.systemTrayEnabled = enabled;
            console.info('System tray', enabled ? 'enabled' : 'disabled');
        } catch (error) {
            console.error('Failed to manage system tray:', error);
        }
    }

    /**
     * Update system tray with incident count
     */
    async updateTrayWithIncidentCount(count: number, criticalCount: number = 0): Promise<void> {
        if (!this.systemTrayEnabled || !this.isElectronEnvironment) return;

        const tooltip = criticalCount > 0 
            ? `Proper MSO - ${count} incidents (${criticalCount} critical)`
            : `Proper MSO - ${count} incidents`;

        try {
            await this.electronAPI!.invoke('update-tray', { 
                incidentCount: count, 
                criticalCount,
                tooltip 
            });
        } catch (error) {
            console.error('Failed to update system tray:', error);
        }
    }

    /**
     * Window management
     */
    async showMainWindow(): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('show-main-window');
        } catch (error) {
            console.error('Failed to show main window:', error);
        }
    }

    async hideMainWindow(): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('hide-main-window');
        } catch (error) {
            console.error('Failed to hide main window:', error);
        }
    }

    async setWindowSettings(settings: WindowSettings): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('set-window-settings', settings);
        } catch (error) {
            console.error('Failed to update window settings:', error);
        }
    }

    async flashWindow(): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('flash-window');
        } catch (error) {
            console.error('Failed to flash window:', error);
        }
    }

    /**
     * Application lifecycle
     */
    async checkForUpdates(): Promise<{ available: boolean; version?: string }> {
        if (!this.isElectronEnvironment) {
            return { available: false };
        }

        try {
            return await this.electronAPI!.invoke('check-for-updates');
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return { available: false };
        }
    }

    async installUpdate(): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('install-update');
        } catch (error) {
            console.error('Failed to install update:', error);
        }
    }

    async restartApp(): Promise<void> {
        if (!this.isElectronEnvironment) {
            window.location.reload();
            return;
        }

        try {
            await this.electronAPI!.invoke('restart-app');
        } catch (error) {
            console.error('Failed to restart app:', error);
        }
    }

    /**
     * System integration
     */
    async setStartupBehavior(enabled: boolean): Promise<void> {
        if (!this.isElectronEnvironment) return;

        try {
            await this.electronAPI!.invoke('set-startup', { enabled });
            console.info('App startup behavior:', enabled ? 'enabled' : 'disabled');
        } catch (error) {
            console.error('Failed to set startup behavior:', error);
        }
    }

    async getSystemInfo(): Promise<{
        platform: string;
        arch: string;
        version: string;
        memory: { total: number; free: number; used: number };
        cpu: { usage: number; cores: number };
    } | null> {
        if (!this.isElectronEnvironment) return null;

        try {
            return await this.electronAPI!.invoke('get-system-info');
        } catch (error) {
            console.error('Failed to get system info:', error);
            return null;
        }
    }

    /**
     * Event handlers
     */
    private handleNotificationClick(action: string, data: any): void {
        switch (action) {
            case 'view':
                // Navigate to incident details
                window.location.hash = `#/incident/${data.incidentId}`;
                this.showMainWindow();
                break;

            case 'acknowledge':
                // Acknowledge the alert
                console.info('Incident acknowledged via notification');
                break;

            case 'view-results':
                // Show bulk operation results
                window.location.hash = '#/review-queue';
                this.showMainWindow();
                break;

            case 'view-agent':
                // Show agent performance details
                window.location.hash = `#/agents/${data.agentId}`;
                this.showMainWindow();
                break;

            case 'open-file':
                // Open exported file
                if (this.isElectronEnvironment) {
                    this.electronAPI!.invoke('open-file', data.path);
                }
                break;

            default:
                console.warn('Unknown notification action:', action);
        }
    }

    private handleAppShutdown(): void {
        console.info('App shutdown initiated - cleaning up...');
        // Perform cleanup tasks
        // Save pending data
        // Clear temporary files
    }

    private handleDeepLink(url: string): void {
        console.info('Deep link received:', url);
        // Parse URL and navigate appropriately
        // Example: proper://incident/12345 -> navigate to incident details
        
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            if (path.startsWith('/incident/')) {
                const incidentId = path.split('/')[2];
                window.location.hash = `#/incident/${incidentId}`;
            }
            
            this.showMainWindow();
        } catch (error) {
            console.error('Invalid deep link:', url, error);
        }
    }

    /**
     * Fallback methods for browser environment
     */
    private async showWebNotification(options: NotificationOptions): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Browser notifications not supported');
            return false;
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return false;
            }
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/favicon.ico',
                silent: options.silent
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return true;
        } catch (error) {
            console.error('Failed to show web notification:', error);
            return false;
        }
    }

    private downloadInBrowser(options: FileExportOptions): { success: boolean; error?: string } {
        try {
            let content: string;
            let mimeType: string;

            switch (options.format) {
                case 'json':
                    content = JSON.stringify(options.data, null, 2);
                    mimeType = 'application/json';
                    break;

                case 'csv':
                    content = this.convertToCSV(options.data);
                    mimeType = 'text/csv';
                    break;

                default:
                    throw new Error(`Browser export not supported for format: ${options.format}`);
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = options.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    private convertToCSV(data: any[]): string {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ];

        return csvRows.join('\n');
    }
}

// Export singleton instance
export const electronBridge = new ElectronBridge();
export default electronBridge;