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
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Analytics & Reports</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Package delivery performance metrics and insights
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-chart-bar text-white text-lg" />
                        </div>
                        Analytics & Reports
                    </CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Package delivery performance metrics and insights
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Key Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                                <CardContent className="pt-6 px-6 pb-6 relative">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                            <i className="fas fa-percentage text-white text-lg"></i>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">On-Time Delivery Rate</p>
                                        <h3 className="text-3xl font-black text-white">94%</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                                <CardContent className="pt-6 px-6 pb-6 relative">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                            <i className="fas fa-clock text-white text-lg"></i>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Handling Time</p>
                                        <h3 className="text-3xl font-black text-white">1.8h</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                                <CardContent className="pt-6 px-6 pb-6 relative">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                            <i className="fas fa-star text-white text-lg"></i>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Guest Satisfaction</p>
                                        <h3 className="text-3xl font-black text-white">4.8</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                                <CardContent className="pt-6 px-6 pb-6 relative">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                            <i className="fas fa-box text-white text-lg"></i>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total This Month</p>
                                        <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <EmptyState
                            icon="fas fa-chart-line"
                            title="Analytics Unavailable"
                            description="Analytics charts will be implemented here."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

AnalyticsTab.displayName = 'AnalyticsTab';

