import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const AuditTab: React.FC = () => {
    const {
        auditLogs,
        filteredAuditLogs,
        paginatedAuditLogs,
        auditPage,
        setAuditPage,
        auditPageSize,
        setAuditPageSize,
        auditTotalPages,
        handleExportAuditLog,
        handleClearAuditLog,
        refreshData,
        showSuccess,
        auditDateRange,
        setAuditDateRange,
        auditCategory,
        setAuditCategory,
        auditSearchQuery,
        setAuditSearchQuery,
    } = useSystemAdminContext();

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
                    <h2 className="page-title">Audit logs</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Record of administrative actions and system events
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-white/5 hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={() => refreshData().then(() => showSuccess('Audit log refreshed')).catch(() => {})}
                    >
                        <i className="fas fa-sync-alt mr-2 text-slate-400" aria-hidden />
                        Sync Feed
                    </Button>
                    <Button
                        variant="outline"
                        className="border-white/5 hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={handleExportAuditLog}
                    >
                        <i className="fas fa-file-export mr-2 text-slate-400" aria-hidden />
                        Export Dataset
                    </Button>
                    <Button
                        variant="destructive"
                        className="px-6 font-black uppercase text-[10px] tracking-widest"
                        onClick={handleClearAuditLog}
                    >
                        <i className="fas fa-trash-alt mr-2" aria-hidden />
                        Clear history
                    </Button>
                </div>
            </div>

            {/* Filters & Search - Gold Standard */}
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Date range</label>
                        <select
                            value={auditDateRange}
                            onChange={(e) => setAuditDateRange(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-white text-sm font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                        >
                            <option value="24h" className="bg-slate-900">Last 24 hours</option>
                            <option value="7d" className="bg-slate-900">Last 7 days</option>
                            <option value="30d" className="bg-slate-900">Last 30 days</option>
                            <option value="90d" className="bg-slate-900">Last 90 days</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                        <select
                            value={auditCategory}
                            onChange={(e) => setAuditCategory(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-white text-sm font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-slate-900">All logs</option>
                            <option value="User Management" className="bg-slate-900">User management</option>
                            <option value="Role Management" className="bg-slate-900">Role management</option>
                            <option value="Property Management" className="bg-slate-900">Property management</option>
                            <option value="Integration" className="bg-slate-900">Integration</option>
                            <option value="System" className="bg-slate-900">System</option>
                            <option value="Security" className="bg-slate-900">Security</option>
                            <option value="Audit" className="bg-slate-900">Audit</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Search</label>
                        <SearchBar
                            value={auditSearchQuery}
                            onChange={setAuditSearchQuery}
                            placeholder="Search by user, action, or IP..."
                            className="bg-white/5 border border-white/5 rounded-md py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table - Gold Standard Card Pattern */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                            <i className="fas fa-clipboard-list text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-white">Audit Logs</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                {filteredAuditLogs.length === 0 ? (
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
                                    {paginatedAuditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500 font-mono tracking-tighter">
                                                {log.timestamp}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-black text-[10px]">
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
                                                    className="px-3 py-1 text-[9px] font-black uppercase tracking-widest"
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
                        {auditTotalPages > 1 && (
                            <div className="px-6 py-6 border-t border-white/5 bg-white/[0.01]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Log Retention: <span className="text-blue-400">90 DAYS</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Showing <span className="text-blue-400">{(auditPage - 1) * auditPageSize + 1}</span> to{' '}
                                            <span className="text-blue-400">{Math.min(auditPage * auditPageSize, filteredAuditLogs.length)}</span> of{' '}
                                            <span className="text-blue-400">{filteredAuditLogs.length}</span> entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="glass"
                                                size="sm"
                                                onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                                                disabled={auditPage === 1}
                                                className="text-[10px] font-black uppercase tracking-widest border-white/5 h-8 w-8 p-0"
                                                aria-label="Previous page"
                                            >
                                                <i className="fas fa-chevron-left text-[10px]" aria-hidden />
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, auditTotalPages) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (auditTotalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (auditPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (auditPage >= auditTotalPages - 2) {
                                                        pageNum = auditTotalPages - 4 + i;
                                                    } else {
                                                        pageNum = auditPage - 2 + i;
                                                    }
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={auditPage === pageNum ? 'primary' : 'glass'}
                                                            size="sm"
                                                            onClick={() => setAuditPage(pageNum)}
                                                            className="text-[10px] font-black uppercase tracking-widest min-w-[2rem] h-8"
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="glass"
                                                size="sm"
                                                onClick={() => setAuditPage(prev => Math.min(auditTotalPages, prev + 1))}
                                                disabled={auditPage === auditTotalPages}
                                                className="text-[10px] font-black uppercase tracking-widest border-white/5 h-8 w-8 p-0"
                                                aria-label="Next page"
                                            >
                                                <i className="fas fa-chevron-right text-[10px]" aria-hidden />
                                            </Button>
                                            <select
                                                value={auditPageSize}
                                                onChange={(e) => {
                                                    setAuditPageSize(Number(e.target.value));
                                                    setAuditPage(1);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest w-20 ml-2 bg-white/5 border border-white/5 rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                </CardContent>
            </Card>
        </div>
    );
};


