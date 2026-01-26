import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';

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
            title="START DIRECT MESSAGE"
            size="lg"
        >
            <div className="space-y-6">
                {/* Selected Recipients Chip Cloud */}
                {selectedRecipients.length > 0 && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl shadow-inner">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                            ACTIVE TARGETS ({selectedRecipients.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedRecipients.map(id => {
                                const member = teamMembers.find(m => m.id === id);
                                return member ? (
                                    <span
                                        key={id}
                                        className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-white rounded text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <span>{member.name}</span>
                                        <button
                                            onClick={() => handleToggleRecipient(id)}
                                            className="hover:text-red-500 transition-colors"
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
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">OPERATIONAL PERSONNEL</h3>
                        <button
                            onClick={() => {
                                if (selectedRecipients.length === teamMembers.length) {
                                    setSelectedRecipients([]);
                                } else {
                                    setSelectedRecipients(teamMembers.map(m => m.id));
                                }
                            }}
                            className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                        >
                            {selectedRecipients.length === teamMembers.length ? 'DESELECT ALL' : 'SELECT ALL PERSONNEL'}
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {teamMembers.map(member => (
                            <label
                                key={member.id}
                                className={cn(
                                    "flex items-center space-x-4 p-3 border rounded-xl cursor-pointer transition-all",
                                    selectedRecipients.includes(member.id)
                                        ? 'border-blue-500 bg-blue-600/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/5'
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
                                        "w-5 h-5 border-2 rounded flex items-center justify-center transition-all",
                                        selectedRecipients.includes(member.id)
                                            ? "bg-blue-600 border-blue-500"
                                            : "border-white/20 bg-black/20"
                                    )}>
                                        {selectedRecipients.includes(member.id) && <i className="fas fa-check text-white text-[10px]" />}
                                    </div>
                                </div>
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 bg-white/10 border border-white/5 rounded flex items-center justify-center text-white font-black text-xs uppercase">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div
                                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                                        style={{ backgroundColor: member.isOnline ? '#22c55e' : '#6b7280' }}
                                    ></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{member.name}</p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{member.role}</p>
                                </div>
                                {!member.isOnline && (
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter shrink-0">OFFLINE</span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Initial Message Block */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
                        HANDOVER BRIEFING (OPTIONAL)
                    </label>
                    <textarea
                        placeholder="ENTER PRELIMINARY DATA..."
                        rows={3}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none placeholder:text-white/10"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
                    <Button
                        variant="outline"
                        onClick={() => setShowNewMessage(false)}
                        className="font-black uppercase tracking-widest text-[10px] border-white/5 text-white/40 hover:text-white hover:bg-white/5"
                    >
                        CANCEL
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendDirectMessage}
                        disabled={selectedRecipients.length === 0}
                        className="flex items-center space-x-2 font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-blue-500/20"
                    >
                        <i className="fas fa-paper-plane" />
                        <span>SEND MESSAGE</span>
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

