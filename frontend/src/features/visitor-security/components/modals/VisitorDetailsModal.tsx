import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Avatar } from '../../../../components/UI/Avatar';
import { useVisitorContext } from '../../context/VisitorContext';
import { StatusBadge } from '../shared';
import { formatLocationDisplay } from '../../utils/formatLocation';
import type { VisitorUpdate } from '../../types/visitor-security.types';

interface VisitorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = React.memo(({ isOpen, onClose }) => {
    const {
        selectedVisitor,
        setSelectedVisitor,
        setShowVisitorDetailsModal,
        loading,
        checkInVisitor,
        checkOutVisitor,
        updateVisitor,
        deleteVisitor
    } = useVisitorContext();
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<VisitorUpdate>({});

    useEffect(() => {
        if (selectedVisitor) {
            setEditForm({
                first_name: selectedVisitor.first_name,
                last_name: selectedVisitor.last_name,
                phone: selectedVisitor.phone,
                email: selectedVisitor.email,
                company: selectedVisitor.company,
                purpose: selectedVisitor.purpose,
                location: selectedVisitor.location,
                host_name: selectedVisitor.host_name,
                host_phone: selectedVisitor.host_phone,
                host_room: selectedVisitor.host_room,
                expected_duration: selectedVisitor.expected_duration,
                notes: selectedVisitor.notes
            });
            setEditMode(false);
        }
    }, [selectedVisitor?.id]);

    if (!selectedVisitor) return null;

    const handleCheckIn = async () => {
        await checkInVisitor(selectedVisitor.id);
    };

    const handleCheckOut = async () => {
        await checkOutVisitor(selectedVisitor.id);
    };

    const handleSaveEdit = async () => {
        const result = await updateVisitor(selectedVisitor.id, editForm);
        if (result) {
            setSelectedVisitor(result);
            setEditMode(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this visitor record? This cannot be undone.')) return;
        const success = await deleteVisitor(selectedVisitor.id);
        if (success) {
            setShowVisitorDetailsModal(false);
            onClose();
        }
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
                    {editMode ? (
                        <>
                            <Button variant="outline" onClick={() => setEditMode(false)} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={loading.visitors} variant="primary" className="text-xs font-black uppercase tracking-widest">
                                {loading.visitors ? <i className="fas fa-spinner fa-spin mr-2" aria-hidden /> : null}
                                Save
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setEditMode(true)} className="text-xs font-black uppercase tracking-widest">
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading.visitors} className="text-xs font-black uppercase tracking-widest">
                                Delete
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
                            {(selectedVisitor.status === 'checked_in' || selectedVisitor.status === 'overdue') && (
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
                    )}
                </>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-14 h-14 bg-blue-600 border border-white/5">
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
                    {editMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Purpose</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.purpose ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, purpose: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Destination</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.location ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Host</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.host_name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, host_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Expected Duration (min)</label>
                                <input type="number" className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.expected_duration ?? 60} onChange={(e) => setEditForm((f) => ({ ...f, expected_duration: parseInt(e.target.value, 10) || 60 }))} />
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Contact & Clearance</p>
                    {editMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">First Name</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.first_name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Last Name</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.last_name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.email ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono" value={editForm.phone ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Company</label>
                                <input className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm" value={editForm.company ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>
        </Modal>
    );
});

VisitorDetailsModal.displayName = 'VisitorDetailsModal';
