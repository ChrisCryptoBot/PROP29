/**
 * Offline Storage Service
 * IndexedDB integration for MSO Desktop Application
 * Provides offline-first data persistence with synchronization
 * 
 * Features:
 * - Incident data offline storage
 * - Agent performance metrics caching
 * - Hardware device status persistence
 * - Conflict resolution for concurrent edits
 * - Background sync when connectivity returns
 */

import { Incident, AgentPerformanceMetrics, DeviceHealthStatus, EnhancedIncidentSettings } from '../features/incident-log/types/incident-log.types';

interface SyncQueueItem {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'incident' | 'agent_performance' | 'device_health' | 'settings';
    data: any;
    timestamp: number;
    retryCount: number;
    propertyId?: string;
}

interface CacheMetadata {
    entity: string;
    lastSync: number;
    version: number;
    conflictResolutionStrategy: 'client' | 'server' | 'merge';
}

class OfflineStorageService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'ProperMSOIncidentLog';
    private readonly DB_VERSION = 1;
    private isInitialized = false;
    private syncInProgress = false;
    private syncQueue: SyncQueueItem[] = [];
    private conflictHandlers: Map<string, (clientData: any, serverData: any) => any> = new Map();

    constructor() {
        this.initializeConflictHandlers();
    }

    /**
     * Initialize IndexedDB and create object stores
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('Failed to initialize IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.info('OfflineStorageService initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Incidents store
                if (!db.objectStoreNames.contains('incidents')) {
                    const incidentStore = db.createObjectStore('incidents', { keyPath: 'incident_id' });
                    incidentStore.createIndex('property_id', 'property_id', { unique: false });
                    incidentStore.createIndex('status', 'status', { unique: false });
                    incidentStore.createIndex('created_at', 'created_at', { unique: false });
                    incidentStore.createIndex('source', 'source', { unique: false });
                    incidentStore.createIndex('source_agent_id', 'source_agent_id', { unique: false });
                }

                // Agent Performance store
                if (!db.objectStoreNames.contains('agent_performance')) {
                    const agentStore = db.createObjectStore('agent_performance', { keyPath: 'agent_id' });
                    agentStore.createIndex('trust_score', 'trust_score', { unique: false });
                    agentStore.createIndex('last_submission', 'last_submission', { unique: false });
                }

                // Hardware Devices store
                if (!db.objectStoreNames.contains('hardware_devices')) {
                    const deviceStore = db.createObjectStore('hardware_devices', { keyPath: 'device_id' });
                    deviceStore.createIndex('device_type', 'device_type', { unique: false });
                    deviceStore.createIndex('status', 'status', { unique: false });
                    deviceStore.createIndex('health_score', 'health_score', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'property_id' });
                }

                // Sync Queue store
                if (!db.objectStoreNames.contains('sync_queue')) {
                    const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('entity', 'entity', { unique: false });
                }

                // Cache Metadata store
                if (!db.objectStoreNames.contains('cache_metadata')) {
                    const metadataStore = db.createObjectStore('cache_metadata', { keyPath: 'entity' });
                }

                console.info('IndexedDB schema created/upgraded successfully');
            };
        });
    }

    /**
     * Initialize conflict resolution handlers
     */
    private initializeConflictHandlers(): void {
        // Incident conflict handler - prefer server data but merge user notes
        this.conflictHandlers.set('incident', (client: Incident, server: Incident) => {
            const serverMetadata = server.source_metadata || {};
            const clientMetadata = client.source_metadata || {};
            
            // Build merged metadata object
            const mergedMetadata: any = { ...serverMetadata };
            if (clientMetadata.user_notes) {
                mergedMetadata.user_notes = clientMetadata.user_notes;
            }
            
            return {
                ...server, // Use server data as base
                // Preserve client-side notes if they exist
                source_metadata: mergedMetadata
            };
        });

        // Agent performance - use server data (more authoritative)
        this.conflictHandlers.set('agent_performance', (client: AgentPerformanceMetrics, server: AgentPerformanceMetrics) => {
            return server;
        });

        // Device health - use server data (real-time status)
        this.conflictHandlers.set('device_health', (client: DeviceHealthStatus, server: DeviceHealthStatus) => {
            return server;
        });

        // Settings - merge with server preference but preserve user preferences
        this.conflictHandlers.set('settings', (client: EnhancedIncidentSettings, server: EnhancedIncidentSettings) => {
            return {
                ...server,
                // Preserve client notification preferences
                notification_preferences: {
                    ...server.notification_preferences,
                    ...client.notification_preferences
                }
            };
        });
    }

    /**
     * Store incidents locally
     */
    async storeIncidents(incidents: Incident[], propertyId?: string): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['incidents', 'cache_metadata'], 'readwrite');
        const incidentStore = transaction.objectStore('incidents');
        const metadataStore = transaction.objectStore('cache_metadata');

        // Clear existing incidents for this property if specified
        if (propertyId) {
            const index = incidentStore.index('property_id');
            const range = IDBKeyRange.only(propertyId);
            await this.clearByIndex(incidentStore, index, range);
        }

        // Store new incidents
        for (const incident of incidents) {
            await this.putAsync(incidentStore, { ...incident, _cached_at: Date.now() });
        }

        // Update metadata
        await this.putAsync(metadataStore, {
            entity: `incidents_${propertyId || 'all'}`,
            lastSync: Date.now(),
            version: 1,
            conflictResolutionStrategy: 'server' as const
        });

        console.info(`Stored ${incidents.length} incidents offline for property ${propertyId || 'all'}`);
    }

    /**
     * Retrieve incidents from local storage
     */
    async getIncidents(propertyId?: string): Promise<Incident[]> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['incidents'], 'readonly');
        const store = transaction.objectStore('incidents');

        if (propertyId) {
            const index = store.index('property_id');
            const range = IDBKeyRange.only(propertyId);
            return this.getAllByIndex(index, range);
        } else {
            return this.getAllAsync(store);
        }
    }

    /**
     * Store single incident (for create/update operations)
     */
    async storeIncident(incident: Incident, operation: 'create' | 'update' = 'update'): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['incidents', 'sync_queue'], 'readwrite');
        const incidentStore = transaction.objectStore('incidents');
        const syncStore = transaction.objectStore('sync_queue');

        // Store incident locally
        await this.putAsync(incidentStore, { ...incident, _cached_at: Date.now() });

        // Add to sync queue for server update
        const syncItem: SyncQueueItem = {
            id: `${operation}_incident_${incident.incident_id}_${Date.now()}`,
            type: operation,
            entity: 'incident',
            data: incident,
            timestamp: Date.now(),
            retryCount: 0,
            propertyId: incident.property_id
        };

        await this.putAsync(syncStore, syncItem);
        this.syncQueue.push(syncItem);

        console.info(`Incident ${incident.incident_id} stored offline and queued for sync`);
    }

    /**
     * Delete incident locally
     */
    async deleteIncident(incidentId: string, propertyId?: string): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['incidents', 'sync_queue'], 'readwrite');
        const incidentStore = transaction.objectStore('incidents');
        const syncStore = transaction.objectStore('sync_queue');

        // Remove from local storage
        await this.deleteAsync(incidentStore, incidentId);

        // Add to sync queue for server deletion
        const syncItem: SyncQueueItem = {
            id: `delete_incident_${incidentId}_${Date.now()}`,
            type: 'delete',
            entity: 'incident',
            data: { incident_id: incidentId },
            timestamp: Date.now(),
            retryCount: 0,
            propertyId
        };

        await this.putAsync(syncStore, syncItem);
        this.syncQueue.push(syncItem);

        console.info(`Incident ${incidentId} deleted offline and queued for sync`);
    }

    /**
     * Store agent performance metrics
     */
    async storeAgentPerformance(metrics: AgentPerformanceMetrics[]): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['agent_performance', 'cache_metadata'], 'readwrite');
        const store = transaction.objectStore('agent_performance');
        const metadataStore = transaction.objectStore('cache_metadata');

        for (const metric of metrics) {
            await this.putAsync(store, { ...metric, _cached_at: Date.now() });
        }

        await this.putAsync(metadataStore, {
            entity: 'agent_performance',
            lastSync: Date.now(),
            version: 1,
            conflictResolutionStrategy: 'server' as const
        });

        console.info(`Stored ${metrics.length} agent performance metrics offline`);
    }

    /**
     * Retrieve agent performance metrics
     */
    async getAgentPerformance(): Promise<AgentPerformanceMetrics[]> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['agent_performance'], 'readonly');
        const store = transaction.objectStore('agent_performance');

        return this.getAllAsync(store);
    }

    /**
     * Store hardware device health
     */
    async storeHardwareDevices(devices: DeviceHealthStatus[]): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['hardware_devices', 'cache_metadata'], 'readwrite');
        const store = transaction.objectStore('hardware_devices');
        const metadataStore = transaction.objectStore('cache_metadata');

        for (const device of devices) {
            await this.putAsync(store, { ...device, _cached_at: Date.now() });
        }

        await this.putAsync(metadataStore, {
            entity: 'hardware_devices',
            lastSync: Date.now(),
            version: 1,
            conflictResolutionStrategy: 'server' as const
        });

        console.info(`Stored ${devices.length} hardware devices offline`);
    }

    /**
     * Retrieve hardware devices
     */
    async getHardwareDevices(): Promise<DeviceHealthStatus[]> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['hardware_devices'], 'readonly');
        const store = transaction.objectStore('hardware_devices');

        return this.getAllAsync(store);
    }

    /**
     * Store enhanced settings
     */
    async storeSettings(settings: EnhancedIncidentSettings, propertyId: string): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['settings', 'cache_metadata'], 'readwrite');
        const store = transaction.objectStore('settings');
        const metadataStore = transaction.objectStore('cache_metadata');

        await this.putAsync(store, {
            property_id: propertyId,
            settings,
            _cached_at: Date.now()
        });

        await this.putAsync(metadataStore, {
            entity: `settings_${propertyId}`,
            lastSync: Date.now(),
            version: 1,
            conflictResolutionStrategy: 'merge' as const
        });

        console.info(`Settings stored offline for property ${propertyId}`);
    }

    /**
     * Retrieve settings
     */
    async getSettings(propertyId: string): Promise<EnhancedIncidentSettings | null> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        const result = await this.getAsync(store, propertyId);
        return result ? result.settings : null;
    }

    /**
     * Sync offline data with server
     */
    async syncWithServer(apiService: any): Promise<{ success: boolean; errors: string[] }> {
        if (this.syncInProgress) {
            console.warn('Sync already in progress, skipping...');
            return { success: false, errors: ['Sync already in progress'] };
        }

        this.syncInProgress = true;
        const errors: string[] = [];

        try {
            console.info('Starting offline data sync...');

            // Load sync queue
            await this.loadSyncQueue();

            // Process sync queue
            const processedItems: string[] = [];
            for (const item of this.syncQueue) {
                try {
                    await this.processSyncItem(item, apiService);
                    processedItems.push(item.id);
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                    errors.push(`${item.entity} ${item.type}: ${error}`);

                    // Increment retry count
                    item.retryCount++;
                    if (item.retryCount >= 3) {
                        processedItems.push(item.id); // Remove after 3 failed attempts
                        errors.push(`${item.entity} ${item.type}: Max retries exceeded, removing from queue`);
                    }
                }
            }

            // Remove processed items from queue
            await this.removeSyncItems(processedItems);

            console.info(`Sync completed. Processed ${processedItems.length} items with ${errors.length} errors.`);
            return { success: errors.length === 0, errors };

        } catch (error) {
            console.error('Sync failed:', error);
            errors.push(`Sync failed: ${error}`);
            return { success: false, errors };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Load sync queue from IndexedDB
     */
    private async loadSyncQueue(): Promise<void> {
        if (!this.db) await this.initialize();

        const transaction = this.db!.transaction(['sync_queue'], 'readonly');
        const store = transaction.objectStore('sync_queue');
        
        this.syncQueue = await this.getAllAsync(store);
    }

    /**
     * Process individual sync queue item
     */
    private async processSyncItem(item: SyncQueueItem, apiService: any): Promise<void> {
        switch (item.entity) {
            case 'incident':
                if (item.type === 'create') {
                    await apiService.post('/incidents', item.data);
                } else if (item.type === 'update') {
                    await apiService.put(`/incidents/${item.data.incident_id}`, item.data);
                } else if (item.type === 'delete') {
                    await apiService.delete(`/incidents/${item.data.incident_id}`);
                }
                break;

            case 'agent_performance':
                // Agent performance is typically read-only from client
                console.warn('Agent performance sync not implemented - server-side updates only');
                break;

            case 'device_health':
                // Device health is typically read-only from client
                console.warn('Device health sync not implemented - server-side updates only');
                break;

            case 'settings':
                if (item.propertyId) {
                    await apiService.put(`/incidents/settings/enhanced?property_id=${item.propertyId}`, item.data);
                }
                break;

            default:
                throw new Error(`Unknown sync entity: ${item.entity}`);
        }
    }

    /**
     * Remove processed sync items
     */
    private async removeSyncItems(itemIds: string[]): Promise<void> {
        if (!this.db || itemIds.length === 0) return;

        const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
        const store = transaction.objectStore('sync_queue');

        for (const id of itemIds) {
            await this.deleteAsync(store, id);
        }

        // Update in-memory queue
        this.syncQueue = this.syncQueue.filter(item => !itemIds.includes(item.id));
    }

    /**
     * Get sync queue size
     */
    async getQueueSize(): Promise<number> {
        await this.loadSyncQueue();
        return this.syncQueue.length;
    }

    /**
     * Get cache status and statistics
     */
    async getCacheStatus(): Promise<{
        incidents_count: number;
        agents_count: number;
        devices_count: number;
        sync_queue_size: number;
        last_sync: string | null;
        offline_mode: boolean;
    }> {
        if (!this.db) await this.initialize();

        const [incidents, agents, devices] = await Promise.all([
            this.getIncidents(),
            this.getAgentPerformance(),
            this.getHardwareDevices()
        ]);

        await this.loadSyncQueue();

        // Get last sync time from metadata
        const transaction = this.db!.transaction(['cache_metadata'], 'readonly');
        const store = transaction.objectStore('cache_metadata');
        const metadataItems = await this.getAllAsync(store);
        
        const lastSyncTimes = metadataItems.map(item => item.lastSync).filter(Boolean);
        const lastSync = lastSyncTimes.length > 0 
            ? new Date(Math.max(...lastSyncTimes)).toISOString()
            : null;

        return {
            incidents_count: incidents.length,
            agents_count: agents.length,
            devices_count: devices.length,
            sync_queue_size: this.syncQueue.length,
            last_sync: lastSync,
            offline_mode: !navigator.onLine
        };
    }

    /**
     * Clear all cached data (for logout or reset)
     */
    async clearAllData(): Promise<void> {
        if (!this.db) return;

        const stores = ['incidents', 'agent_performance', 'hardware_devices', 'settings', 'sync_queue', 'cache_metadata'];
        const transaction = this.db!.transaction(stores, 'readwrite');

        for (const storeName of stores) {
            const store = transaction.objectStore(storeName);
            await this.clearAsync(store);
        }

        this.syncQueue = [];
        console.info('All offline data cleared');
    }

    // Utility methods for IndexedDB operations
    private putAsync(store: IDBObjectStore, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private getAsync(store: IDBObjectStore, key: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private getAllAsync(store: IDBObjectStore | IDBIndex): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    private getAllByIndex(index: IDBIndex, range?: IDBKeyRange): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const request = range ? index.getAll(range) : index.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    private deleteAsync(store: IDBObjectStore, key: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private clearAsync(store: IDBObjectStore): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private clearByIndex(store: IDBObjectStore, index: IDBIndex, range: IDBKeyRange): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = index.openKeyCursor(range);
            const keysToDelete: any[] = [];
            
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    keysToDelete.push(cursor.primaryKey);
                    cursor.continue();
                } else {
                    // Delete all collected keys
                    Promise.all(keysToDelete.map(key => this.deleteAsync(store, key)))
                        .then(() => resolve())
                        .catch(reject);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;