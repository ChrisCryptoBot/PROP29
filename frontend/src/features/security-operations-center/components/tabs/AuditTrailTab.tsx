/**
 * Audit Trail Tab
 * Displays audit log entries for security and compliance.
 * Loads from backend when available; falls back to local audit trail.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { Select } from '../../../../components/UI/Select';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { auditTrailService, AuditLogEntry } from '../../services/auditTrailService';
import * as securityOpsService from '../../services/securityOperationsCenterService';
import { cn } from '../../../../utils/cn';

function mapBackendEntryToLog(entry: { id?: string; timestamp?: string; userId?: string; action?: string; entity?: string; entityId?: string; changes?: unknown; metadata?: unknown }): AuditLogEntry {
  return {
    id: entry.id ?? '',
    timestamp: entry.timestamp ?? new Date().toISOString(),
    userId: entry.userId,
    action: entry.action ?? '',
    entity: (entry.entity as AuditLogEntry['entity']) ?? 'camera',
    entityId: entry.entityId ?? '',
    changes: entry.changes as Record<string, { from: unknown; to: unknown }> | undefined,
    metadata: entry.metadata as Record<string, unknown> | undefined,
  };
}

export const AuditTrailTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | AuditLogEntry['entity']>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await securityOpsService.getAuditTrail(undefined, undefined, 200, 0);
      if (response?.data?.length) {
        setLogs(response.data.map(mapBackendEntryToLog));
      } else {
        setLogs(auditTrailService.getLogs());
      }
    } catch {
      setLogs(auditTrailService.getLogs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (entityFilter !== 'all') {
      filtered = filtered.filter(log => log.entity === entityFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.entityId.toLowerCase().includes(searchLower) ||
        log.userId?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [logs, search, entityFilter, actionFilter]);

  const handleRefresh = () => {
    loadLogs();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'success' | 'warning' | 'destructive' => {
    if (action.includes('create') || action.includes('add')) return 'success';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    if (action.includes('update') || action.includes('change')) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6" role="main" aria-label="Audit Trail">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Audit Trail</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Security and compliance log
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="font-black uppercase tracking-widest text-[10px]"
          >
            <i className="fas fa-sync-alt mr-2" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            className="font-black uppercase tracking-widest text-[10px]"
          >
            <i className="fas fa-download mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-history text-white text-lg" />
            </div>
            Audit Log Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by action, entity ID, or user..."
              />
            </div>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="w-40"
            >
              <option value="all">All Entities</option>
              <option value="camera">Camera</option>
              <option value="recording">Recording</option>
              <option value="evidence">Evidence</option>
              <option value="settings">Settings</option>
            </Select>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="review">Review</option>
              <option value="archive">Archive</option>
            </Select>
          </div>

          {/* Log Entries */}
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                      {log.action}
                    </Badge>
                    <span className="text-sm font-black text-white uppercase">{log.entity}</span>
                    <span className="text-xs font-mono text-slate-400">{log.entityId}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                {log.userId && (
                  <p className="text-[10px] text-slate-400 font-mono mb-2">
                    User: {log.userId}
                  </p>
                )}
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-2 p-2 bg-black/40 rounded border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Changes:</p>
                    {Object.entries(log.changes).map(([key, change]) => (
                      <div key={key} className="text-[10px] font-mono text-slate-300">
                        <span className="text-slate-500">{key}:</span>{' '}
                        <span className="text-red-400">{JSON.stringify(change.from)}</span>
                        {' → '}
                        <span className="text-emerald-400">{JSON.stringify(change.to)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <EmptyState
              icon="fas fa-history"
              title="No audit log entries"
              description={search || entityFilter !== 'all' || actionFilter !== 'all' 
                ? "No entries match your current filters."
                : "No audit log entries found. Actions will be logged here."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
