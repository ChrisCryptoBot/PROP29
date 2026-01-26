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
            {/* Analytics Header */}
            <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-4 shadow-2xl border border-white/5">
                    <i className="fas fa-chart-line text-white text-lg" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Performance Analytics</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-1">Occupancy & Revenue Tracking</p>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Occupancy Rate', value: `${analytics.occupancyRate}%`, icon: 'fa-chart-line', color: 'from-indigo-600/80 to-slate-900', secondary: 'text-indigo-400' },
                    { label: 'Today\'s Revenue', value: `$${analytics.revenue.today}`, icon: 'fa-dollar-sign', color: 'from-emerald-600/80 to-slate-900', secondary: 'text-emerald-400' },
                    { label: 'Weekly Revenue', value: `$${analytics.revenue.thisWeek}`, icon: 'fa-calendar-week', color: 'from-blue-600/80 to-slate-900', secondary: 'text-blue-400' },
                    { label: 'Monthly Forecast', value: `$${analytics.revenue.thisMonth}`, icon: 'fa-calendar-alt', color: 'from-purple-600/80 to-slate-900', secondary: 'text-purple-400' }
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-xl hover:border-white/5 transition-all duration-300 group">
                        <CardContent className="pt-6 px-6 pb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/5", stat.color)}>
                                    <i className={cn("fas text-white text-lg", stat.icon)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Space Type Distribution */}
                <Card className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="flex items-center text-[10px] font-bold text-white uppercase tracking-[0.2em] italic opacity-70">
                            <i className="fas fa-chart-pie text-indigo-500 mr-3" />
                            Inventory Breakdown
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
                <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="flex items-center text-[10px] font-black text-white uppercase tracking-widest">
                            <i className="fas fa-clock text-indigo-500 mr-3" />
                            Usage Heatmap (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-48 flex items-end gap-1.5">
                            {analytics.peakHours.map((hour) => (
                                <div key={hour.hour} className="flex-1 group relative">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500/40 border-t border-indigo-400/30 rounded-t-sm transition-all duration-500 group-hover:from-indigo-500/40 group-hover:to-indigo-400/60"
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
