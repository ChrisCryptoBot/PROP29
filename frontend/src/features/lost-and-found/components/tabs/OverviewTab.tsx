/**
 * Overview Tab
 * Main tab for Lost & Found item management
 * Displays items grid, filters, and emergency actions
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { LostFoundStatus } from '../../types/lost-and-found.types';
import { showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';

export const OverviewTab: React.FC = React.memo(() => {
    const context = useLostFoundContext();
    const {
        items,
        loading,
        setSelectedItem,
        notifyGuest,
        claimItem,
        archiveItem,
        setShowDetailsModal,
        refreshItems
    } = context;
    const setShowRegisterModal = context.setShowRegisterModal;

    const [filter, setFilter] = useState<'all' | LostFoundStatus>('all');

    const handleRegisterNewItem = () => {
        if (setShowRegisterModal) {
            setShowRegisterModal(true);
        }
    };

    const filteredItems = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter(item => item.status === filter);
    }, [items, filter]);

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'found': return 'text-blue-800 bg-blue-100';
            case 'claimed': return 'text-green-800 bg-green-100';
            case 'expired': return 'text-yellow-800 bg-yellow-100';
            case 'donated': return 'text-slate-800 bg-slate-100';
            default: return 'text-slate-800 bg-slate-100';
        }
    };

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

    const metrics = useMemo(() => ({
        total: items.length,
        found: items.filter(i => i.status === LostFoundStatus.FOUND).length,
        claimed: items.filter(i => i.status === LostFoundStatus.CLAIMED).length,
        expired: items.filter(i => i.status === LostFoundStatus.EXPIRED).length,
    }), [items]);

    const handleNotifyGuest = async (itemId: string) => {
        await notifyGuest(itemId);
    };

    const handleClaimItem = async (itemId: string) => {
        // For now, claim without guest info - can be enhanced later
        await claimItem(itemId, {
            item_id: itemId,
            claimer_name: 'Guest',
            claimer_contact: '',
            description: 'Item claimed'
        });
    };

    const handleArchiveItem = async (itemId: string) => {
        await archiveItem(itemId);
    };

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
        if (setShowDetailsModal) {
            setShowDetailsModal(true);
        }
    };

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

    return (
        <div className="space-y-6">
            {/* Page Header - Gold Standard */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Lost & Found</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Item recovery and guest claim management
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

            {/* Key Metrics - Canonical Pattern */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-white bg-blue-500/10 border border-blue-500/20 rounded uppercase">TOTAL</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-box text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Items</p>
                            <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-white bg-blue-500/10 border border-blue-500/20 rounded uppercase">FOUND</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-search text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Found Items</p>
                            <h3 className="text-3xl font-black text-white">{metrics.found}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">CLAIMED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-check-circle text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Claimed Items</p>
                            <h3 className="text-3xl font-black text-white">{metrics.claimed}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">EXPIRED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-clock text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expired Items</p>
                            <h3 className="text-3xl font-black text-white">{metrics.expired}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Item Management */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl mb-8">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-box-open text-white text-lg" />
                        </div>
                        Item Management
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Filter and manage lost & found items
                    </p>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="flex flex-wrap gap-2 mb-8">
                        {['all', LostFoundStatus.FOUND, LostFoundStatus.CLAIMED, LostFoundStatus.EXPIRED, LostFoundStatus.DONATED].map(filterType => (
                            <Button
                                key={filterType}
                                variant={filter === filterType ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(filterType as any)}
                                className={cn(
                                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                                    filter === filterType
                                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                                        : "border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {filterType === 'all' ? 'All Items' : filterType}
                            </Button>
                        ))}
                    </div>
                    {loading.items && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading items" />
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <EmptyState
                            icon="fas fa-box-open"
                            title="No Items Found"
                            description="No lost or found items match your current filter."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                            action={setShowRegisterModal ? {
                                label: "REGISTER NEW ITEM",
                                onClick: () => {
                                    if (setShowRegisterModal) {
                                        setShowRegisterModal(true);
                                    }
                                },
                                variant: "outline"
                            } : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => {
                                const itemName = item.name || item.item_type || 'Unnamed Item';
                                const category = item.category || item.item_type || 'Other';
                                const location = typeof item.location_found === 'string'
                                    ? item.location_found
                                    : (item.location_found as any)?.area || 'Unknown';
                                const value = item.value_estimate || 0;
                                const storageLocation = item.storageLocation || 'Storage Room A';
                                const dateFound = item.found_date || new Date().toISOString();

                                return (
                                    <Card
                                        key={item.item_id}
                                        className={cn(
                                            "hover:bg-white/5 transition-all duration-300 bg-white/5 border-white/5",
                                            item.status === LostFoundStatus.FOUND && "border-l-4 border-l-blue-500",
                                            item.status === LostFoundStatus.CLAIMED && "border-l-4 border-l-green-500",
                                            item.status === LostFoundStatus.EXPIRED && "border-l-4 border-l-yellow-500"
                                        )}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                                        <i className={cn("text-white text-lg", getCategoryIcon(category))} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white">{itemName}</h4>
                                                        <p className="text-slate-400 text-sm">{category}</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border",
                                                    item.status === LostFoundStatus.FOUND ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                                        item.status === LostFoundStatus.CLAIMED ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                                            item.status === LostFoundStatus.EXPIRED ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                                                                "bg-slate-500/20 text-slate-300 border-slate-500/30"
                                                )}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Location:</span>
                                                    <span className="font-medium text-slate-300">{location}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Value:</span>
                                                    <span className="font-medium text-slate-300">{value ? `$${value}` : 'Unknown'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Storage:</span>
                                                    <span className="font-medium text-slate-300">{storageLocation}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Found:</span>
                                                    <span className="font-medium text-slate-300">{new Date(dateFound).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {item.guestInfo && (
                                                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Guest Info:</p>
                                                    <p className="text-sm text-slate-300">{item.guestInfo.name} - Room {item.guestInfo.room}</p>
                                                    <p className="text-xs text-slate-500">{item.guestInfo.phone}</p>
                                                </div>
                                            )}

                                            {category === 'Weapons' && item.managerApproved === false && (
                                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <i className="fas fa-exclamation-triangle text-red-500" />
                                                        <p className="text-sm font-bold text-red-400">⚠️ Pending Approval</p>
                                                    </div>
                                                    <p className="text-xs text-red-400/80 mt-1">Requires manager review.</p>
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-4 border-t border-white/5">
                                                {item.status === LostFoundStatus.FOUND && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                            onClick={() => handleNotifyGuest(item.item_id)}
                                                            disabled={loading.items}
                                                        >
                                                            Notify
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                            onClick={() => handleClaimItem(item.item_id)}
                                                            disabled={loading.items}
                                                        >
                                                            Claim
                                                        </Button>
                                                    </>
                                                )}
                                                {item.status === LostFoundStatus.EXPIRED && (
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                        onClick={() => handleArchiveItem(item.item_id)}
                                                        disabled={loading.items}
                                                    >
                                                        Archive
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    className="text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                    onClick={() => handleViewDetails(item)}
                                                >
                                                    Details
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-exclamation-triangle text-white text-lg" />
                        </div>
                        Emergency Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            className="bg-red-600 hover:bg-red-500 text-white uppercase tracking-wider font-bold"
                            onClick={() => {
                                const weaponItems = items.filter(i => (i.category || i.item_type) === 'Weapons' && i.managerApproved === false);
                                showSuccess(`${weaponItems.length} weapons require immediate manager approval`);
                            }}
                        >
                            <i className="fas fa-exclamation-triangle mr-2" />
                            Weapon Alert
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-500 text-white uppercase tracking-wider font-bold"
                            onClick={() => {
                                const expiredItems = items.filter(i => i.status === LostFoundStatus.EXPIRED);
                                showSuccess(`${expiredItems.length} items require disposal`);
                            }}
                        >
                            <i className="fas fa-trash mr-2" />
                            Disposal Alert
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

OverviewTab.displayName = 'OverviewTab';


