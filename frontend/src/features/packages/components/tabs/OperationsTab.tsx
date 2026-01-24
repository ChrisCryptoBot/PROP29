/**
 * Operations Tab
 * Package delivery and pickup workflows
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { PackageStatus } from '../../types/package.types';

export const OperationsTab: React.FC = React.memo(() => {
    const { packages, loading } = usePackageContext();

    const pendingDeliveries = packages.filter(p => p.status === PackageStatus.NOTIFIED).length;
    const receivedPackages = packages.filter(p => p.status === PackageStatus.RECEIVED).length;
    const expiredPackages = packages.filter(p => p.status === PackageStatus.EXPIRED).length;

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-bell text-amber-400 text-2xl group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{pendingDeliveries}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Deliveries</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-inbox text-blue-400 text-2xl group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{receivedPackages}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Received (Awaiting Notification)</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-lg group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-exclamation-triangle text-red-400 text-2xl group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{expiredPackages}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expired Packages</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card border-white/10 shadow-lg">
                <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-bold uppercase tracking-tight">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className="fas fa-cogs text-white" />
                        </div>
                        Operations
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                                    <i className="fas fa-truck mr-2 text-blue-400" />
                                    Delivery Operations
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                                    Delivery operations management including route optimization, staff assignments, and delivery tracking.
                                </p>
                                <Button variant="primary" className="w-full">
                                    Manage Deliveries
                                </Button>
                            </div>
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                                    <i className="fas fa-link mr-2 text-blue-400" />
                                    Carrier Integration
                                </h3>
                                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                                    Carrier integration management with real-time API connections, tracking updates, and delivery notifications.
                                </p>
                                <Button variant="primary" className="w-full">
                                    Manage Carriers
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

OperationsTab.displayName = 'OperationsTab';



