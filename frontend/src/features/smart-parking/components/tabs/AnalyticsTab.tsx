import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { cn } from '../../../../utils/cn';

const AnalyticsTabContent: React.FC = () => {
    const {
        analytics,
        regularSpaces,
        accessibleSpaces,
        staffSpaces,
        valetSpaces,
        evSpaces
    } = useSmartParkingContext();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Performance Analytics</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Occupancy & Revenue Tracking
                    </p>
                </div>
            </div>

            {/* Compact metrics bar (gold standard — no KPI cards) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Parking analytics metrics">
                <span>Occupancy <strong className="font-black text-white">{analytics.occupancyRate}%</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Today <strong className="font-black text-white">${analytics.revenue.today}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Weekly <strong className="font-black text-white">${analytics.revenue.thisWeek}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Monthly <strong className="font-black text-white">${analytics.revenue.thisMonth}</strong></span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Space Type Distribution */}
                <Card className="lg:col-span-1 bg-slate-900/50 border border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-chart-pie text-white" />
                            </div>
                            <span className="card-title-text">Inventory Breakdown</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Standard', count: regularSpaces.length, total: analytics.totalSpaces, color: 'bg-indigo-500' },
                                { label: 'Accessible', count: accessibleSpaces.length, total: analytics.totalSpaces, color: 'bg-amber-500' },
                                { label: 'Staff', count: staffSpaces.length, total: analytics.totalSpaces, color: 'bg-slate-500' },
                                { label: 'Valet', count: valetSpaces.length, total: analytics.totalSpaces, color: 'bg-blue-500' },
                                { label: 'EV', count: evSpaces.length, total: analytics.totalSpaces, color: 'bg-emerald-500' }
                            ].map((type, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{type.label}</span>
                                        <span className="text-white">{type.count} <span className="text-slate-600">/ {type.total}</span></span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", type.color)}
                                            style={{ width: `${type.total > 0 ? (type.count / type.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Peak Hours Analysis */}
                <Card className="lg:col-span-2 bg-slate-900/50 border border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-clock text-white" />
                            </div>
                            <span className="card-title-text">Usage Heatmap (24h)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-48 flex items-end gap-1.5">
                            {analytics.peakHours.map((hour) => (
                                <div key={hour.hour} className="flex-1 group relative">
                                    <div
                                        className="w-full bg-indigo-500/40 border-t border-indigo-500/30 rounded-t-sm transition-colors hover:bg-indigo-500/60"
                                        style={{ height: `${(hour.occupancy / 100) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/5 px-1.5 py-0.5 rounded text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {hour.occupancy}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 px-1">
                            {['00:00', '06:00', '12:00', '18:00', '23:59'].map((time) => (
                                <span key={time} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{time}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export const AnalyticsTab: React.FC = () => (
    <AnalyticsTabContent />
);
