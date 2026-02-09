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
                <div>
                    <h2 className="page-title">Parking Spaces</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">Real-time space status tracking</p>
                </div>
                <Button
                    variant="glass"
                    onClick={onAddSpace}
                    className="h-10 text-[10px] font-black uppercase tracking-widest px-8 shadow-none"
                    aria-label="Add parking space"
                >
                    <i className="fas fa-plus mr-2" aria-hidden />
                    Add Space
                </Button>
            </div>

            {/* Compact metrics bar (gold standard) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Space status metrics">
                <span>Operational <strong className="font-black text-white">{availableSpaces.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Occupied <strong className="font-black text-white">{occupiedSpaces.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Reserved <strong className="font-black text-white">{reservedSpaces.length}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Maintenance <strong className="font-black text-white">{maintenanceSpaces.length}</strong></span>
            </div>

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSpaces.map((space) => (
                    <Card key={space.id} className="bg-slate-900/50 border border-white/5 hover:bg-white/5 transition-colors">
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
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-500/20 hover:bg-blue-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-colors"
                                        aria-label="Reserve space"
                                    >
                                        Reserve
                                    </button>
                                )}
                                {space.status === 'occupied' && (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'release')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-colors"
                                        aria-label="Release space"
                                    >
                                        Release
                                    </button>
                                )}
                                {space.status !== 'maintenance' ? (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'maintenance')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-colors"
                                        aria-label="Mark offline"
                                    >
                                        Offline
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSpaceAction(space.id, 'release')}
                                        className="flex-1 bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-md transition-colors"
                                        aria-label="Restore space"
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
