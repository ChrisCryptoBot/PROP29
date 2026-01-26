import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { Incident } from '../../types/incident-log.types';

interface EscalationModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident | null;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({ isOpen, onClose, incident }) => {
    const {
        escalateIncident,
        loading
    } = useIncidentLogContext();

    const [reason, setReason] = useState('');
    const [notifyRecipients, setNotifyRecipients] = useState([
        'Security Manager',
        'Operations Manager',
        'General Manager'
    ]);

    if (!incident) return null;

    const handleEscalate = async () => {
        if (!reason) return;
        const id = incident.incident_id;
        const success = await escalateIncident(id, reason);
        if (success) {
            onClose();
        }
    };

    // Get current escalation level from incident
    const currentLevel = incident.escalation_level || 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Escalate Incident"
            size="lg"
            footer={(
                <>
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEscalate}
                        disabled={loading.incidents || !reason}
                        variant="glass"
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-arrow-up mr-2" />
                        {loading.incidents ? 'Escalating...' : 'Escalate Now'}
                    </Button>
                </>
            )}
        >
            <div className="space-y-6">
                    {/* Current Escalation Level */}
                    <div className="rounded-lg p-4 bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Current Escalation Level</p>
                                <p className="text-2xl font-bold text-white mt-1">{currentLevel}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">New Level</p>
                                <p className="text-2xl font-bold text-green-400 mt-1">{currentLevel + 1}</p>
                            </div>
                        </div>
                    </div>

                    {/* Escalation Reason */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Escalation Reason</label>
                        <textarea
                            id="escalation-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 resize-none"
                            rows={4}
                            placeholder="Enter reason for escalation..."
                        />
                    </div>

                    {/* Notification Recipients */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Notify</label>
                        <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-white/5">
                            {['Security Manager', 'Operations Manager', 'General Manager', 'Legal Team'].map((recipient) => (
                                <label key={recipient} className="flex items-center p-2 rounded hover:bg-white/5 transition-colors cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyRecipients.includes(recipient)}
                                        onChange={(e) => {
                                            if (e.target.checked) setNotifyRecipients(prev => [...prev, recipient]);
                                            else setNotifyRecipients(prev => prev.filter(r => r !== recipient));
                                        }}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/5 rounded focus:ring-blue-500/20 mr-3"
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">{recipient}</span>
                                </label>
                            ))}
                        </div>
                    </div>
            </div>
        </Modal>
    );
};

export default EscalationModal;



