/**
 * Metrics Overview Component
 * Extracted from DashboardTab for better modularity
 */

import React from 'react';
import { Card, CardContent } from '../../../../components/UI/Card';
import type { PatrolMetrics } from '../../types';

interface MetricsOverviewProps {
    metrics: PatrolMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                <CardContent className="pt-6 px-6 pb-6 relative">
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-white bg-blue-500/10 border border-blue-500/20 rounded uppercase">LIVE</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-route text-white text-lg"></i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Patrols</p>
                        <h3 className="text-3xl font-black text-white">{metrics.activePatrols}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Currently in progress</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                <CardContent className="pt-6 px-6 pb-6 relative">
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">ON DUTY</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-user-shield text-white text-lg"></i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Officers On Duty</p>
                        <h3 className="text-3xl font-black text-white">{metrics.onDutyOfficers}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Out of {metrics.totalOfficers || 0} total</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                <CardContent className="pt-6 px-6 pb-6 relative">
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded uppercase">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-map-marked-alt text-white text-lg"></i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Routes</p>
                        <h3 className="text-3xl font-black text-white">{metrics.activeRoutes}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Patrol routes in use</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                <CardContent className="pt-6 px-6 pb-6 relative">
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">SUCCESS</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                            <i className="fas fa-check-double text-white text-lg"></i>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Completion Rate</p>
                        <h3 className="text-3xl font-black text-white">{metrics.checkpointCompletionRate ?? 0}%</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Checkpoint success</p>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                style={{ width: `${Math.min(100, Math.max(0, metrics.checkpointCompletionRate ?? 0))}%` }}
                                role="progressbar"
                                aria-valuenow={metrics.checkpointCompletionRate ?? 0}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
