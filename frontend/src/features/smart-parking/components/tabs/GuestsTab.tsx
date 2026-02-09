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
            case 'ready': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase"><i className="fas fa-car mr-1" /> Ready</Badge>;
            case 'delivered': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] font-black uppercase"><i className="fas fa-check-circle mr-1" /> Delivered</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Summary */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Guest Registry</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">Live and historical parking sessions</p>
                </div>
                <Button
                    variant="outline"
                    onClick={onRegisterGuest}
                    className="px-8 h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
                >
                    <i className="fas fa-user-plus mr-2" aria-hidden />
                    Secure Registration
                </Button>
            </div>

            {/* Compact metrics bar (gold standard) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Guest registry metrics">
                <span>Active <strong className="font-black text-white">{activeGuestParkings.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Completed today <strong className="font-black text-white">{completedGuestParkings.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Violations <strong className="font-black text-white">{overdueGuestParkings.length}</strong></span>
            </div>

            {/* Main Registry Table */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-list text-white" />
                        </div>
                        <span className="card-title-text">Guest Parking Registry</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-white/5">
                        {['all', 'active', 'completed', 'overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status as any)}
                                className={cn(
                                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-colors rounded-md border",
                                    filter === status
                                        ? "bg-white/10 text-white border-white/20"
                                        : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
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
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Guest</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Space / Cost</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">PMS Link</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayGuests.map((guest) => (
                                        <tr key={guest.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-white uppercase tracking-tight">{guest.guestName}</div>
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
                                                            className="bg-white/5 border border-white/5 text-slate-400 hover:bg-emerald-500/10 hover:text-white hover:border-emerald-500/20 px-4 py-2 rounded-md transition-colors"
                                                        >
                                                            Checkout
                                                        </button>
                                                        <button
                                                            onClick={() => handleGuestAction(guest.id, 'valet')}
                                                            className="bg-white/5 border border-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-white hover:border-blue-500/20 px-4 py-2 rounded-md transition-colors"
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
