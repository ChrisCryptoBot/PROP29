import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Avatar } from '../../../../components/UI/Avatar';
import { useVisitorContext } from '../../context/VisitorContext';
import { StatusBadge } from '../shared';
import { formatLocationDisplay } from '../../utils/formatLocation';

interface VisitorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = React.memo(({ isOpen, onClose }) => {
    const { selectedVisitor, loading, checkInVisitor, checkOutVisitor } = useVisitorContext();

    if (!selectedVisitor) return null;

    const handleCheckIn = async () => {
        await checkInVisitor(selectedVisitor.id);
    };

    const handleCheckOut = async () => {
        await checkOutVisitor(selectedVisitor.id);
    };

    const title = `${selectedVisitor.first_name} ${selectedVisitor.last_name}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
            footer={
                <>
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest"
                    >
                        Close
                    </Button>
                    {selectedVisitor.status === 'registered' && (
                        <Button
                            onClick={handleCheckIn}
                            disabled={loading.visitors}
                            variant="primary"
                            className="text-xs font-black uppercase tracking-widest"
                        >
                            Authorize Ingress
                        </Button>
                    )}
                    {selectedVisitor.status === 'checked_in' && (
                        <Button
                            onClick={handleCheckOut}
                            disabled={loading.visitors}
                            variant="warning"
                            className="text-xs font-black uppercase tracking-widest"
                        >
                            Process Egress
                        </Button>
                    )}
                </>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-14 h-14 bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-white/5 shadow-xl">
                        <span className="text-xl font-black text-white">
                            {selectedVisitor.first_name[0]}{selectedVisitor.last_name[0]}
                        </span>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={selectedVisitor.status} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                ID: {selectedVisitor.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                            Last Updated: {selectedVisitor.updated_at ? new Date(selectedVisitor.updated_at).toLocaleString() : '—'}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Visit Logistics</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Purpose</p>
                            <p className="text-white font-bold">{selectedVisitor.purpose}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Destination</p>
                            <p className="text-slate-300 text-sm">{formatLocationDisplay(selectedVisitor.location)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Host</p>
                            <p className="text-white font-bold">{selectedVisitor.host_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Expected Duration</p>
                            <p className="text-white font-mono text-sm">{selectedVisitor.expected_duration} min</p>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Contact & Clearance</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</p>
                            <p className="text-slate-300 text-sm">{selectedVisitor.email || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone</p>
                            <p className="text-white font-mono text-sm">{selectedVisitor.phone}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Company</p>
                            <p className="text-slate-300 text-sm">{selectedVisitor.company || 'Private Visitor'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Security Clearance</p>
                            <p className="text-white font-bold uppercase">{selectedVisitor.security_clearance}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
});

VisitorDetailsModal.displayName = 'VisitorDetailsModal';
