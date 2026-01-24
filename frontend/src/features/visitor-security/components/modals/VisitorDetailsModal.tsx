import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Avatar } from '../../../../components/UI/Avatar';
import { useVisitorContext } from '../../context/VisitorContext';
import { StatusBadge } from '../shared';
import { cn } from '../../../../utils/cn';

interface VisitorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = React.memo(({ isOpen, onClose }) => {
    const { selectedVisitor, loading, checkInVisitor, checkOutVisitor } = useVisitorContext();

    if (!isOpen || !selectedVisitor) return null;

    const handleCheckIn = async () => {
        if (selectedVisitor) {
            await checkInVisitor(selectedVisitor.id);
        }
    };

    const handleCheckOut = async () => {
        if (selectedVisitor) {
            await checkOutVisitor(selectedVisitor.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-900/90 border border-white/10 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-white/10 shadow-lg">
                            <span className="text-2xl font-black text-white">
                                {selectedVisitor.first_name[0]}{selectedVisitor.last_name[0]}
                            </span>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                {selectedVisitor.first_name} {selectedVisitor.last_name}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <StatusBadge status={selectedVisitor.status} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                                    ID: {selectedVisitor.id.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times text-xl" />
                    </Button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Visit Details */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 border-b border-blue-500/20 pb-2">
                            Visit Logistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Purpose of Visit
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-clipboard-check text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.purpose}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Destination
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-map-marker-alt text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.location}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Host / Point of Contact
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-user-tie text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.host_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Expected Duration
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-hourglass-half text-slate-400" />
                                    <span className="text-sm font-medium text-white">
                                        {selectedVisitor.expected_duration} minutes (Estimated)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Security */}
                    <div>
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 border-b border-indigo-500/20 pb-2">
                            Contact & Clearance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Email Address
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-envelope text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.email}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Phone Number
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-phone text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.phone}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Company / Organization
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-building text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedVisitor.company || 'Private Visitor'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Security Clearance
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-id-badge text-slate-400" />
                                    <span className="text-sm font-medium text-white uppercase">{selectedVisitor.security_clearance}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center rounded-b-lg">
                    <p className="text-[10px] text-slate-500 font-mono">
                        System Record: {selectedVisitor.id} • Last Updated: {new Date().toLocaleDateString()}
                    </p>
                    <div className="flex gap-3">
                        {selectedVisitor.status === 'registered' && (
                            <Button
                                onClick={handleCheckIn}
                                disabled={loading.visitors}
                                className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 font-black uppercase tracking-widest px-6"
                            >
                                <i className="fas fa-sign-in-alt mr-2" />
                                Authorize Ingress
                            </Button>
                        )}
                        {selectedVisitor.status === 'checked_in' && (
                            <Button
                                onClick={handleCheckOut}
                                disabled={loading.visitors}
                                className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 font-black uppercase tracking-widest px-6"
                            >
                                <i className="fas fa-sign-out-alt mr-2" />
                                Process Egress
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-500/30 text-slate-400 hover:text-white uppercase tracking-widest font-black"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

VisitorDetailsModal.displayName = 'VisitorDetailsModal';
