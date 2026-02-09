import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../utils/formatLocation';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = React.memo(({ isOpen, onClose }) => {
    const { selectedEvent, deleteEvent, setShowEventDetailsModal, setSelectedEvent, loading } = useVisitorContext();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!selectedEvent || !window.confirm('Delete this event? This cannot be undone.')) return;
        setDeleting(true);
        const success = await deleteEvent(selectedEvent.id);
        setDeleting(false);
        if (success) {
            setSelectedEvent(null);
            setShowEventDetailsModal(false);
            onClose();
        }
    };

    if (!selectedEvent) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedEvent.name}
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
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading.events || deleting}
                        className="text-xs font-black uppercase tracking-widest"
                    >
                        {deleting || loading.events ? <i className="fas fa-spinner fa-spin mr-2" aria-hidden /> : <i className="fas fa-trash mr-2" aria-hidden />}
                        Delete Event
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border',
                        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    )}>
                        Scheduled
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        ID: {selectedEvent.id.slice(0, 8).toUpperCase()}
                    </span>
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Event Logistics</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Type</p>
                            <p className="text-white font-bold">{selectedEvent.type}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Venue</p>
                            <p className="text-slate-300 text-sm">{formatLocationDisplay(selectedEvent.location)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Timeline</p>
                            <p className="text-white font-mono text-sm">
                                {new Date(selectedEvent.start_date).toLocaleDateString()}
                                {' — '}
                                {new Date(selectedEvent.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Expected Headcount</p>
                            <p className="text-white font-bold">{selectedEvent.expected_attendees} Pax</p>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Security Protocol</p>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">QR Authentication</p>
                            <p className="text-sm text-white font-bold">
                                {selectedEvent.qr_code_enabled ? 'Enforced' : 'Disabled'}
                            </p>
                        </div>
                        {selectedEvent.badge_types && selectedEvent.badge_types.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Badge Tiers</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedEvent.badge_types.map(badge => (
                                        <span
                                            key={badge.id}
                                            className="px-3 py-1 text-[10px] font-black rounded uppercase tracking-wider border"
                                            style={{ backgroundColor: `${badge.color}15`, color: badge.color, borderColor: `${badge.color}30` }}
                                        >
                                            {badge.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
});

EventDetailsModal.displayName = 'EventDetailsModal';
