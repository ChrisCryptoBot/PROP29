import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { cn } from '../../../../utils/cn';

const getStatusBadgeVariant = (isOnline: boolean): 'success' | 'secondary' => {
    return isOnline ? 'success' : 'secondary';
};

export const NewMessageModal: React.FC = () => {
    const {
        showNewMessage,
        setShowNewMessage,
        selectedRecipients,
        setSelectedRecipients,
        teamMembers,
        handleToggleRecipient,
        handleSendDirectMessage,
    } = useTeamChatContext();

    if (!showNewMessage) return null;

    return (
        <Modal
            isOpen={showNewMessage}
            onClose={() => setShowNewMessage(false)}
            title="Start Direct Message"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button
                        variant="subtle"
                        onClick={() => setShowNewMessage(false)}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendDirectMessage}
                        disabled={selectedRecipients.length === 0}
                        className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] px-6 shadow-none"
                    >
                        <i className="fas fa-paper-plane" aria-hidden />
                        <span>Send Message</span>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Selected Recipients Chip Cloud */}
                {selectedRecipients.length > 0 && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-md">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Active Targets ({selectedRecipients.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedRecipients.map(id => {
                                const member = teamMembers.find(m => m.id === id);
                                return member ? (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-white rounded-md text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <span>{member.name}</span>
                                        <button
                                            onClick={() => handleToggleRecipient(id)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            <i className="fas fa-times" />
                                        </button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* Team Members List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                            Operational Personnel
                        </h3>
                        <button
                            onClick={() => {
                                if (selectedRecipients.length === teamMembers.length) {
                                    setSelectedRecipients([]);
                                } else {
                                    setSelectedRecipients(teamMembers.map(m => m.id));
                                }
                            }}
                            className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                        >
                            {selectedRecipients.length === teamMembers.length ? 'Deselect All' : 'Select All Personnel'}
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {teamMembers.map(member => (
                            <label
                                key={member.id}
                                className={cn(
                                    "flex items-center gap-4 p-3 border rounded-md cursor-pointer transition-colors",
                                    selectedRecipients.includes(member.id)
                                        ? 'border-blue-500 bg-blue-600/10'
                                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                                )}
                            >
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={selectedRecipients.includes(member.id)}
                                        onChange={() => handleToggleRecipient(member.id)}
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        "w-5 h-5 border-2 rounded-md flex items-center justify-center transition-colors",
                                        selectedRecipients.includes(member.id)
                                            ? "bg-blue-600 border-blue-500"
                                            : "border-white/20 bg-black/20"
                                    )}>
                                        {selectedRecipients.includes(member.id) && (
                                            <i className="fas fa-check text-white text-[10px]" />
                                        )}
                                    </div>
                                </div>
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 bg-white/10 border border-white/5 rounded-md flex items-center justify-center text-white font-black text-xs uppercase">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div
                                        className={cn(
                                            "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900",
                                            member.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                                        )}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{member.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        {member.role}
                                    </p>
                                </div>
                                <Badge
                                    variant={getStatusBadgeVariant(member.isOnline)}
                                    className="text-[8px] shrink-0"
                                >
                                    {member.isOnline ? 'Online' : 'Offline'}
                                </Badge>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Initial Message Block */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Initial Message (Optional)
                    </label>
                    <textarea
                        placeholder="Enter preliminary data..."
                        rows={3}
                        className="w-full bg-black/40 border border-white/5 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none placeholder:text-slate-600"
                    />
                </div>
            </div>
        </Modal>
    );
};
