/**
 * AnalyticsTab Component
 * 
 * Tab for displaying handover analytics, metrics, and reports.
 * Uses the useHandoverMetrics hook for data management.
 */

import React, { useCallback } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useHandoverMetrics } from '../../hooks';
import { showSuccess, showError } from '../../../../utils/toast';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import type { HandoverMetrics } from '../../types';

export interface AnalyticsTabProps {
  // Add any additional props if needed
}

function escapeCsvField(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildMetricsCsv(metrics: HandoverMetrics, reportType: string, generatedAt: string): string {
  const rows: string[] = [];
  rows.push('Report Type,Generated At,Total Handovers,Completed,Pending,Overdue,Completion %,Checklist %,Avg Rating,Avg Completion Time');
  rows.push([
    reportType,
    generatedAt,
    metrics.totalHandovers,
    metrics.completedHandovers,
    metrics.pendingHandovers,
    metrics.overdueHandovers,
    metrics.completionRate,
    metrics.checklistCompletionRate,
    metrics.averageRating,
    escapeCsvField(metrics.averageCompletionTime),
  ].join(','));

  if (metrics.monthlyHandovers?.length) {
    rows.push('');
    rows.push('Month,Count');
    metrics.monthlyHandovers.forEach((m) => {
      rows.push([escapeCsvField(m.month), m.count].join(','));
    });
  }
  return rows.join('\n');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Analytics Tab Component
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const { metrics, loading } = useHandoverMetrics();

  const handleExportReport = useCallback((reportType: string) => {
    if (!metrics) {
      showError('No metrics available to export');
      return;
    }
    try {
      const generatedAt = new Date().toISOString();
      const csv = buildMetricsCsv(metrics, reportType, generatedAt);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `HandoverReport-${reportType.replace(/\s+/g, '')}-${dateStr}.csv`;
      downloadBlob(blob, filename);
      showSuccess(`${reportType} report exported`);
    } catch (err) {
      ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), 'DigitalHandover:exportReport');
      showError('Export failed');
    }
  }, [metrics]);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading analytics">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  const completionRate = metrics?.completionRate || 0;
  const checklistRate = metrics?.checklistCompletionRate || 0;
  const qualityPct = metrics?.averageRating ? Math.round((metrics.averageRating / 5) * 100) : 0;

  return (
    <div className="space-y-6" role="main" aria-label="Handover Analytics">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Handover metrics, performance, and reports
          </p>
        </div>
      </div>

      {/* Compact metrics bar (gold standard — no KPI cards) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Analytics metrics">
        <span>Completion <strong className="font-black text-white">{completionRate}%</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Checklist <strong className="font-black text-white">{checklistRate}%</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Quality <strong className="font-black text-white">{qualityPct}%</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Total <strong className="font-black text-white">{metrics?.totalHandovers || 0}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Avg Time <strong className="font-black text-white">{metrics?.averageCompletionTime || '0m'}</strong></span>
      </div>

      {/* Performance bars */}
      <section aria-labelledby="performance-heading">
        <h3 id="performance-heading" className="card-title-text mb-4 flex items-center">
          <div className="card-title-icon-box" aria-hidden="true">
            <i className="fas fa-star text-white" />
          </div>
          Performance & Quality
        </h3>
        <div className="rounded-md border border-white/5 p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">On-Time Completion</span>
              <span className="text-sm font-black text-white">{completionRate}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checklist Adherence</span>
              <span className="text-sm font-black text-white">{checklistRate}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${checklistRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quality Rating</span>
              <span className="text-sm font-black text-white">{qualityPct}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${qualityPct}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Export Reports */}
      <section aria-labelledby="export-reports-heading">
        <h3 id="export-reports-heading" className="card-title-text mb-4 flex items-center">
          <div className="card-title-icon-box" aria-hidden="true">
            <i className="fas fa-file-export text-white" />
          </div>
          Export Reports
        </h3>
        <div className="rounded-md border border-white/5 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 h-14"
              onClick={() => handleExportReport('Daily')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-pdf mb-1" />
                <span className="text-xs uppercase tracking-wider font-bold">Daily Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 h-14"
              onClick={() => handleExportReport('Weekly')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-excel mb-1" />
                <span className="text-xs uppercase tracking-wider font-bold">Weekly Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 h-14"
              onClick={() => handleExportReport('Monthly')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-alt mb-1" />
                <span className="text-xs uppercase tracking-wider font-bold">Monthly Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20 h-14"
              onClick={() => handleExportReport('Custom')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-cog mb-1" />
                <span className="text-xs uppercase tracking-wider font-bold">Custom Report</span>
              </div>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};




