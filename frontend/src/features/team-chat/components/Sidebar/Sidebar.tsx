import React, { useState } from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Button } from '../../../../components/UI/Button';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { cn } from '../../../../utils/cn';

export const Sidebar: React.FC = () => {
    const {
        showChannels,
        setShowChannels,
        userStatus,
        setUserStatus,
        searchTerm,
        setSearchTerm,
        activeChannel,
        setActiveChannel,
        channels,
        teamMembers,
        setShowNewMessage,
        setSelectedRecipients
    } = useTeamChatContext();

    const [listFilter, setListFilter] = useState<'all' | 'channels' | 'personnel'>('all');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return '#22c55e';
            case 'busy': return '#ef4444';
            case 'patrol': return '#3b82f6';
            case 'on-duty': return '#f59e0b';
            case 'off-duty': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'priority': return <i className="fas fa-exclamation-triangle text-red-500 text-sm" />;
            case 'location': return <i className="fas fa-map-marker-alt text-blue-500 text-sm" />;
            case 'archive': return <i className="fas fa-archive text-purple-500 text-sm" />;
            case 'notifications': return <i className="fas fa-bell text-yellow-500 text-sm" />;
            default: return <i className="fas fa-hashtag text-gray-500 text-sm" />;
        }
    };

    return (
        <div className={cn(
            "flex flex-col transition-all duration-300 border-r border-white/10 bg-black/40 backdrop-blur-xl",
            showChannels ? 'w-80' : 'w-16'
        )}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setShowChannels(true)}>
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <i className="fas fa-comments text-white text-xl" />
                        </div>
                        {showChannels && (
                            <div className="overflow-hidden">
                                <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">Security Comm</h1>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest italic opacity-70">Communication List</p>
                            </div>
                        )}
                    </div>
                    {showChannels && (
                        <button
                            onClick={() => setShowChannels(false)}
                            className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <i className="fas fa-chevron-left" />
                        </button>
                    )}
                </div>
            </div>

            {showChannels && (
                <>
                    {/* User Status Selector */}
                    <div className="p-4 border-b border-white/10 bg-black/20">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3 ml-1">Duty Status</p>
                        <div className="flex flex-wrap gap-1.5 px-1">
                            {(['available', 'busy', 'patrol', 'on-duty', 'off-duty'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setUserStatus(status)}
                                    className={cn(
                                        "font-black uppercase tracking-widest text-[8px] px-2.5 py-1.5 rounded transition-all border",
                                        userStatus === status
                                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                            : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {status.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & New Message */}
                    <div className="p-4 space-y-3 bg-white/5 border-b border-white/10">
                        <SearchBar
                            placeholder="SEARCH MESSAGES..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                            className="bg-black/40 border-white/10"
                        />
                        <Button
                            variant="primary"
                            className="w-full flex items-center justify-center space-x-2 font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-blue-500/20"
                            onClick={() => {
                                setShowNewMessage(true);
                                setSelectedRecipients([]);
                            }}
                        >
                            <i className="fas fa-comment-dots text-sm" />
                            <span>New Message</span>
                        </Button>
                    </div>

                    {/* List Categorization (SOC Style) */}
                    <div className="flex p-2 bg-black/40 border-b border-white/10">
                        {(['all', 'channels', 'personnel'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setListFilter(filter)}
                                className={cn(
                                    "flex-1 font-black uppercase tracking-widest text-[9px] py-2 transition-all border-b-2",
                                    listFilter === filter
                                        ? "text-white border-blue-500 bg-white/5"
                                        : "text-white/30 border-transparent hover:text-white/60"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic List Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Channels Section */}
                        {(listFilter === 'all' || listFilter === 'channels') && (
                            <div className="py-4">
                                <div className="px-4 flex items-center justify-between mb-2">
                                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Operational Channels</h3>
                                    <span className="text-[9px] font-black text-blue-500/60">{channels.length}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {channels.map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 text-left transition-all border-l-2",
                                                activeChannel === channel.id
                                                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-inner'
                                                    : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white'
                                            )}
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded flex items-center justify-center bg-white/5",
                                                    activeChannel === channel.id && "bg-blue-500/20"
                                                )}>
                                                    {getChannelIcon(channel.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-bold truncate">{channel.name}</span>
                                                        {channel.encrypted && <i className="fas fa-shield-alt text-blue-500 text-[10px] shrink-0" />}
                                                    </div>
                                                    <p className="text-[10px] text-white/30 truncate uppercase tracking-tighter">{channel.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-1 ml-2 shrink-0">
                                                {channel.unread > 0 && (
                                                    <span className="bg-blue-600 text-white text-[9px] font-black rounded px-1.5 py-0.5 shadow-lg shadow-blue-500/20">
                                                        {channel.unread}
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-black text-white/20">{channel.members}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Personnel Section */}
                        {(listFilter === 'all' || listFilter === 'personnel') && (
                            <div className="py-2">
                                <div className="px-4 flex items-center justify-between mb-2 mt-2">
                                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Active Personnel</h3>
                                    <span className="text-[9px] font-black text-green-500/60">{teamMembers.filter(m => m.isOnline).length}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {teamMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-all group"
                                            onClick={() => {
                                                setSelectedRecipients([member.id]);
                                                setShowNewMessage(true);
                                            }}
                                        >
                                            <div className="relative">
                                                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white/80 text-xs font-black group-hover:border-blue-500/50 transition-colors">
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div
                                                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                                                    style={{ backgroundColor: getStatusColor(member.status) }}
                                                ></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white/80 truncate">{member.name}</p>
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-[10px] text-white/30 uppercase tracking-tighter font-medium">{member.role}</p>
                                                    {member.location && (
                                                        <span className="text-[9px] font-bold text-blue-500 truncate mt-0.5 tracking-widest">• {member.location}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

