import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { cn } from '../../../../utils/cn';

interface GuestsTabProps {
    onRegisterGuest: () => void;
}

const GuestsTabContent: React.FC<GuestsTabProps> = ({ onRegisterGuest }) => {
    const {
        filteredGuests,
        activeGuestParkings,
        completedGuestParkings,
        overdueGuestParkings,
        handleGuestAction
    } = useSmartParkingContext();

    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

    const displayGuests = useMemo(() => {
        if (filter === 'all') return filteredGuests;
        return filteredGuests.filter(g => g.status === filter);
    }, [filteredGuests, filter]);

    const getValetBadge = (status: string | undefined) => {
        switch (status) {
            case 'requested': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-black uppercase"><i className="fas fa-bell mr-1" /> Requested</Badge>;
            case 'retrieving': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black uppercase"><i className="fas fa-running mr-1" /> Retrieving</Badge>;
            case 'ready': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase animate-pulse"><i className="fas fa-car mr-1" /> Ready</Badge>;
            case 'delivered': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] font-black uppercase"><i className="fas fa-check-circle mr-1" /> Delivered</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Summary */}
            <div className="flex justify-between items-end mb-8">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-4 shadow-2xl border border-white/5">
                        <i className="fas fa-users text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Guest Registry</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-1">Live & Historical Parking Sessions</p>
                    </div>
                </div>
                <Button
                    variant="glass"
                    onClick={onRegisterGuest}
                    className="relative group overflow-hidden px-8 h-10 active:scale-[0.98] border-white/5 hover:border-indigo-500/30"
                >
                    <div className="relative flex items-center">
                        <i className="fas fa-user-plus mr-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-colors">Secure Registration</span>
                    </div>
                </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Active Sessions', count: activeGuestParkings.length, icon: 'fa-user-check', color: 'from-indigo-600/80 to-slate-900', secondary: 'text-indigo-400' },
                    { label: 'Completed Today', count: completedGuestParkings.length, icon: 'fa-history', color: 'from-emerald-600/80 to-slate-900', secondary: 'text-emerald-400' },
                    { label: 'Violation Alerts', count: overdueGuestParkings.length, icon: 'fa-exclamation-triangle', color: 'from-red-600/80 to-slate-900', secondary: 'text-red-400' }
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-xl hover:border-white/5 transition-all duration-300 group">
                        <CardContent className="pt-6 px-6 pb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/5", stat.color)}>
                                    <i className={cn("fas text-white text-lg", stat.icon)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white">{stat.count}</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Registry Table */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="px-6 pt-6 pb-2 border-none">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic opacity-70">
                        Guest Parking Registry
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-white/5">
                        {['all', 'active', 'completed', 'overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status as any)}
                                className={cn(
                                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all rounded-md border",
                                    filter === status
                                        ? "bg-[rgba(37,99,235,0.3)] text-white border border-[rgba(37,99,235,0.5)] shadow-[0_0_14px_rgba(37,99,235,0.5)]"
                                        : "border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {displayGuests.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon="fas fa-car-side"
                                title="No Active Sessions"
                                description="Register a guest vehicle to start tracking a session."
                                action={{
                                    label: "REGISTER VEHICLE",
                                    onClick: onRegisterGuest
                                }}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.01]">
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guest</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vehicle</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Space / Cost</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">PMS Link</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayGuests.map((guest) => (
                                        <tr key={guest.id} className="border-b border-white/5 hover:bg-blue-500/5 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{guest.guestName}</div>
                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5 font-mono">{guest.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-bold text-slate-300">{guest.vehicleInfo.make} {guest.vehicleInfo.model}</div>
                                                <div className="text-[10px] font-black text-white tracking-widest uppercase mt-0.5 font-mono">{guest.vehicleInfo.plate}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-black text-white uppercase">Space {guest.spaceNumber}</div>
                                                <div className="text-xs font-black text-white mt-0.5 font-mono">${guest.cost.toFixed(2)}</div>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-bold text-slate-400 tracking-tighter">
                                                {guest.roomNumber}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge className={cn(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 border",
                                                        guest.status === 'active' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                            guest.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        {guest.status}
                                                    </Badge>
                                                    {getValetBadge(guest.valetStatus)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {guest.status === 'active' && (
                                                    <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                                                        <button
                                                            onClick={() => handleGuestAction(guest.id, 'checkout')}
                                                            className="bg-white/5 border border-white/5 text-slate-400 hover:bg-[rgba(5,150,105,0.3)] hover:text-white hover:border-[rgba(5,150,105,0.5)] px-4 py-2 rounded-md transition-all duration-300 active:scale-[0.95]"
                                                        >
                                                            Checkout
                                                        </button>
                                                        <button
                                                            onClick={() => handleGuestAction(guest.id, 'valet')}
                                                            className="bg-white/5 border border-white/5 text-slate-400 hover:bg-[rgba(79,70,229,0.3)] hover:text-white hover:border-[rgba(79,70,229,0.5)] px-4 py-2 rounded-md transition-all duration-300 active:scale-[0.95]"
                                                        >
                                                            Valet
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const GuestsTab: React.FC<GuestsTabProps> = (props) => (
    <GuestsTabContent {...props} />
);

GuestsTab.displayName = 'GuestsTab';
