/**
 * Overview Tab
 * Main tab for Package management
 * Displays package list with filtering
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { cn } from '../../../../utils/cn';
import { PackageStatus } from '../../types/package.types';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';

export interface OverviewTabProps {
    /** When true, hide the page header (Packages + subtitle); use when embedded in Property Items Overview. */
    embedded?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({ embedded = false }) => {
    const {
        packages,
        loading,
        setSelectedPackage,
        notifyGuest,
        deliverPackage,
        pickupPackage,
        refreshPackages
    } = usePackageContext();

    const handleRefreshList = useCallback(() => {
        refreshPackages();
    }, [refreshPackages]);

    const [filter, setFilter] = useState<'all' | PackageStatus>('all');

    const filteredPackages = useMemo(() => {
        if (filter === 'all') return packages;
        return packages.filter(pkg => pkg.status === filter);
    }, [packages, filter]);

    const metrics = useMemo(() => ({
        total: packages.length,
        received: packages.filter(p => p.status === PackageStatus.RECEIVED).length,
        notified: packages.filter(p => p.status === PackageStatus.NOTIFIED).length,
        delivered: packages.filter(p => p.status === PackageStatus.DELIVERED).length,
        expired: packages.filter(p => p.status === PackageStatus.EXPIRED).length,
    }), [packages]);

    const getStatusBadgeClass = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.PENDING:
            case PackageStatus.RECEIVED:
                return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case PackageStatus.NOTIFIED:
                return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case PackageStatus.DELIVERED:
                return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case PackageStatus.EXPIRED:
                return 'text-red-300 bg-red-500/20 border border-red-500/30';
            default:
                return 'text-slate-400 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return dateString.split('T')[0];
        }
    };

    const getLocationDisplay = (location?: { area?: string; floor?: string; building?: string; room?: string }) => {
        if (!location) return 'Not specified';
        if (typeof location === 'string') return location;
        const parts = [location.building, location.floor, location.area, location.room].filter(Boolean);
        return parts.length > 0 ? parts.join(' - ') : 'Not specified';
    };

    const handleViewDetails = (pkg: typeof packages[0]) => {
        setSelectedPackage(pkg);
    };

    return (
        <div className="space-y-6">
            {/* Same format as Lost & Found: title + subtitle when not embedded; section title when embedded */}
            {!embedded ? (
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="page-title">Packages and Deliveries</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                            Package delivery and tracking management
                        </p>
                    </div>
                </div>
            ) : (
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Packages and Deliveries</h3>
            )}
            {/* Compact metrics bar (gold standard — uniform with other modules) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Packages metrics">
                <span>Total <strong className="font-black text-white">{metrics.total}</strong> · Received <strong className="font-black text-white">{metrics.received}</strong> · Notified <strong className="font-black text-white">{metrics.notified}</strong> · Delivered <strong className="font-black text-white">{metrics.delivered}</strong> · Expired <strong className="font-black text-white">{metrics.expired}</strong></span>
            </div>

            {/* Package list — no card wrapper */}
            <section className="mb-8">
                    <div className="flex flex-wrap gap-2 mb-8">
                        {['all', PackageStatus.PENDING, PackageStatus.RECEIVED, PackageStatus.NOTIFIED, PackageStatus.DELIVERED, PackageStatus.EXPIRED].map(filterType => (
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
                                {filterType === 'all' ? 'All' : filterType.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                    {loading.packages && packages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading packages" />
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Packages...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <EmptyState
                            icon="fas fa-box-open"
                            title="No Packages Found"
                            description="There are no packages matching your current filter criteria."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                            action={{
                                label: "REFRESH LIST",
                                onClick: handleRefreshList,
                                variant: "outline"
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPackages.map(pkg => (
                                <div
                                    key={pkg.package_id}
                                    className="rounded-md border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                                    onClick={() => handleViewDetails(pkg)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(pkg); } }}
                                >
                                        {/* Header with Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 flex-shrink-0">
                                                    <i className="fas fa-box text-white text-lg" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white tracking-wide">{pkg.tracking_number || 'No tracking'}</h4>
                                                    <p className="text-sm text-slate-400">{pkg.sender_name || 'Unknown sender'}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border",
                                                getStatusBadgeClass(pkg.status)
                                            )}>
                                                {pkg.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Package Details — flat, no inner box; spacing only */}
                                        <div className="space-y-2 mb-4">
                                            {pkg.description && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">Description</span>
                                                    <span className="font-medium text-slate-200">{pkg.description}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Size:</span>
                                                <span className="font-medium text-slate-300">{pkg.size || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Location:</span>
                                                <span className="font-medium text-slate-300">{getLocationDisplay(pkg.location)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Received:</span>
                                                <span className="font-medium text-slate-300">{formatDate(pkg.received_at)}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            {pkg.status === PackageStatus.RECEIVED && (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                    onClick={() => notifyGuest(pkg.package_id)}
                                                    disabled={loading.packages}
                                                >
                                                    <i className="fas fa-bell mr-2" />
                                                    Notify
                                                </Button>
                                            )}
                                            {pkg.status === PackageStatus.NOTIFIED && (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                    onClick={() => deliverPackage(pkg.package_id)}
                                                    disabled={loading.packages}
                                                >
                                                    <i className="fas fa-check mr-2" />
                                                    Deliver
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 px-4 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                onClick={() => handleViewDetails(pkg)}
                                            >
                                                <i className="fas fa-eye mr-2" />
                                                View
                                            </Button>
                                        </div>
                                </div>
                            ))}
                        </div>
                    )}
            </section>
        </div>
    );
});

OverviewTab.displayName = 'OverviewTab';



