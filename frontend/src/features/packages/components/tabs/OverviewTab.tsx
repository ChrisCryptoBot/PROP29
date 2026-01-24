/**
 * Overview Tab
 * Main tab for Package management
 * Displays package list with filtering
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { cn } from '../../../../utils/cn';
import { PackageStatus } from '../../types/package.types';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const OverviewTab: React.FC = React.memo(() => {
    const {
        packages,
        loading,
        setSelectedPackage,
        notifyGuest,
        deliverPackage,
        pickupPackage
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
                            <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Packages</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-inbox text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-white">{metrics.received}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Received Packages</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg mt-2 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <i className="fas fa-bell text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-white">{metrics.notified}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Notified Guests</p>
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
                            <h3 className="text-3xl font-black text-white">{metrics.delivered}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Delivered Today</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Package Management */}
            <Card className="glass-card border-white/10 shadow-lg mb-8">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
                            <i className="fas fa-box-open text-white text-lg" />
                        </div>
                        Package Management
                    </CardTitle>
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
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                                        : "border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {filterType === 'all' ? 'All' : filterType.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                    {loading.packages && packages.length === 0 ? (
                        <div className="text-center py-20">
                            <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4" />
                            <p className="text-slate-400">Loading packages...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <EmptyState
                            icon="fas fa-box-open"
                            title="No Packages Found"
                            description="There are no packages matching your current filter criteria."
                            className="bg-black/20 border-dashed border-2 border-white/10"
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
                                    className="bg-white/5 border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                                    onClick={() => handleViewDetails(pkg)}
                                >
                                    <CardContent className="pt-6 px-6 pb-6">
                                        {/* Header with Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
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
                                                    variant="primary" className="flex-1 text-xs"
                                                    onClick={() => notifyGuest(pkg.package_id)}
                                                    disabled={loading.packages}
                                                >
                                                    <i className="fas fa-bell mr-2" />
                                                    Notify
                                                </Button>
                                            )}
                                            {pkg.status === PackageStatus.NOTIFIED && (
                                                <Button
                                                    variant="primary" className="flex-1 text-xs bg-green-600 hover:bg-green-700 border-green-500"
                                                    onClick={() => deliverPackage(pkg.package_id)}
                                                    disabled={loading.packages}
                                                >
                                                    <i className="fas fa-check mr-2" />
                                                    Deliver
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="flex-1 text-xs border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
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



