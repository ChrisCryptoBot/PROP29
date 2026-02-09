import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { Badge } from '../../../../components/UI/Badge';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import type { SystemProperty } from '../../types/system-admin.types';
import { cn } from '../../../../utils/cn';

export const PropertyMetricsModal: React.FC = () => {
    const {
        showPropertyMetricsModal,
        setShowPropertyMetricsModal,
        selectedPropertyForMetrics,
        setSelectedPropertyForMetrics,
    } = useSystemAdminContext();

    if (!showPropertyMetricsModal || !selectedPropertyForMetrics) return null;

    const p = selectedPropertyForMetrics;
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Operational': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'Maintenance': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Closed': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-white/5 text-slate-400 border-white/5';
        }
    };

    const handleClose = () => {
        setShowPropertyMetricsModal(false);
        setSelectedPropertyForMetrics(null);
    };

    return (
        <Modal
            isOpen={showPropertyMetricsModal}
            onClose={handleClose}
            title={`Metrics — ${p.title}`}
            size="sm"
            footer={
                <Button variant="subtle" onClick={handleClose}>
                    Close
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                    <Badge className={cn('font-bold uppercase text-[10px] tracking-widest px-3 py-1', getStatusStyle(p.status))}>
                        {p.status}
                    </Badge>
                </div>
                {p.description && (
                    <p className="text-sm text-slate-400">{p.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                    <div className="bg-white/5 rounded-md p-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Inventory</div>
                        <div className="text-xl font-black text-white">{p.rooms} <span className="text-sm font-medium text-slate-400">units</span></div>
                    </div>
                    <div className="bg-white/5 rounded-md p-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Occupancy</div>
                        <div className="text-xl font-black text-blue-400">{p.occupancy}</div>
                    </div>
                    <div className="bg-white/5 rounded-md p-4 col-span-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Revenue</div>
                        <div className="text-xl font-black text-green-400">{p.revenue}</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
