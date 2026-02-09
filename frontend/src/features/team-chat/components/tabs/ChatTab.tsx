import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Sidebar } from '../Sidebar/Sidebar';
import { ChatArea } from '../ChatArea/ChatArea';

export const ChatTab: React.FC = () => {
    const {
        channels,
        teamMembers,
        currentChannelMessages,
    } = useTeamChatContext();

    // Calculate metrics
    const totalChannels = channels.length;
    const onlineMembers = teamMembers.filter(m => m.isOnline).length;
    const totalMembers = teamMembers.length;
    const unreadMessages = channels.reduce((sum, ch) => sum + ch.unread, 0);
    const encryptedChannels = channels.filter(ch => ch.encrypted).length;

    return (
        <div className="space-y-6" role="main" aria-label="Team Chat Messages">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Messages</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Real-time secure communication
                    </p>
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
                <span className="text-slate-400 font-medium">
                    Channels <strong className="text-white ml-1">{totalChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Online <strong className="text-white ml-1">{onlineMembers}</strong>
                    <span className="text-slate-500 ml-0.5">/ {totalMembers}</span>
                </span>
                <span className="text-slate-400 font-medium">
                    Unread <strong className="text-white ml-1">{unreadMessages}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Encrypted <strong className="text-white ml-1">{encryptedChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Messages Today <strong className="text-white ml-1">{currentChannelMessages.length}</strong>
                </span>
            </div>

            {/* Chat Interface */}
            <div className="h-[65vh] flex overflow-hidden bg-slate-900/50 rounded-md border border-white/5 relative">
                <Sidebar />
                <ChatArea />
            </div>
        </div>
    );
};
