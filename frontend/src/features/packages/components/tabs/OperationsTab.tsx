/**
 * Operations Tab
 * Package delivery and pickup workflows
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { PackageStatus } from '../../types/package.types';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';

export const OperationsTab: React.FC = React.memo(() => {
    const { packages, loading } = usePackageContext();

    const pendingDeliveries = packages.filter(p => p.status === PackageStatus.NOTIFIED).length;
    const receivedPackages = packages.filter(p => p.status === PackageStatus.RECEIVED).length;
    const expiredPackages = packages.filter(p => p.status === PackageStatus.EXPIRED).length;

    return (
        <div className="space-y-6">
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Operations</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                        Package delivery and pickup workflows
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900/50 border border-white/5 group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">PENDING</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                                <i className="fas fa-bell text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pending Deliveries</p>
                            <h3 className="text-3xl font-black text-white">{pendingDeliveries}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border border-white/5 group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-white bg-blue-500/10 border border-blue-500/20 rounded uppercase">RECEIVED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                                <i className="fas fa-inbox text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Received</p>
                            <h3 className="text-3xl font-black text-white">{receivedPackages}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border border-white/5 group">
                    <CardContent className="pt-6 px-6 pb-6 relative">
                        <div className="absolute top-4 right-4">
                            <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">EXPIRED</span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                                <i className="fas fa-exclamation-triangle text-white text-lg"></i>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expired Packages</p>
                            <h3 className="text-3xl font-black text-white">{expiredPackages}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-cogs text-white" />
                        </div>
                        <span className="card-title-text">Operations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3 flex items-center">
                                    <i className="fas fa-truck mr-2 text-white" />
                                    Delivery Operations
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                                    Delivery operations management including route optimization, staff assignments, and delivery tracking. Available in a future release. Use the Packages list and Notify/Deliver actions for now.
                                </p>
                            </div>
                            <div className="p-6 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3 flex items-center">
                                    <i className="fas fa-link mr-2 text-white" />
                                    Carrier Integration
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                                    Carrier integration management with real-time API connections, tracking updates, and delivery notifications. Available in a future release.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

OperationsTab.displayName = 'OperationsTab';



