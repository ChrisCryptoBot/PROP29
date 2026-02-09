/**
 * Overview Tab
 * Main tab for Lost & Found item management
 * Displays items grid, filters, and emergency actions
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { LostFoundStatus } from '../../types/lost-and-found.types';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';

export interface OverviewTabProps {
    /** When true, hide the page header (Lost & Found + subtitle); use when embedded in Property Items Overview. */
    embedded?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({ embedded = false }) => {
    const context = useLostFoundContext();
    const {
        items,
        loading,
        setSelectedItem,
        notifyGuest,
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
            case 'found': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case 'claimed': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'expired': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'donated': return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
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

    const handleClaimItem = (item: any) => {
        setSelectedItem(item);
        if (setShowDetailsModal) setShowDetailsModal(true);
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
            {!embedded && (
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="page-title">Lost & Found</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
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
            )}

            {/* When embedded: section title first, then metrics (aligns with Packages section order) */}
            {embedded && <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Lost & Found Items</h3>}
            {/* Compact metrics bar (gold standard — uniform with other modules) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Lost & Found metrics">
                <span>Total <strong className="font-black text-white">{metrics.total}</strong> · Found <strong className="font-black text-white">{metrics.found}</strong> · Claimed <strong className="font-black text-white">{metrics.claimed}</strong> · Expired <strong className="font-black text-white">{metrics.expired}</strong></span>
            </div>

            {/* Item list — no card wrapper */}
            <section className="mb-8">
                {!embedded && <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Lost & Found Items</h3>}
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
                                    <div
                                        key={item.item_id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleViewDetails(item)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(item); } }}
                                        className={cn(
                                            "rounded-md border p-4 hover:bg-white/5 transition-all duration-300 bg-white/5 border-white/5 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                                            item.status === LostFoundStatus.FOUND && "border-l-4 border-l-blue-500",
                                            item.status === LostFoundStatus.CLAIMED && "border-l-4 border-l-green-500",
                                            item.status === LostFoundStatus.EXPIRED && "border-l-4 border-l-yellow-500"
                                        )}
                                    >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
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
                                                <div className="mb-4 p-3 bg-slate-800/50 rounded-md border border-white/5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Guest Info:</p>
                                                    <p className="text-sm text-slate-300">{item.guestInfo.name} - Room {item.guestInfo.room}</p>
                                                    <p className="text-xs text-slate-500">{item.guestInfo.phone}</p>
                                                </div>
                                            )}

                                            {category === 'Weapons' && item.managerApproved === false && (
                                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                                    <div className="flex items-center space-x-2">
                                                        <i className="fas fa-exclamation-triangle text-red-500" />
                                                        <p className="text-sm font-bold text-red-400">⚠️ Pending Approval</p>
                                                    </div>
                                                    <p className="text-xs text-red-400/80 mt-1">Requires manager review.</p>
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-4 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
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
                                                            onClick={() => handleClaimItem(item)}
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
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </section>
        </div>
    );
});

OverviewTab.displayName = 'OverviewTab';


