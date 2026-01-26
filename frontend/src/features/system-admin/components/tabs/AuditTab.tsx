import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const AuditTab: React.FC = () => {
    const { auditLogs, handleExportAuditLog, showSuccess } = useSystemAdminContext();
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success': return 'success';
            case 'failed':
            case 'error': return 'destructive';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-8">
            {/* Audit Log Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">Audit Logs</h3>
                    <p className="text-slate-400 mt-1 font-medium tracking-wide">Record of administrative actions and system events</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="glass"
                        className="border-white/5 hover:bg-white/10 shadow-xl font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={() => showSuccess('Refreshing audit logs')}
                    >
                        <i className="fas fa-sync-alt mr-2 opacity-70"></i>
                        Sync Feed
                    </Button>
                    <Button
                        variant="glass"
                        className="border-white/5 hover:bg-white/10 shadow-xl font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={handleExportAuditLog}
                    >
                        <i className="fas fa-file-export mr-2 text-blue-400 opacity-70"></i>
                        Export Dataset
                    </Button>
                    <Button
                        variant="destructive"
                        className="shadow-lg shadow-red-500/20 px-6 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => showSuccess('Clearing logs (Admin required)')}
                    >
                        <i className="fas fa-trash-alt mr-2"></i>
                        Clear History
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="glass-card p-6 border-blue-500/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Date Range</label>
                        <div className="relative">
                            <i className="fas fa-history absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                            <select className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs">
                                <option className="bg-slate-900">Last 24 Hours</option>
                                <option className="bg-slate-900">Last 7 Days</option>
                                <option className="bg-slate-900">Last 30 Days</option>
                                <option className="bg-slate-900">Custom Range</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                <i className="fas fa-chevron-down text-[10px]"></i>
                            </div>
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Category</label>
                        <div className="relative">
                            <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                            <select className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs">
                                <option className="bg-slate-900">All Logs</option>
                                <option className="bg-slate-900">Authentication</option>
                                <option className="bg-slate-900">System</option>
                                <option className="bg-slate-900">User Actions</option>
                                <option className="bg-slate-900">Security Events</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                <i className="fas fa-chevron-down text-[10px]"></i>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2 relative self-end group">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search Logs (User, IP, Hash)..."
                            className="bg-white/5 border-white/5 rounded-xl py-3 pl-11 shadow-inner focus:bg-white/10"
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-400 transition-colors"></i>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card overflow-hidden border-white/5 shadow-2xl">
                {auditLogs.length === 0 ? (
                    <EmptyState
                        icon="fas fa-clipboard-list"
                        title="No Audit Logs"
                        description="Audit history is currently empty. System event logs will populate here once administrative activity is detected."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Type</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500 font-mono tracking-tighter">
                                                {log.timestamp}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-black text-[10px] shadow-inner group-hover:scale-110 transition-transform">
                                                        {log.user.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{log.user}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-black text-slate-300 uppercase tracking-wider">{log.eventType}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 group-hover:text-slate-400">{log.action}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <Badge
                                                    variant={getStatusBadgeVariant(log.status)}
                                                    className="px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-white/5 shadow-sm"
                                                >
                                                    {log.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500 font-mono tracking-widest group-hover:text-blue-400 transition-colors">
                                                {log.ipAddress}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-6 border-t border-white/5 bg-white/[0.01]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Log Retention: <span className="text-blue-400">90 DAYS</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Page 1/1</span>
                                    <div className="flex bg-white/5 rounded-lg border border-white/5 p-1">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 disabled:opacity-20" disabled>
                                            <i className="fas fa-chevron-left text-[10px]"></i>
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10 disabled:opacity-20" disabled>
                                            <i className="fas fa-chevron-right text-[10px]"></i>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


