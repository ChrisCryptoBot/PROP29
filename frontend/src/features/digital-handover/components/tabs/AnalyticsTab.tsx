/**
 * AnalyticsTab Component
 * 
 * Tab for displaying handover analytics, metrics, and reports.
 * Uses the useHandoverMetrics hook for data management.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useHandoverMetrics } from '../../hooks';
import { showSuccess } from '../../../../utils/toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface AnalyticsTabProps {
  // Add any additional props if needed
}

/**
 * Analytics Tab Component
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const { metrics, loading, refreshMetrics } = useHandoverMetrics();

  const handleExportReport = (reportType: string) => {
    showSuccess(`${reportType} report generated`);
    // TODO: Implement export functionality
  };

  // Prepare chart data from metrics
  const monthlyHandoverData = React.useMemo(() => {
    return metrics?.monthlyHandovers || [
      { month: 'Jan', count: 0 },
      { month: 'Feb', count: 0 },
      { month: 'Mar', count: 0 },
      { month: 'Apr', count: 0 },
      { month: 'May', count: 0 },
      { month: 'Jun', count: 0 },
    ];
  }, [metrics]);

  const shiftData = React.useMemo(() => {
    return [
      { shift: 'Morning', count: metrics?.handoversByShift?.morning || 0 },
      { shift: 'Afternoon', count: metrics?.handoversByShift?.afternoon || 0 },
      { shift: 'Night', count: metrics?.handoversByShift?.night || 0 },
    ];
  }, [metrics]);

  const statusDistributionData = React.useMemo(() => {
    return [
      { name: 'Completed', value: metrics?.handoversByStatus?.completed || 0 },
      { name: 'In Progress', value: metrics?.handoversByStatus?.in_progress || 0 },
      { name: 'Pending', value: metrics?.handoversByStatus?.pending || 0 },
      { name: 'Overdue', value: metrics?.handoversByStatus?.overdue || 0 },
    ];
  }, [metrics]);

  const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444'];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-slate-400 mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20 shadow-lg">
                <i className="fas fa-percentage text-green-400 text-sm" />
              </div>
              <div className="px-2 py-1 rounded text-xs font-black uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20">
                <i className="fas fa-arrow-up mr-1" />5%
              </div>
            </div>
            <h3 className="text-3xl font-black text-[color:var(--text-main)] mb-1">{metrics?.completionRate || 0}%</h3>
            <p className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold opacity-70">Completion Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl md:col-span-3">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-star text-white text-sm" />
              </div>
              Performance & Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[color:var(--text-sub)] font-bold uppercase tracking-wider">On-Time Completion</span>
                  <span className="text-sm font-black text-[color:var(--text-main)]">{metrics?.completionRate || 0}%</span>
                </div>
                <div className="w-full bg-[color:var(--background-base)] rounded-full h-3 border border-[color:var(--border-subtle)]/30 p-[2px]">
                  <div
                    className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-1000 ease-out"
                    style={{ width: `${metrics?.completionRate || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[color:var(--text-sub)] font-bold uppercase tracking-wider">Checklist Adherence</span>
                  <span className="text-sm font-black text-[color:var(--text-main)]">{metrics?.checklistCompletionRate || 0}%</span>
                </div>
                <div className="w-full bg-[color:var(--background-base)] rounded-full h-3 border border-[color:var(--border-subtle)]/30 p-[2px]">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out delay-100"
                    style={{ width: `${metrics?.checklistCompletionRate || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[color:var(--text-sub)] font-bold uppercase tracking-wider">Quality Rating</span>
                  <span className="text-sm font-black text-[color:var(--text-main)]">
                    {metrics?.averageRating ? ((metrics.averageRating / 5) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[color:var(--background-base)] rounded-full h-3 border border-[color:var(--border-subtle)]/30 p-[2px]">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-all duration-1000 ease-out delay-200"
                    style={{ width: `${metrics?.averageRating ? (metrics.averageRating / 5) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-[color:var(--border-subtle)]/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-4 rounded-xl bg-[color:var(--background-base)]/30 border border-[color:var(--border-subtle)]/30">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-3">
                      <i className="fas fa-clipboard-list text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[color:var(--text-main)]">{metrics?.totalHandovers || 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-sub)] font-bold opacity-70">Total Handovers</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 rounded-xl bg-[color:var(--background-base)]/30 border border-[color:var(--border-subtle)]/30">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mr-3">
                      <i className="fas fa-clock text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[color:var(--text-main)]">{metrics?.averageCompletionTime || '0m'}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-sub)] font-bold opacity-70">Avg Completion Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-file-export text-white text-sm" />
            </div>
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 h-14"
              onClick={() => handleExportReport('Daily')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-pdf mb-1 text-lg" />
                <span className="text-xs uppercase tracking-wider font-bold">Daily Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 h-14"
              onClick={() => handleExportReport('Weekly')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-excel mb-1 text-lg" />
                <span className="text-xs uppercase tracking-wider font-bold">Weekly Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 h-14"
              onClick={() => handleExportReport('Monthly')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-file-alt mb-1 text-lg" />
                <span className="text-xs uppercase tracking-wider font-bold">Monthly Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20 h-14"
              onClick={() => handleExportReport('Custom')}
            >
              <div className="flex flex-col items-center">
                <i className="fas fa-cog mb-1 text-lg" />
                <span className="text-xs uppercase tracking-wider font-bold">Custom Report</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};




