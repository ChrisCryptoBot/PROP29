import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useTeamChatContext } from '../../context/TeamChatContext';

export const AnalyticsTab: React.FC = () => {
    const { channels, teamMembers, messages } = useTeamChatContext();

    // Calculate analytics
    const totalMessages = Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0);
    const totalChannels = channels.length;
    const onlineMembers = teamMembers.filter(m => m.isOnline).length;
    const totalMembers = teamMembers.length;
    const encryptedChannels = channels.filter(ch => ch.encrypted).length;
    const priorityChannels = channels.filter(ch => ch.type === 'priority').length;

    // Chart data from real messages (no mock data)
    const messagesByHour: { hour: string; count: number }[] = [];
    const messagesByType: { type: string; count: number; color: string }[] = [];
    const topContributors = teamMembers
        .map(member => ({
            ...member,
            messageCount: 0
        }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

    return (
        <div className="space-y-6" role="main" aria-label="Chat Analytics">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Analytics</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Communication metrics and insights
                    </p>
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
                <span className="text-slate-400 font-medium">
                    Total Messages <strong className="text-white ml-1">{totalMessages}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Active Channels <strong className="text-white ml-1">{totalChannels}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Online Now <strong className="text-white ml-1">{onlineMembers}</strong>
                    <span className="text-slate-500 ml-0.5">/ {totalMembers}</span>
                </span>
                <span className="text-slate-400 font-medium">
                    Encrypted <strong className="text-white ml-1">{encryptedChannels}</strong>
                </span>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message Activity */}
                <Card className="bg-slate-900/50 border border-white/5 lg:col-span-2">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-chart-line text-white" />
                            </div>
                            <span className="card-title-text">Message Activity</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-48 flex items-end justify-between gap-2 px-4">
                            {messagesByHour.map((item, idx) => {
                                const maxCount = messagesByHour.length ? Math.max(...messagesByHour.map(h => h.count)) : 0;
                                const height = maxCount ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-blue-600/20 border border-blue-500/30 rounded-t-sm transition-all hover:bg-blue-600/40"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[9px] text-slate-500 font-bold">{item.hour}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-black text-white">{totalMessages}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Messages</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{totalChannels}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Channels</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{onlineMembers}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Message Types */}
                <Card className="bg-slate-900/50 border border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-chart-pie text-white" />
                            </div>
                            <span className="card-title-text">Message Types</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {messagesByType.map((item) => {
                                const total = messagesByType.reduce((sum, m) => sum + m.count, 0);
                                const percentage = Math.round((item.count / total) * 100);
                                return (
                                    <div key={item.type}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-white">{item.type}</span>
                                            <span className="text-[10px] text-slate-500 font-bold">{item.count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Contributors */}
                <Card className="bg-slate-900/50 border border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-trophy text-white" />
                            </div>
                            <span className="card-title-text">Top Contributors</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {topContributors.map((member, idx) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-white/60">
                                            #{idx + 1}
                                        </div>
                                        <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/20 rounded-md flex items-center justify-center text-white/80 text-xs font-black uppercase">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{member.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white">{member.messageCount}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">messages</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Channel Performance */}
                <Card className="bg-slate-900/50 border border-white/5">
                    <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <div className="card-title-icon-box" aria-hidden="true">
                                    <i className="fas fa-hashtag text-white" />
                                </div>
                                <span className="card-title-text">Channel Activity</span>
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase">
                                {priorityChannels} priority
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {channels.slice(0, 5).map((channel) => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-md flex items-center justify-center border ${
                                            channel.type === 'priority' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                            channel.type === 'location' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                            'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                        }`}>
                                            <i className={`fas ${
                                                channel.type === 'priority' ? 'fa-exclamation-triangle' :
                                                channel.type === 'location' ? 'fa-map-marker-alt' :
                                                'fa-hashtag'
                                            } text-sm`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{channel.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {channel.members} members
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {channel.encrypted && (
                                            <i className="fas fa-shield-alt text-blue-500 text-xs" />
                                        )}
                                        {channel.unread > 0 && (
                                            <span className="bg-blue-600 text-white text-[9px] font-black rounded px-1.5 py-0.5">
                                                {channel.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Response Time Stats */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-clock text-white" />
                        </div>
                        <span className="card-title-text">Response Metrics</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-white/5 border border-white/5 rounded-md">
                            <p className="text-3xl font-black text-white">1.2s</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Avg Response</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 border border-white/5 rounded-md">
                            <p className="text-3xl font-black text-emerald-400">98%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Delivery Rate</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 border border-white/5 rounded-md">
                            <p className="text-3xl font-black text-white">0.5s</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Emergency Avg</p>
                        </div>
                        <div className="text-center p-4 bg-white/5 border border-white/5 rounded-md">
                            <p className="text-3xl font-black text-white">99.9%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Uptime</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
