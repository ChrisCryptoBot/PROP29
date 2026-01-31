/**
 * Lost & Found State Hook
 * Centralized state management for Lost & Found feature
 * Contains ALL business logic following Gold Standard pattern
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import {
    showLoading,
    dismissLoadingAndShowSuccess,
    dismissLoadingAndShowError,
    showSuccess,
    showError
} from '../../../utils/toast';
import type {
    LostFoundItem,
    LostFoundItemCreate,
    LostFoundItemUpdate,
    LostFoundItemFilters,
    LostFoundClaim,
    LostFoundMetrics,
    LostFoundSettings,
    LostFoundStatus
} from '../types/lost-and-found.types';
import { LostFoundStatus as StatusEnum } from '../types/lost-and-found.types';
import lostFoundService from '../services/LostFoundService';

export interface UseLostFoundStateReturn {
    // Data
    items: LostFoundItem[];
    selectedItem: LostFoundItem | null;
    metrics: LostFoundMetrics | null;
    settings: LostFoundSettings | null;

    // Loading states
    loading: {
        items: boolean;
        item: boolean;
        metrics: boolean;
        settings: boolean;
    };

    // Actions - CRUD Operations
    refreshItems: (filters?: LostFoundItemFilters) => Promise<void>;
    getItem: (itemId: string) => Promise<LostFoundItem | null>;
    createItem: (item: LostFoundItemCreate) => Promise<LostFoundItem | null>;
    updateItem: (itemId: string, updates: LostFoundItemUpdate) => Promise<LostFoundItem | null>;
    deleteItem: (itemId: string) => Promise<boolean>;

    // Actions - Item Management
    claimItem: (itemId: string, claim: LostFoundClaim) => Promise<boolean>;
    notifyGuest: (itemId: string, guestId?: string) => Promise<boolean>;
    archiveItem: (itemId: string) => Promise<boolean>;

    // Actions - Analytics & Settings
    refreshMetrics: (propertyId?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
    refreshSettings: (propertyId?: string) => Promise<void>;
    updateSettings: (settings: Partial<LostFoundSettings>, propertyId?: string) => Promise<boolean>;

    // Actions - Reports
    exportReport: (format: 'pdf' | 'csv', filters?: LostFoundItemFilters, startDate?: string, endDate?: string) => Promise<boolean>;

    // Actions - Selection
    setSelectedItem: (item: LostFoundItem | null) => void;

    // Actions - Bulk Operations
    bulkDelete: (itemIds: string[]) => Promise<boolean>;
    bulkStatusChange: (itemIds: string[], status: LostFoundStatus) => Promise<boolean>;
}

export function useLostFoundState(): UseLostFoundStateReturn {
    const { user: currentUser } = useAuth();

    // State
    const [items, setItems] = useState<LostFoundItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
    const [metrics, setMetrics] = useState<LostFoundMetrics | null>(null);
    const [settings, setSettings] = useState<LostFoundSettings | null>(null);

    // Loading states
    const [loading, setLoading] = useState({
        items: false,
        item: false,
        metrics: false,
        settings: false,
    });

    // Fetch Items
    const refreshItems = useCallback(async (filters?: LostFoundItemFilters) => {
        setLoading(prev => ({ ...prev, items: true }));
        try {
            const response = await lostFoundService.getItems({
                ...filters,
                property_id: filters?.property_id
            });

            if (response.data) {
                setItems(response.data);
            }
        } catch (error) {
            logger.error('Failed to fetch items', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'refreshItems'
            });
            showError('Failed to load items');
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, []);

    // Get Single Item
    const getItem = useCallback(async (itemId: string): Promise<LostFoundItem | null> => {
        setLoading(prev => ({ ...prev, item: true }));
        try {
            const response = await lostFoundService.getItem(itemId);
            if (response.data) {
                setSelectedItem(response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            logger.error('Failed to fetch item', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'getItem'
            });
            showError('Failed to load item');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, item: false }));
        }
    }, []);

    // Create Item
    const createItem = useCallback(async (item: LostFoundItemCreate): Promise<LostFoundItem | null> => {
        const toastId = showLoading('Creating item...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            const response = await lostFoundService.createItem(item);
            if (response.data) {
                const newItem = response.data;
                setItems(prev => [newItem, ...prev]);
                dismissLoadingAndShowSuccess(toastId, 'Item created successfully');
                return newItem;
            }
            dismissLoadingAndShowError(toastId, 'Failed to create item');
            return null;
        } catch (error) {
            logger.error('Failed to create item', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'createItem'
            });
            dismissLoadingAndShowError(toastId, 'Failed to create item');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, []);

    // Update Item
    const updateItem = useCallback(async (itemId: string, updates: LostFoundItemUpdate): Promise<LostFoundItem | null> => {
        const toastId = showLoading('Updating item...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            const response = await lostFoundService.updateItem(itemId, updates);
            if (response.data) {
                const updatedItem = response.data;
                setItems(prev => prev.map(item => item.item_id === itemId ? updatedItem : item));
                if (selectedItem?.item_id === itemId) {
                    setSelectedItem(updatedItem);
                }
                dismissLoadingAndShowSuccess(toastId, 'Item updated successfully');
                return updatedItem;
            }
            dismissLoadingAndShowError(toastId, 'Failed to update item');
            return null;
        } catch (error) {
            logger.error('Failed to update item', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'updateItem'
            });
            dismissLoadingAndShowError(toastId, 'Failed to update item');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, [selectedItem]);

    // Delete Item
    const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
        const toastId = showLoading('Deleting item...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            await lostFoundService.deleteItem(itemId);
            setItems(prev => prev.filter(item => item.item_id !== itemId));
            if (selectedItem?.item_id === itemId) {
                setSelectedItem(null);
            }
            dismissLoadingAndShowSuccess(toastId, 'Item deleted successfully');
            return true;
        } catch (error) {
            logger.error('Failed to delete item', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'deleteItem'
            });
            dismissLoadingAndShowError(toastId, 'Failed to delete item');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, [selectedItem]);

    // Claim Item
    const claimItem = useCallback(async (itemId: string, claim: LostFoundClaim): Promise<boolean> => {
        const toastId = showLoading('Processing claim...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            const response = await lostFoundService.claimItem(itemId, claim);
            if (response.data) {
                const claimedItem = response.data;
                setItems(prev => prev.map(item => item.item_id === itemId ? claimedItem : item));
                if (selectedItem?.item_id === itemId) {
                    setSelectedItem(claimedItem);
                }
                dismissLoadingAndShowSuccess(toastId, 'Item claimed successfully');
                return true;
            }
            dismissLoadingAndShowError(toastId, 'Failed to claim item');
            return false;
        } catch (error) {
            logger.error('Failed to claim item', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'claimItem'
            });
            dismissLoadingAndShowError(toastId, 'Failed to claim item');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, [selectedItem]);

    // Notify Guest
    const notifyGuest = useCallback(async (itemId: string, guestId?: string): Promise<boolean> => {
        const toastId = showLoading('Sending notification...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            await lostFoundService.notifyGuest(itemId, guestId);
            // Refresh item to get updated notification count
            const updated = await getItem(itemId);
            if (updated) {
                setItems(prev => prev.map(item => item.item_id === itemId ? updated : item));
            }
            dismissLoadingAndShowSuccess(toastId, 'Notification sent successfully');
            return true;
        } catch (error) {
            logger.error('Failed to notify guest', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'notifyGuest'
            });
            dismissLoadingAndShowError(toastId, 'Failed to send notification');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, [getItem]);

    // Archive Item
    const archiveItem = useCallback(async (itemId: string): Promise<boolean> => {
        const result = await updateItem(itemId, { status: StatusEnum.DONATED });
        return !!result;
    }, [updateItem]);


    // Refresh Metrics
    const refreshMetrics = useCallback(async (propertyId?: string, dateFrom?: string, dateTo?: string) => {
        setLoading(prev => ({ ...prev, metrics: true }));
        try {
            const response = await lostFoundService.getMetrics(propertyId, dateFrom, dateTo);
            if (response.data) {
                setMetrics(response.data);
            }
        } catch (error) {
            logger.error('Failed to fetch metrics', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'refreshMetrics'
            });
        } finally {
            setLoading(prev => ({ ...prev, metrics: false }));
        }
    }, []);

    // Refresh Settings
    const refreshSettings = useCallback(async (propertyId?: string) => {
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            const response = await lostFoundService.getSettings(propertyId);
            if (response.data) {
                setSettings(response.data);
            }
        } catch (error) {
            logger.error('Failed to fetch settings', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'refreshSettings'
            });
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    }, []);

    // Update Settings
    const updateSettings = useCallback(async (newSettings: Partial<LostFoundSettings>, propertyId?: string): Promise<boolean> => {
        const toastId = showLoading('Updating settings...');
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            const response = await lostFoundService.updateSettings(newSettings, propertyId);
            if (response.data) {
                setSettings(response.data);
                dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
                return true;
            }
            dismissLoadingAndShowError(toastId, 'Failed to update settings');
            return false;
        } catch (error) {
            logger.error('Failed to update settings', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'updateSettings'
            });
            dismissLoadingAndShowError(toastId, 'Failed to update settings');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    }, []);

    // Export Report
    const exportReport = useCallback(async (
        format: 'pdf' | 'csv',
        filters?: LostFoundItemFilters,
        startDate?: string,
        endDate?: string
    ): Promise<boolean> => {
        const toastId = showLoading('Generating report...');
        try {
            const blob = await lostFoundService.exportReport(format, filters, startDate, endDate);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lost-found-report.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            dismissLoadingAndShowSuccess(toastId, 'Report exported successfully');
            return true;
        } catch (error) {
            logger.error('Failed to export report', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'exportReport'
            });
            dismissLoadingAndShowError(toastId, 'Failed to export report');
            return false;
        }
    }, []);

    // Bulk Delete
    const bulkDelete = useCallback(async (itemIds: string[]): Promise<boolean> => {
        const toastId = showLoading('Deleting items...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            await Promise.all(itemIds.map(id => lostFoundService.deleteItem(id)));
            setItems(prev => prev.filter(item => !itemIds.includes(item.item_id)));
            if (selectedItem && itemIds.includes(selectedItem.item_id)) {
                setSelectedItem(null);
            }
            dismissLoadingAndShowSuccess(toastId, 'Items deleted successfully');
            return true;
        } catch (error) {
            logger.error('Failed to delete items', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'bulkDelete'
            });
            dismissLoadingAndShowError(toastId, 'Failed to delete items');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, [selectedItem]);

    // Bulk Status Change
    const bulkStatusChange = useCallback(async (itemIds: string[], status: LostFoundStatus): Promise<boolean> => {
        const toastId = showLoading('Updating items...');
        setLoading(prev => ({ ...prev, items: true }));
        try {
            await Promise.all(itemIds.map(id => lostFoundService.updateItem(id, { status })));
            setItems(prev => prev.map(item =>
                itemIds.includes(item.item_id) ? { ...item, status } : item
            ));
            dismissLoadingAndShowSuccess(toastId, 'Items updated successfully');
            return true;
        } catch (error) {
            logger.error('Failed to update items', error instanceof Error ? error : new Error(String(error)), {
                module: 'LostFound',
                action: 'bulkStatusChange'
            });
            dismissLoadingAndShowError(toastId, 'Failed to update items');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, items: false }));
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshItems();
    }, [refreshItems]);

    return {
        // Data
        items,
        selectedItem,
        metrics,
        settings,

        // Loading states
        loading,

        // Actions
        refreshItems,
        getItem,
        createItem,
        updateItem,
        deleteItem,
        claimItem,
        notifyGuest,
        archiveItem,
        refreshMetrics,
        refreshSettings,
        updateSettings,
        exportReport,
        setSelectedItem,
        bulkDelete,
        bulkStatusChange,
    };
}
