import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { showSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

const DashboardTabContent: React.FC = () => {
    const {
        analytics,
        activeGuestParkings,
        guestParkings,
        filteredGuests,
        availableSpaces
    } = useSmartParkingContext();

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Sessions', value: activeGuestParkings.length, icon: 'fa-parking', color: 'from-blue-600/80 to-slate-900', secondary: 'text-blue-400' },
                    { label: 'Current Revenue', value: `$${analytics.revenue.today}`, icon: 'fa-dollar-sign', color: 'from-emerald-600/80 to-slate-900', secondary: 'text-emerald-400' },
                    { label: 'Available Slots', value: availableSpaces.length, icon: 'fa-check-circle', color: 'from-indigo-600/80 to-slate-900', secondary: 'text-indigo-400' },
                    { label: 'System Health', value: '100%', icon: 'fa-shield-alt', color: 'from-slate-600/80 to-slate-900', secondary: 'text-white' }
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

            {/* Quick Actions / Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="glass"
                    onClick={() => {
                        const overdueVehicles = guestParkings.filter(g => g.status === 'overdue');
                        showSuccess(`${overdueVehicles.length} vehicles have exceeded their time limit`);
                    }}
                    className="relative group overflow-hidden w-full justify-start py-4 px-6 h-auto transition-all duration-300 active:scale-[0.98] border-white/5 hover:border-red-500/30"
                >
                    <div className="relative text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center border border-white/5 group-hover:border-red-500/20 group-hover:bg-red-500/5 transition-all">
                            <i className="fas fa-exclamation-triangle text-slate-500 group-hover:text-red-400" />
                        </div>
                        <div>
                            <div className="font-black uppercase tracking-widest text-[10px] mb-0.5 group-hover:text-white transition-colors">Overstay Alerts</div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] italic opacity-50 text-slate-400">Review session limits and violations</p>
                        </div>
                    </div>
                </Button>
                <Button
                    variant="glass"
                    onClick={() => {
                        const activeVehicles = guestParkings.filter(g => g.status === 'active');
                        showSuccess(`${activeVehicles.length} vehicles currently parked`);
                    }}
                    className="relative group overflow-hidden w-full justify-start py-4 px-6 h-auto transition-all duration-300 active:scale-[0.98] border-white/5 hover:border-blue-500/30"
                >
                    <div className="relative text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center border border-white/5 group-hover:border-blue-500/20 group-hover:bg-blue-500/5 transition-all">
                            <i className="fas fa-car text-slate-500 group-hover:text-blue-400" />
                        </div>
                        <div>
                            <div className="font-black uppercase tracking-widest text-[10px] mb-0.5 group-hover:text-white transition-colors">Live Occupancy</div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] italic opacity-50 text-slate-400">Monitor space usage in real time</p>
                        </div>
                    </div>
                </Button>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                    <CardTitle className="flex items-center text-sm text-white font-black uppercase tracking-widest">
                        <i className="fas fa-history text-blue-500 mr-3" />
                        Automated Activity Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    {filteredGuests.length === 0 ? (
                        <EmptyState
                            icon="fas fa-clock"
                            title="No Recent Activity"
                            description="Recent registrations and occupancy updates will appear here."
                            className="bg-slate-950/30 border-dashed border-2 border-white/5 mt-4 py-12"
                        />
                    ) : (
                        <div className="space-y-2 mt-4">
                            {filteredGuests.slice(0, 5).map((guest) => (
                                <div key={guest.id} className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300 border border-white/5">
                                            <i className="fas fa-car-side" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm">
                                                {guest.guestName}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                {guest.vehicleInfo.make} {guest.vehicleInfo.model} • <span className="font-mono text-white/70">{guest.vehicleInfo.plate}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-white uppercase tracking-tighter">Space <span className="font-mono">{guest.spaceNumber}</span></div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{guest.roomNumber}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const DashboardTab: React.FC = () => (
    <DashboardTabContent />
);
