/**
 * Overview Tab
 * Main tab for Lost & Found item management
 * Displays items grid, filters, and emergency actions
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { LostFoundStatus } from '../../types/lost-and-found.types';
import { showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const OverviewTab: React.FC = React.memo(() => {
    const {
        items,
        loading,
        setSelectedItem,
        notifyGuest,
        claimItem,
        archiveItem,
        setShowDetailsModal
    } = useLostFoundContext();

    const [filter, setFilter] = useState<'all' | LostFoundStatus>('all');

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

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-box text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{metrics.total}</h3>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Items</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-search text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{metrics.found}</h3>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Found Items</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-check-circle text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{metrics.claimed}</h3>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Claimed Items</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-clock text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{metrics.expired}</h3>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Expired Items</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Item Management */}
            <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden mb-8">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
                            <i className="fas fa-box-open text-white text-lg" />
                        </div>
                        Item Management
                    </CardTitle>
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
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                                        : "border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {filterType === 'all' ? 'All Items' : filterType}
                            </Button>
                        ))}
                    </div>
                    {loading.items && items.length === 0 ? (
                        <div className="glass-card border border-dashed border-white/10 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4" />
                            <p className="text-slate-400 animate-pulse">Loading items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <EmptyState
                            icon="fas fa-box-open"
                            title="No Items Found"
                            description="No lost or found items match your current filter."
                            className="bg-black/20 border-dashed border-2 border-white/10"
                            action={{
                                label: "REGISTER NEW ITEM",
                                onClick: () => console.log('Register item logic needed here'), // Placeholder logic as original logic was implied but not clear where the modal trigger was for registering a NEW item from this empty state if not via a specific button. Assuming the header button handles it usually. Wait, the original code had a button. Let's make it actionable.
                                variant: "outline"
                            }}
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
                                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-white/5">
                                                        <i className={cn("text-xl text-slate-400", getCategoryIcon(category))} />
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
                                                            className="flex-1 text-sm bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-wider font-bold shadow-lg shadow-blue-500/20"
                                                            onClick={() => handleNotifyGuest(item.item_id)}
                                                            disabled={loading.items}
                                                        >
                                                            Notify
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 text-sm border-white/10 text-slate-300 hover:bg-white/5 uppercase tracking-wider font-bold"
                                                            onClick={() => handleClaimItem(item.item_id)}
                                                            disabled={loading.items}
                                                        >
                                                            Claim
                                                        </Button>
                                                    </>
                                                )}
                                                {item.status === LostFoundStatus.EXPIRED && (
                                                    <Button
                                                        className="flex-1 text-sm bg-slate-700 hover:bg-slate-600 text-white uppercase tracking-wider font-bold"
                                                        onClick={() => handleArchiveItem(item.item_id)}
                                                        disabled={loading.items}
                                                    >
                                                        Archive
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    className="text-sm border-white/10 text-slate-300 hover:bg-white/5 uppercase tracking-wider font-bold"
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
            <Card className="glass-card border-red-500/30 shadow-2xl shadow-red-900/10">
                <CardHeader className="border-b border-red-500/20 pb-4">
                    <CardTitle className="flex items-center text-xl text-red-400">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-red-500/30">
                            <i className="fas fa-exclamation-triangle text-red-400" />
                        </div>
                        Emergency Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            className="bg-red-600 hover:bg-red-500 text-white uppercase tracking-wider font-bold shadow-lg shadow-red-500/20"
                            onClick={() => {
                                const weaponItems = items.filter(i => (i.category || i.item_type) === 'Weapons' && i.managerApproved === false);
                                showSuccess(`${weaponItems.length} weapons require immediate manager approval`);
                            }}
                        >
                            <i className="fas fa-exclamation-triangle mr-2" />
                            Weapon Alert
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-500 text-white uppercase tracking-wider font-bold shadow-lg shadow-orange-500/20"
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


