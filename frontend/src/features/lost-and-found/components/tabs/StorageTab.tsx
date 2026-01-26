/**
 * Storage Management Tab
 * Displays storage locations, capacity, and item organization
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Progress } from '../../../../components/UI/Progress';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';
import { LostFoundStatus } from '../../types/lost-and-found.types';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const StorageTab: React.FC = React.memo(() => {
    const {
        items,
        loading,
        setSelectedItem,
        setShowDetailsModal,
        refreshItems
    } = useLostFoundContext();
    
    const { lastRefreshedAt } = useGlobalRefresh();
    const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

    const handleManualRefresh = useCallback(async () => {
        try {
            await refreshItems();
            setLastRefreshAt(new Date());
            setRefreshError(null);
        } catch (error) {
            setRefreshError('Refresh failed. Showing last known state.');
        }
    }, [refreshItems]);

    useEffect(() => {
        const refresh = () => {
            refreshItems()
                .then(() => {
                    setLastRefreshAt(new Date());
                    setRefreshError(null);
                })
                .catch(() => {
                    setRefreshError('Auto-refresh failed. Showing last known state.');
                });
        };
        refresh();
        const intervalId = window.setInterval(refresh, 30000);
        return () => {
            window.clearInterval(intervalId);
        };
    }, [refreshItems]);

    function formatRefreshedAgo(d: Date | null): string {
        if (!d) return '';
        const sec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (sec < 60) return 'Just now';
        if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    const storageLocations = useMemo(() => {
        // Extract unique storage locations from items
        const locations = new Set(items.map(item => item.storageLocation || 'Storage Room A - Pending'));
        return Array.from(locations).slice(0, 4); // Limit to 4 for display
    }, [items]);

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'electronics': return 'fas fa-mobile-alt';
            case 'jewelry': return 'fas fa-gem';
            case 'personal items': return 'fas fa-wallet';
            case 'accessories': return 'fas fa-sunglasses';
            case 'clothing': return 'fas fa-tshirt';
            case 'documents': return 'fas fa-file-alt';
            case 'keys': return 'fas fa-key';
            case 'sports equipment': return 'fas fa-basketball-ball';
            case 'weapons': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-box';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'found': return 'text-blue-800 bg-blue-100';
            case 'claimed': return 'text-green-800 bg-green-100';
            case 'expired': return 'text-yellow-800 bg-yellow-100';
            case 'donated': return 'text-slate-800 bg-slate-100';
            default: return 'text-slate-800 bg-slate-100';
        }
    };

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
        if (setShowDetailsModal) {
            setShowDetailsModal(true);
        }
    };

    const getItemsForLocation = (location: string) => {
        return items.filter(item => (item.storageLocation || 'Storage Room A - Pending') === location);
    };

    const getLocationDisplayName = (location: string) => {
        // Extract storage name from location string
        if (location.includes('Storage Room A')) return 'Storage A';
        if (location.includes('Storage Room B')) return 'Storage B';
        if (location.includes('Storage Room C')) return 'Storage C';
        if (location.includes('Storage Room D')) return 'Storage D';
        return location.split(' - ')[0] || location;
    };

    // Default locations if none exist
    const displayLocations = storageLocations.length > 0
        ? storageLocations
        : ['Storage Room A - Pending', 'Storage Room B - Pending', 'Storage Room C - Pending', 'Storage Room D - Pending'];

    return (
        <div className="space-y-6">
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Storage Management</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Storage locations, capacity, and item organization
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {lastRefreshAt && (
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
                            Data as of {lastRefreshAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshAt)}
                        </p>
                    )}
                    {isStale && (
                        <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            STALE
                        </span>
                    )}
                    {!isStale && lastRefreshAt && (
                        <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            LIVE
                        </span>
                    )}
                    <Button onClick={handleManualRefresh} variant="outline" disabled={loading.items} className="text-[10px] font-black uppercase tracking-widest h-10 px-6">
                        <i className={`fas fa-sync-alt mr-2 ${loading.items ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Storage Location Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {displayLocations.slice(0, 4).map((location) => {
                    const locationItems = getItemsForLocation(location);
                    const itemCount = locationItems.length;
                    const capacity = 20;
                    const percentage = Math.round((itemCount / capacity) * 100);
                    const nearExpiry = locationItems.filter(item => {
                        if (!item.expirationDate) return false;
                        const expiryTime = new Date(item.expirationDate).getTime();
                        return expiryTime - Date.now() < 7 * 24 * 60 * 60 * 1000;
                    }).length;

                    return (
                        <Card key={location} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-slate-900/70 transition-colors group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                        <i className="fas fa-warehouse text-white text-lg" />
                                    </div>
                                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-slate-300 bg-white/5 border border-white/5">
                                        {getLocationDisplayName(location)}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-1">{itemCount}</h3>
                                <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-3">Items Stored</p>
                                <Progress value={percentage} className="h-2 mb-2 bg-slate-800" indicatorClassName="bg-blue-500" />
                                <p className="text-xs text-slate-500 mb-3">{percentage}% Capacity ({itemCount}/{capacity})</p>
                                {nearExpiry > 0 && (
                                    <div className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                                        <i className="fas fa-exclamation-triangle" />
                                        <span>{nearExpiry} expiring soon</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Storage Location Details */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-white">Storage Location Details</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">Manage items by storage location</p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {displayLocations.map((location) => {
                            const locationItems = getItemsForLocation(location);

                            return (
                                <div key={location} className="border border-white/5 rounded-lg p-4 bg-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                                                <i className="fas fa-warehouse text-white text-lg" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{getLocationDisplayName(location)}</h3>
                                                <p className="text-sm text-slate-400">{locationItems.length} items</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => showSuccess(`Viewing ${getLocationDisplayName(location)}`)}
                                            className="border-white/5 text-slate-300 hover:bg-white/5 uppercase tracking-wider font-bold"
                                        >
                                            <i className="fas fa-eye mr-2" />
                                            View All
                                        </Button>
                                    </div>

                                    {locationItems.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {locationItems.slice(0, 6).map((item) => {
                                                const itemName = item.name || item.item_type || 'Unnamed Item';
                                                const category = item.category || item.item_type || 'Other';
                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer bg-slate-900/40 border border-white/5"
                                                        onClick={() => handleViewDetails(item)}
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center border border-white/5 flex-shrink-0">
                                                            <i className={cn("text-white text-sm", getCategoryIcon(category))} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{itemName}</p>
                                                            <p className="text-xs text-slate-500">{category}</p>
                                                        </div>
                                                        <span className={cn(
                                                            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border flex-shrink-0",
                                                            item.status === LostFoundStatus.FOUND ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                                                item.status === LostFoundStatus.CLAIMED ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                                                    item.status === LostFoundStatus.EXPIRED ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                                                                        "bg-slate-500/20 text-slate-300 border-slate-500/30"
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon="fas fa-box-open"
                                            title="No items in this location"
                                            description="Items stored in this location will appear here"
                                        />
                                    )}

                                    {locationItems.length > 6 && (
                                        <p className="text-sm text-slate-400 text-center mt-3 font-medium">
                                            +{locationItems.length - 6} more items
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Capacity Alerts */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Capacity Alerts</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Storage locations approaching capacity limits
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {displayLocations.map((location) => {
                            const locationItems = getItemsForLocation(location);
                            const itemCount = locationItems.length;
                            const capacity = 20;
                            const percentage = Math.round((itemCount / capacity) * 100);

                            if (percentage < 80) return null;

                            return (
                                <div key={location} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <i className="fas fa-exclamation-triangle text-amber-500" />
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {getLocationDisplayName(location)} at {percentage}% capacity
                                            </p>
                                            <p className="text-xs text-amber-400/80">{itemCount} of {capacity} spaces used</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => showSuccess('Transferring items...')}
                                        className="text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                    >
                                        Transfer Items
                                    </Button>
                                </div>
                            );
                        })}
                        {!displayLocations.some(location => {
                            const locationItems = getItemsForLocation(location);
                            return Math.round((locationItems.length / 20) * 100) >= 80;
                        }) && (
                                <p className="text-sm text-slate-400 text-center py-4">No capacity alerts at this time</p>
                            )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

StorageTab.displayName = 'StorageTab';



