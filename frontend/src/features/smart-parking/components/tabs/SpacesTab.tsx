import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { cn } from '../../../../utils/cn';

interface SpacesTabProps {
    onAddSpace: () => void;
}

const SPACE_TYPE_LABELS: Record<string, string> = {
    regular: 'Standard',
    accessible: 'Accessible',
    ev: 'EV',
    staff: 'Staff',
    valet: 'Valet'
};

const SpacesTabContent: React.FC<SpacesTabProps> = ({ onAddSpace }) => {
    const {
        filteredSpaces,
        availableSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        handleSpaceAction
    } = useSmartParkingContext();

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-8">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-4 shadow-2xl border border-white/5">
                        <i className="fas fa-parking text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Parking Spaces</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-1">Real-time Space Status Tracking</p>
                    </div>
                </div>
                <Button
                    variant="glass"
                    onClick={onAddSpace}
                    className="relative group overflow-hidden px-8 h-10 active:scale-[0.98] border-white/5 hover:border-blue-500/30"
                >
                    <div className="relative flex items-center">
                        <i className="fas fa-plus mr-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-colors">Add Space</span>
                    </div>
                </Button>
            </div>

            {/* Space Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Operational', count: availableSpaces.length, icon: 'fa-check-circle', color: 'from-emerald-600/80 to-slate-900' },
                    { label: 'Occupied', count: occupiedSpaces.length, icon: 'fa-parking', color: 'from-blue-600/80 to-slate-900' },
                    { label: 'Reserved', count: reservedSpaces.length, icon: 'fa-clock', color: 'from-amber-600/80 to-slate-900' },
                    { label: 'Maintenance', count: maintenanceSpaces.length, icon: 'fa-tools', color: 'from-red-600/80 to-slate-900' }
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

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSpaces.map((space) => (
                    <Card key={space.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-xl hover:border-blue-500/30 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-black text-white text-xl tracking-tighter italic font-mono">{space.number}</div>
                                <Badge
                                    className={cn(
                                        "text-[9px] font-black uppercase px-2 py-0.5 border",
                                        space.status === 'available' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            space.status === 'occupied' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                space.status === 'reserved' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}
                                >
                                    {space.status}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Space Type</span>
                                    <span className="text-white bg-white/5 px-2 py-0.5 rounded">{SPACE_TYPE_LABELS[space.type] || space.type}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Floor</span>
                                    <span className="text-white">{space.floor}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Zone</span>
                                    <span className="text-white">{space.zone}</span>
                                </div>

                                {space.vehicleInfo ? (
                                    <div className="pt-3 border-t border-white/5 space-y-1">
                                        <div className="text-[10px] font-bold text-slate-300">
                                            {space.vehicleInfo.make} {space.vehicleInfo.model}
                                        </div>
                                        <div className="text-[10px] font-black text-white tracking-widest uppercase font-mono">
                                            {space.vehicleInfo.plate}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-3 border-t border-white/5">
                                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center italic">
                                            No Vehicle Detected
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-2">
                                {space.status === 'available' && (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'reserve')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-all duration-300 active:scale-[0.95] backdrop-blur-sm"
                                    >
                                        Reserve
                                    </button>
                                )}
                                {space.status === 'occupied' && (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'release')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-all duration-300 active:scale-[0.95] backdrop-blur-sm"
                                    >
                                        Release
                                    </button>
                                )}
                                {space.status !== 'maintenance' ? (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'maintenance')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-all duration-300 active:scale-[0.95] backdrop-blur-sm"
                                    >
                                        Offline
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'release')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-all duration-300 active:scale-[0.95] backdrop-blur-sm"
                                    >
                                        Restore
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export const SpacesTab: React.FC<SpacesTabProps> = (props) => (
    <SpacesTabContent {...props} />
);
