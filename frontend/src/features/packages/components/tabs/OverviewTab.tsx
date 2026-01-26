/**
 * Overview Tab
 * Main tab for Package management
 * Displays package list with filtering
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { cn } from '../../../../utils/cn';
import { PackageStatus } from '../../types/package.types';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';

export const OverviewTab: React.FC = React.memo(() => {
    const {
        packages,
        loading,
        setSelectedPackage,
        notifyGuest,
        deliverPackage,
        pickupPackage,
        refreshPackages
    } = usePackageContext();

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
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Packages</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Package delivery and tracking management
                    </p>
                </div>
            </div>
            {/* Key Metrics - Gold Standard Pattern */}
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
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Packages</p>
                            <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-white bg-blue-500/10 border border-blue-500/20 rounded uppercase">RECEIVED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-inbox text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Received Packages</p>
                            <h3 className="text-3xl font-black text-white">{metrics.received}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">NOTIFIED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-bell text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Notified Guests</p>
                            <h3 className="text-3xl font-black text-white">{metrics.notified}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">DELIVERED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                <i className="fas fa-check-circle text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Delivered Today</p>
                            <h3 className="text-3xl font-black text-white">{metrics.delivered}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Package Management */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl mb-8">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-box-open text-white text-lg" />
                        </div>
                        Package Management
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Filter and manage package deliveries
                    </p>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
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
                                onClick: () => console.log('Refresh package list'), // Placeholder logic
                                variant: "outline"
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPackages.map(pkg => (
                                <Card
                                    key={pkg.package_id}
                                    className="bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                                    onClick={() => handleViewDetails(pkg)}
                                >
                                    <CardContent className="pt-6 px-6 pb-6">
                                        {/* Header with Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 flex-shrink-0 group-hover:scale-110 transition-transform">
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

                                        {/* Package Details */}
                                        <div className="space-y-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
});

OverviewTab.displayName = 'OverviewTab';



