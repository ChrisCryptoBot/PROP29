import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { showSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

const OverviewTabContent: React.FC = () => {
    const {
        analytics,
        activeGuestParkings,
        guestParkings,
        filteredGuests,
        availableSpaces
    } = useSmartParkingContext();

    return (
        <div className="space-y-6">
            {/* Page Header - matches tab name Overview */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Overview</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Space utilization and guest registry
                    </p>
                </div>
            </div>
            {/* Compact metrics bar (gold standard — no KPI cards at top) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Smart Parking key metrics">
                <span>Active sessions <strong className="font-black text-white">{activeGuestParkings.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Revenue today <strong className="font-black text-white">${analytics.revenue.today}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Available slots <strong className="font-black text-white">{availableSpaces.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>System health <strong className="font-black text-white">100%</strong></span>
            </div>

            {/* Quick Actions / Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        const overdueVehicles = guestParkings.filter(g => g.status === 'overdue');
                        showSuccess(`${overdueVehicles.length} vehicles have exceeded their time limit`);
                    }}
                    className="w-full justify-start py-4 px-6 h-auto border-white/5 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                >
                    <div className="text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/10 rounded-md flex items-center justify-center border border-red-500/20">
                            <i className="fas fa-exclamation-triangle text-red-400" />
                        </div>
                        <div>
                            <div className="font-black uppercase tracking-widest text-[10px] mb-0.5">Overstay Alerts</div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] italic opacity-50 text-slate-400">Review session limits and violations</p>
                        </div>
                    </div>
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        const activeVehicles = guestParkings.filter(g => g.status === 'active');
                        showSuccess(`${activeVehicles.length} vehicles currently parked`);
                    }}
                    className="w-full justify-start py-4 px-6 h-auto border-white/5 hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400"
                >
                    <div className="text-left flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-md flex items-center justify-center border border-blue-500/20">
                            <i className="fas fa-car text-blue-400" />
                        </div>
                        <div>
                            <div className="font-black uppercase tracking-widest text-[10px] mb-0.5">Live Occupancy</div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] italic opacity-50 text-slate-400">Monitor space usage in real time</p>
                        </div>
                    </div>
                </Button>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-history text-white" />
                        </div>
                        <span className="card-title-text">Automated Activity Log</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    {filteredGuests.length === 0 ? (
                        <EmptyState
                            icon="fas fa-clock"
                            title="No Recent Activity"
                            description="Recent registrations and occupancy updates will appear here."
                            className="bg-[color:var(--console-dark)]/30 border-dashed border-2 border-white/5 mt-4 py-12"
                        />
                    ) : (
                        <div className="space-y-2 mt-4">
                            {filteredGuests.slice(0, 5).map((guest) => (
                                <div key={guest.id} className="flex items-center justify-between p-4 rounded-md border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 border border-white/5">
                                            <i className="fas fa-car-side" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white group-hover:text-blue-400 transition-colors text-sm uppercase tracking-widest">
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

export const OverviewTab: React.FC = () => (
    <OverviewTabContent />
);
