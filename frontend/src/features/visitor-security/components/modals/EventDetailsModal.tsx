import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { cn } from '../../../../utils/cn';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = React.memo(({ isOpen, onClose }) => {
    const { selectedEvent, loading } = useVisitorContext();

    if (!isOpen || !selectedEvent) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-900/90 border border-white/5 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-700 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/5">
                            <i className="fas fa-calendar-alt text-2xl text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                {selectedEvent.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                    "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border",
                                    "text-green-400 bg-green-500/10 border-green-500/20"
                                )}>
                                    Scheduled
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                                    Event ID: {selectedEvent.id.slice(0, 8).toUpperCase()}
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
                    {/* Event Logistics */}
                    <div>
                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-[0.2em] mb-4 border-b border-purple-500/20 pb-2">
                            Event Logistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Event Type
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-tag text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedEvent.type}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Venue Location
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-map-marked-alt text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedEvent.location}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Timeline
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-clock text-slate-400" />
                                    <span className="text-sm font-medium text-white">
                                        {new Date(selectedEvent.start_date).toLocaleDateString()}
                                        {' '}—{' '}
                                        {new Date(selectedEvent.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Expected Headcount
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className="fas fa-users text-slate-400" />
                                    <span className="text-sm font-medium text-white">{selectedEvent.expected_attendees} Pax</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Protocol */}
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 border-b border-blue-500/20 pb-2">
                            Security Protocol
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    QR Authentication
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                                    <i className={cn("fas", selectedEvent.qr_code_enabled ? "fa-qrcode text-green-400" : "fa-ban text-red-400")} />
                                    <span className="text-sm font-medium text-white">
                                        {selectedEvent.qr_code_enabled ? 'Enforced' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Badge Tier Configuration
                                </label>
                                <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEvent.badge_types.map(badge => (
                                            <span
                                                key={badge.id}
                                                className="px-3 py-1.5 text-xs font-black rounded uppercase tracking-wider border flex items-center gap-2"
                                                style={{ backgroundColor: `${badge.color}15`, color: badge.color, borderColor: `${badge.color}30` }}
                                            >
                                                <i className="fas fa-id-card-clip" />
                                                {badge.name}
                                                <span className="opacity-50 text-[10px]">({badge.access_level})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end items-center rounded-b-lg">
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
    );
});

EventDetailsModal.displayName = 'EventDetailsModal';
