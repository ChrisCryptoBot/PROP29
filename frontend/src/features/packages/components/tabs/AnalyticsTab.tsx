/**
 * Analytics Tab
 * Package analytics and reports
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { usePackageContext } from '../../context/PackageContext';
import { PackageStatus } from '../../types/package.types';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const AnalyticsTab: React.FC = React.memo(() => {
    const { packages } = usePackageContext();

    const metrics = useMemo(() => ({
        total: packages.length,
        received: packages.filter(p => p.status === PackageStatus.RECEIVED).length,
        notified: packages.filter(p => p.status === PackageStatus.NOTIFIED).length,
        delivered: packages.filter(p => p.status === PackageStatus.DELIVERED).length,
        expired: packages.filter(p => p.status === PackageStatus.EXPIRED).length,
    }), [packages]);

    return (
        <div className="space-y-6">
            <Card className="glass-card border-white/10 shadow-lg">
                <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-bold uppercase tracking-tight">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className="fas fa-chart-bar text-white" />
                        </div>
                        Analytics & Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Key Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="glass-card border-white/10 shadow-lg group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <i className="fas fa-percentage text-slate-400 text-xl group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-1">94%</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">On-Time Delivery Rate</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card border-white/10 shadow-lg group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <i className="fas fa-clock text-slate-400 text-xl group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-1">1.8h</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Handling Time</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card border-white/10 shadow-lg group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <i className="fas fa-star text-amber-400 text-xl group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-1">4.8</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Guest Satisfaction</p>
                                </CardContent>
                            </Card>

                            <Card className="glass-card border-white/10 shadow-lg group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <i className="fas fa-box text-blue-400 text-xl group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-1">{metrics.total}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total This Month</p>
                                </CardContent>
                            </Card>
                        </div>

                        <EmptyState
                            icon="fas fa-chart-line"
                            title="Analytics Unavailable"
                            description="Analytics charts will be implemented here."
                            className="bg-black/20 border-dashed border-2 border-white/10"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

AnalyticsTab.displayName = 'AnalyticsTab';

