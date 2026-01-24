/**
 * Package State Hook
 * Centralized state management for Package feature
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
    Package,
    PackageCreate,
    PackageUpdate,
    PackageFilters,
    PackageStatus
} from '../types/package.types';
import { PackageStatus as StatusEnum } from '../types/package.types';
import packageService from '../services/PackageService';

export interface UsePackageStateReturn {
    // Data
    packages: Package[];
    selectedPackage: Package | null;

    // Loading states
    loading: {
        packages: boolean;
        package: boolean;
    };

    // Actions - CRUD Operations
    refreshPackages: (filters?: PackageFilters) => Promise<void>;
    getPackage: (packageId: string) => Promise<Package | null>;
    createPackage: (pkg: PackageCreate) => Promise<Package | null>;
    updatePackage: (packageId: string, updates: PackageUpdate) => Promise<Package | null>;
    deletePackage: (packageId: string) => Promise<boolean>;

    // Actions - Package Management
    notifyGuest: (packageId: string, guestId?: string) => Promise<boolean>;
    deliverPackage: (packageId: string, deliveredTo?: string) => Promise<boolean>;
    pickupPackage: (packageId: string) => Promise<boolean>;

    // Actions - Selection
    setSelectedPackage: (pkg: Package | null) => void;

    // Actions - Bulk Operations
    bulkDelete: (packageIds: string[]) => Promise<boolean>;
    bulkStatusChange: (packageIds: string[], status: PackageStatus) => Promise<boolean>;
}

export function usePackageState(): UsePackageStateReturn {
    const { user: currentUser } = useAuth();

    // State
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

    // Loading states
    const [loading, setLoading] = useState({
        packages: false,
        package: false,
    });

    // Fetch Packages
    const refreshPackages = useCallback(async (filters?: PackageFilters) => {
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            const response = await packageService.getPackages({
                ...filters,
                property_id: filters?.property_id
            });

            if (response.data) {
                setPackages(response.data);
            }
        } catch (error) {
            logger.error('Failed to fetch packages', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'refreshPackages'
            });
            showError('Failed to load packages');
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, []);

    // Get Single Package
    const getPackage = useCallback(async (packageId: string): Promise<Package | null> => {
        setLoading(prev => ({ ...prev, package: true }));
        try {
            const response = await packageService.getPackage(packageId);
            if (response.data) {
                setSelectedPackage(response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            logger.error('Failed to fetch package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'getPackage'
            });
            showError('Failed to load package');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, package: false }));
        }
    }, []);

    // Create Package
    const createPackage = useCallback(async (pkg: PackageCreate): Promise<Package | null> => {
        const toastId = showLoading('Creating package...');
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            const response = await packageService.createPackage(pkg);
            if (response.data) {
                const newPackage = response.data;
                setPackages(prev => [newPackage, ...prev]);
                dismissLoadingAndShowSuccess(toastId, 'Package created successfully');
                return newPackage;
            }
            dismissLoadingAndShowError(toastId, 'Failed to create package');
            return null;
        } catch (error) {
            logger.error('Failed to create package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'createPackage'
            });
            dismissLoadingAndShowError(toastId, 'Failed to create package');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, []);

    // Update Package
    const updatePackage = useCallback(async (packageId: string, updates: PackageUpdate): Promise<Package | null> => {
        const toastId = showLoading('Updating package...');
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            const response = await packageService.updatePackage(packageId, updates);
            if (response.data) {
                const updatedPackage = response.data;
                setPackages(prev => prev.map(pkg => pkg.package_id === packageId ? updatedPackage : pkg));
                if (selectedPackage?.package_id === packageId) {
                    setSelectedPackage(updatedPackage);
                }
                dismissLoadingAndShowSuccess(toastId, 'Package updated successfully');
                return updatedPackage;
            }
            dismissLoadingAndShowError(toastId, 'Failed to update package');
            return null;
        } catch (error) {
            logger.error('Failed to update package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'updatePackage'
            });
            dismissLoadingAndShowError(toastId, 'Failed to update package');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, [selectedPackage]);

    // Delete Package
    const deletePackage = useCallback(async (packageId: string): Promise<boolean> => {
        if (!window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
            return false;
        }

        const toastId = showLoading('Deleting package...');
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            await packageService.deletePackage(packageId);
            setPackages(prev => prev.filter(pkg => pkg.package_id !== packageId));
            if (selectedPackage?.package_id === packageId) {
                setSelectedPackage(null);
            }
            dismissLoadingAndShowSuccess(toastId, 'Package deleted successfully');
            return true;
        } catch (error) {
            logger.error('Failed to delete package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'deletePackage'
            });
            dismissLoadingAndShowError(toastId, 'Failed to delete package');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, [selectedPackage]);

    // Notify Guest
    const notifyGuest = useCallback(async (packageId: string, guestId?: string): Promise<boolean> => {
        const toastId = showLoading('Notifying guest...');
        try {
            const response = await packageService.notifyGuest(packageId, guestId);
            if (response.data?.notified) {
                // Refresh the package to get updated status
                const updatedPackage = await getPackage(packageId);
                if (updatedPackage) {
                    setPackages(prev => prev.map(pkg => pkg.package_id === packageId ? updatedPackage : pkg));
                }
                dismissLoadingAndShowSuccess(toastId, 'Guest notified successfully');
                return true;
            }
            dismissLoadingAndShowError(toastId, 'Failed to notify guest');
            return false;
        } catch (error) {
            logger.error('Failed to notify guest', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'notifyGuest'
            });
            dismissLoadingAndShowError(toastId, 'Failed to notify guest');
            return false;
        }
    }, [getPackage]);

    // Deliver Package
    const deliverPackage = useCallback(async (packageId: string, deliveredTo?: string): Promise<boolean> => {
        const toastId = showLoading('Delivering package...');
        try {
            const response = await packageService.deliverPackage(packageId, deliveredTo);
            if (response.data) {
                const deliveredPackage = response.data;
                setPackages(prev => prev.map(pkg => pkg.package_id === packageId ? deliveredPackage : pkg));
                if (selectedPackage?.package_id === packageId) {
                    setSelectedPackage(deliveredPackage);
                }
                dismissLoadingAndShowSuccess(toastId, 'Package delivered successfully');
                return true;
            }
            dismissLoadingAndShowError(toastId, 'Failed to deliver package');
            return false;
        } catch (error) {
            logger.error('Failed to deliver package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'deliverPackage'
            });
            dismissLoadingAndShowError(toastId, 'Failed to deliver package');
            return false;
        }
    }, [selectedPackage]);

    // Pickup Package
    const pickupPackage = useCallback(async (packageId: string): Promise<boolean> => {
        const toastId = showLoading('Processing pickup...');
        try {
            const response = await packageService.pickupPackage(packageId);
            if (response.data) {
                const pickedUpPackage = response.data;
                setPackages(prev => prev.map(pkg => pkg.package_id === packageId ? pickedUpPackage : pkg));
                if (selectedPackage?.package_id === packageId) {
                    setSelectedPackage(pickedUpPackage);
                }
                dismissLoadingAndShowSuccess(toastId, 'Package picked up successfully');
                return true;
            }
            dismissLoadingAndShowError(toastId, 'Failed to process pickup');
            return false;
        } catch (error) {
            logger.error('Failed to pickup package', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'pickupPackage'
            });
            dismissLoadingAndShowError(toastId, 'Failed to process pickup');
            return false;
        }
    }, [selectedPackage]);

    // Bulk Delete
    const bulkDelete = useCallback(async (packageIds: string[]): Promise<boolean> => {
        if (!window.confirm(`Are you sure you want to delete ${packageIds.length} package(s)? This action cannot be undone.`)) {
            return false;
        }

        const toastId = showLoading(`Deleting ${packageIds.length} package(s)...`);
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            await Promise.all(packageIds.map(id => packageService.deletePackage(id)));
            setPackages(prev => prev.filter(pkg => !packageIds.includes(pkg.package_id)));
            if (selectedPackage && packageIds.includes(selectedPackage.package_id)) {
                setSelectedPackage(null);
            }
            dismissLoadingAndShowSuccess(toastId, `${packageIds.length} package(s) deleted successfully`);
            return true;
        } catch (error) {
            logger.error('Failed to delete packages', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'bulkDelete'
            });
            dismissLoadingAndShowError(toastId, 'Failed to delete packages');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, [selectedPackage]);

    // Bulk Status Change
    const bulkStatusChange = useCallback(async (packageIds: string[], status: PackageStatus): Promise<boolean> => {
        const toastId = showLoading(`Updating ${packageIds.length} package(s)...`);
        setLoading(prev => ({ ...prev, packages: true }));
        try {
            await Promise.all(packageIds.map(id => packageService.updatePackage(id, { status })));
            // Refresh packages to get updated data
            await refreshPackages();
            dismissLoadingAndShowSuccess(toastId, `${packageIds.length} package(s) updated successfully`);
            return true;
        } catch (error) {
            logger.error('Failed to update packages', error instanceof Error ? error : new Error(String(error)), {
                module: 'Package',
                action: 'bulkStatusChange'
            });
            dismissLoadingAndShowError(toastId, 'Failed to update packages');
            return false;
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    }, [refreshPackages]);

    // Initial load
    useEffect(() => {
        refreshPackages();
    }, [refreshPackages]);

    return {
        packages,
        selectedPackage,
        loading,
        refreshPackages,
        getPackage,
        createPackage,
        updatePackage,
        deletePackage,
        notifyGuest,
        deliverPackage,
        pickupPackage,
        setSelectedPackage,
        bulkDelete,
        bulkStatusChange,
    };
}
