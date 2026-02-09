import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { showSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const ChannelsTab: React.FC = () => {
    const { channels, setActiveChannel, teamMembers } = useTeamChatContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'priority' | 'location' | 'archive'>('all');

    const filteredChannels = channels.filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            channel.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || channel.type === filterType;
        return matchesSearch && matchesType;
    });

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'priority': return 'fa-exclamation-triangle';
            case 'location': return 'fa-map-marker-alt';
            case 'archive': return 'fa-archive';
            case 'notifications': return 'fa-bell';
            default: return 'fa-hashtag';
        }
    };

    const getChannelTypeColor = (type: string) => {
        switch (type) {
            case 'priority': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'location': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'archive': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'notifications': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    // Calculate metrics
    const totalChannels = channels.length;
    const priorityChannels = channels.filter(ch => ch.type === 'priority').length;
    const encryptedChannels = channels.filter(ch => ch.encrypted).length;
    const totalUnread = channels.reduce((sum, ch) => sum + ch.unread, 0);

    return (
        <div className="space-y-6" role="main" aria-label="Channel Management">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Channels</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Manage communication channels
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => showSuccess('Channel creation coming soon...')}
                    className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-none"
                >
                    <i className="fas fa-plus mr-2" aria-hidden />
                    New Channel
                </Button>
            </div>

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
                <span className="text-slate-400 font-medium">
                    Total Channels <strong className="text-white ml-1">{totalChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Priority <strong className="text-white ml-1">{priorityChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Encrypted <strong className="text-white ml-1">{encryptedChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Unread Messages <strong className="text-white ml-1">{totalUnread}</strong>
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <SearchBar
                    placeholder="Search channels..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="w-64"
                />
                <div className="flex items-center gap-2">
                    {(['all', 'priority', 'location', 'archive'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors",
                                filterType === type
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChannels.length > 0 ? (
                    filteredChannels.map((channel) => (
                        <Card
                            key={channel.id}
                            className="bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer group"
                            onClick={() => setActiveChannel(channel.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center border",
                                            getChannelTypeColor(channel.type)
                                        )}>
                                            <i className={cn("fas", getChannelIcon(channel.type))} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                                                {channel.name}
                                            </h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {channel.type}
                                            </p>
                                        </div>
                                    </div>
                                    {channel.unread > 0 && (
                                        <span className="bg-blue-600 text-white text-[9px] font-black rounded px-1.5 py-0.5">
                                            {channel.unread}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                                    {channel.description}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-1">
                                            <i className="fas fa-users" />
                                            {channel.members}
                                        </span>
                                        {channel.encrypted && (
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <i className="fas fa-shield-alt" />
                                                Encrypted
                                            </span>
                                        )}
                                    </div>
                                    <Badge
                                        variant={channel.priority === 'critical' ? 'destructive' :
                                                channel.priority === 'high' ? 'warning' : 'secondary'}
                                    >
                                        {channel.priority}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full">
                        <EmptyState
                            icon="fas fa-hashtag"
                            title="No channels found"
                            description={searchTerm ? `No channels match "${searchTerm}"` : "Create your first channel to get started"}
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => showSuccess('Channel creation coming soon...')}
                                    className="text-[10px] font-black uppercase tracking-widest"
                                >
                                    <i className="fas fa-plus mr-2" />
                                    Create Channel
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Team Members Section */}
            <Card className="bg-slate-900/50 border border-white/5 mt-8">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-users text-white" />
                            </div>
                            <span className="card-title-text">Team Members</span>
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full uppercase">
                            {teamMembers.filter(m => m.isOnline).length} online
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {teamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-slate-800 border border-white/5 rounded-md flex items-center justify-center text-white/80 text-xs font-black uppercase">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div
                                        className={cn(
                                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
                                            member.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                                        )}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{member.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold truncate">
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
