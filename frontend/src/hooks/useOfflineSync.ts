/**
 * Offline Sync Hook
 * Comprehensive offline-first data management for MSO Desktop
 * 
 * Features:
 * - Real-time connectivity monitoring
 * - Automatic background synchronization
 * - Conflict resolution with user notification
 * - Offline mode indicators and state management
 * - Data persistence and recovery
 * - Performance optimization for desktop apps
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorageService } from '../services/OfflineStorageService';
import { electronBridge } from '../services/ElectronBridge';
import apiService from '../services/ApiService';
import { 
    Incident, 
    AgentPerformanceMetrics, 
    DeviceHealthStatus, 
    EnhancedIncidentSettings 
} from '../features/incident-log/types/incident-log.types';

export interface ConnectivityState {
    isOnline: boolean;
    lastSyncTime: Date | null;
    syncInProgress: boolean;
    hasUnsyncedChanges: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
    syncErrors: string[];
}

export interface OfflineSyncState {
    connectivity: ConnectivityState;
    cache: {
        incidents: number;
        agents: number;
        devices: number;
        queueSize: number;
    };
    status: 'online' | 'offline' | 'syncing' | 'conflict' | 'error';
}

interface UseOfflineSyncOptions {
    autoSync?: boolean;
    syncInterval?: number; // milliseconds
    propertyId?: string;
    onSyncComplete?: (result: { success: boolean; errors: string[] }) => void;
    onConflictDetected?: (conflicts: any[]) => void;
    onStatusChange?: (status: OfflineSyncState['status']) => void;
}

export const useOfflineSync = (options: UseOfflineSyncOptions = {}) => {
    const {
        autoSync = true,
        syncInterval = 30000, // 30 seconds
        propertyId,
        onSyncComplete,
        onConflictDetected,
        onStatusChange
    } = options;

    // State management
    const [state, setState] = useState<OfflineSyncState>({
        connectivity: {
            isOnline: navigator.onLine,
            lastSyncTime: null,
            syncInProgress: false,
            hasUnsyncedChanges: false,
            connectionQuality: navigator.onLine ? 'good' : 'disconnected',
            syncErrors: []
        },
        cache: {
            incidents: 0,
            agents: 0,
            devices: 0,
            queueSize: 0
        },
        status: navigator.onLine ? 'online' : 'offline'
    });

    // Refs for stable references
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncAttemptRef = useRef<number>(0);
    const connectivityCheckRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Initialize offline storage and connectivity monitoring
     */
    useEffect(() => {
        const initialize = async () => {
            try {
                // Initialize IndexedDB
                await offlineStorageService.initialize();
                console.info('Offline storage initialized');

                // Load initial cache status
                await updateCacheStatus();

                // Set up connectivity monitoring
                setupConnectivityMonitoring();

                // Start auto-sync if enabled
                if (autoSync && navigator.onLine) {
                    startAutoSync();
                }

                // Enable system tray for desktop
                if (electronBridge.isElectron()) {
                    await electronBridge.setSystemTray(true, 'Proper MSO - Incident Management');
                }

            } catch (error) {
                console.error('Failed to initialize offline sync:', error);
                setState(prev => ({
                    ...prev,
                    status: 'error',
                    connectivity: {
                        ...prev.connectivity,
                        syncErrors: [...prev.connectivity.syncErrors, `Initialization failed: ${error}`]
                    }
                }));
            }
        };

        initialize();

        // Cleanup on unmount
        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
            if (connectivityCheckRef.current) {
                clearInterval(connectivityCheckRef.current);
            }
        };
    }, [autoSync, syncInterval]);

    /**
     * Set up connectivity monitoring
     */
    const setupConnectivityMonitoring = useCallback(() => {
        const handleOnline = async () => {
            console.info('Connection restored - starting sync');
            
            setState(prev => ({
                ...prev,
                connectivity: {
                    ...prev.connectivity,
                    isOnline: true,
                    connectionQuality: 'good'
                },
                status: 'online'
            }));

            // Trigger immediate sync when coming back online
            if (autoSync) {
                await performSync();
            }

            // Resume auto-sync
            if (autoSync) {
                startAutoSync();
            }

            // Desktop notification
            if (electronBridge.isElectron()) {
                await electronBridge.showNotification({
                    title: '🌐 Connection Restored',
                    body: 'Syncing data with server...',
                    urgency: 'normal'
                });
            }
        };

        const handleOffline = () => {
            console.warn('Connection lost - switching to offline mode');
            
            setState(prev => ({
                ...prev,
                connectivity: {
                    ...prev.connectivity,
                    isOnline: false,
                    connectionQuality: 'disconnected',
                    syncInProgress: false
                },
                status: 'offline'
            }));

            // Stop auto-sync
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }

            // Desktop notification
            if (electronBridge.isElectron()) {
                electronBridge.showNotification({
                    title: '📡 Connection Lost',
                    body: 'Working offline - changes will sync when connection returns',
                    urgency: 'normal'
                });
            }
        };

        // Browser events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic connectivity check (more reliable than browser events)
        connectivityCheckRef.current = setInterval(checkConnectivity, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (connectivityCheckRef.current) {
                clearInterval(connectivityCheckRef.current);
            }
        };
    }, [autoSync]);

    /**
     * Check connectivity by attempting to reach the server
     */
    const checkConnectivity = useCallback(async () => {
        try {
            const startTime = Date.now();
            const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/health`, {
                method: 'GET',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const quality = responseTime < 1000 ? 'excellent' : 
                               responseTime < 3000 ? 'good' : 'poor';
                
                setState(prev => ({
                    ...prev,
                    connectivity: {
                        ...prev.connectivity,
                        isOnline: true,
                        connectionQuality: quality
                    },
                    status: prev.status === 'offline' ? 'online' : prev.status
                }));
            } else {
                throw new Error('Server unreachable');
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                connectivity: {
                    ...prev.connectivity,
                    isOnline: false,
                    connectionQuality: 'disconnected'
                },
                status: 'offline'
            }));
        }
    }, []);

    /**
     * Start automatic synchronization
     */
    const startAutoSync = useCallback(() => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }

        syncIntervalRef.current = setInterval(async () => {
            if (navigator.onLine && state.connectivity.isOnline) {
                await performSync();
            }
        }, syncInterval);
    }, [syncInterval, state.connectivity.isOnline]);

    /**
     * Perform synchronization with server
     */
    const performSync = useCallback(async (force = false) => {
        // Throttle sync attempts
        const now = Date.now();
        if (!force && now - lastSyncAttemptRef.current < 5000) {
            console.log('Sync throttled - too frequent attempts');
            return;
        }
        lastSyncAttemptRef.current = now;

        setState(prev => ({
            ...prev,
            connectivity: { ...prev.connectivity, syncInProgress: true },
            status: 'syncing'
        }));

        try {
            // Perform the sync
            const result = await offlineStorageService.syncWithServer(apiService);
            
            setState(prev => ({
                ...prev,
                connectivity: {
                    ...prev.connectivity,
                    syncInProgress: false,
                    lastSyncTime: new Date(),
                    hasUnsyncedChanges: result.errors.length > 0,
                    syncErrors: result.errors
                },
                status: result.success ? 'online' : (result.errors.length > 0 ? 'error' : 'conflict')
            }));

            // Update cache status
            await updateCacheStatus();

            // Notify completion
            onSyncComplete?.(result);

            // Update system tray
            if (electronBridge.isElectron()) {
                const cacheStatus = await offlineStorageService.getCacheStatus();
                await electronBridge.updateTrayWithIncidentCount(
                    cacheStatus.incidents_count,
                    0 // Critical count would need to be calculated
                );
            }

            console.info('Sync completed:', result);

        } catch (error) {
            console.error('Sync failed:', error);
            
            setState(prev => ({
                ...prev,
                connectivity: {
                    ...prev.connectivity,
                    syncInProgress: false,
                    syncErrors: [...prev.connectivity.syncErrors, `Sync failed: ${error}`]
                },
                status: 'error'
            }));
        }
    }, [onSyncComplete]);

    /**
     * Update cache status information
     */
    const updateCacheStatus = useCallback(async () => {
        try {
            const cacheStatus = await offlineStorageService.getCacheStatus();
            
            setState(prev => ({
                ...prev,
                cache: {
                    incidents: cacheStatus.incidents_count,
                    agents: cacheStatus.agents_count,
                    devices: cacheStatus.devices_count,
                    queueSize: cacheStatus.sync_queue_size
                },
                connectivity: {
                    ...prev.connectivity,
                    hasUnsyncedChanges: cacheStatus.sync_queue_size > 0
                }
            }));
        } catch (error) {
            console.error('Failed to update cache status:', error);
        }
    }, []);

    /**
     * Store data with offline support
     */
    const storeData = useCallback(async (
        type: 'incidents' | 'agent_performance' | 'hardware_devices' | 'settings',
        data: any,
        options?: { propertyId?: string }
    ) => {
        try {
            switch (type) {
                case 'incidents':
                    await offlineStorageService.storeIncidents(data, options?.propertyId);
                    break;
                case 'agent_performance':
                    await offlineStorageService.storeAgentPerformance(data);
                    break;
                case 'hardware_devices':
                    await offlineStorageService.storeHardwareDevices(data);
                    break;
                case 'settings':
                    if (options?.propertyId) {
                        await offlineStorageService.storeSettings(data, options.propertyId);
                    }
                    break;
            }

            await updateCacheStatus();
            console.info(`${type} stored offline successfully`);

        } catch (error) {
            console.error(`Failed to store ${type} offline:`, error);
            throw error;
        }
    }, [updateCacheStatus]);

    /**
     * Retrieve data with offline fallback
     */
    const retrieveData = useCallback(async (
        type: 'incidents' | 'agent_performance' | 'hardware_devices' | 'settings',
        options?: { propertyId?: string }
    ): Promise<any> => {
        try {
            switch (type) {
                case 'incidents':
                    return await offlineStorageService.getIncidents(options?.propertyId);
                case 'agent_performance':
                    return await offlineStorageService.getAgentPerformance();
                case 'hardware_devices':
                    return await offlineStorageService.getHardwareDevices();
                case 'settings':
                    if (options?.propertyId) {
                        return await offlineStorageService.getSettings(options.propertyId);
                    }
                    return null;
            }
        } catch (error) {
            console.error(`Failed to retrieve ${type} from offline storage:`, error);
            return type === 'incidents' || type === 'agent_performance' || type === 'hardware_devices' ? [] : null;
        }
    }, []);

    /**
     * Force immediate sync
     */
    const forceSync = useCallback(async () => {
        await performSync(true);
    }, [performSync]);

    /**
     * Clear offline data
     */
    const clearOfflineData = useCallback(async () => {
        try {
            await offlineStorageService.clearAllData();
            await updateCacheStatus();
            console.info('Offline data cleared');
        } catch (error) {
            console.error('Failed to clear offline data:', error);
        }
    }, [updateCacheStatus]);

    // Notify status changes
    useEffect(() => {
        onStatusChange?.(state.status);
    }, [state.status, onStatusChange]);

    return {
        // State
        state,
        
        // Data operations
        storeData,
        retrieveData,
        
        // Sync operations
        forceSync,
        clearOfflineData,
        updateCacheStatus,
        
        // Utilities
        isOnline: state.connectivity.isOnline,
        isOffline: !state.connectivity.isOnline,
        isSyncing: state.connectivity.syncInProgress,
        hasUnsyncedChanges: state.connectivity.hasUnsyncedChanges,
        lastSyncTime: state.connectivity.lastSyncTime,
        connectionQuality: state.connectivity.connectionQuality
    };
};

export default useOfflineSync;