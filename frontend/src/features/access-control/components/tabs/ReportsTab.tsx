/**
 * Reports Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 2994-3214)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 */

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { cn } from '../../../../utils/cn';

/**
 * Reports Tab Component
 * Displays various report cards and export options
 */
const ReportsTabComponent: React.FC = () => {
  const {
    metrics,
    exportAccessReport,
  } = useAccessControlContext();

  // Default metrics to prevent null reference errors
  const defaultMetrics = {
    totalAccessPoints: 0,
    activeAccessPoints: 0,
    totalUsers: 0,
    activeUsers: 0,
    todayAccessEvents: 0,
    deniedAccessEvents: 0,
    averageResponseTime: '0ms',
    systemUptime: '0d 0h',
    topAccessPoints: [],
    recentAlerts: 0,
    securityScore: 0,
    lastSecurityScan: new Date().toISOString(),
  };

  const reportMetrics = metrics || defaultMetrics;
  const [activeReport, setActiveReport] = useState<{
    title: string;
    description: string;
    subtitle: string;
  } | null>(null);

  const handleExportReport = useCallback((format: 'pdf' | 'csv') => {
    exportAccessReport(format);
  }, [exportAccessReport]);

  const openReport = useCallback((title: string, description: string, subtitle: string) => {
    setActiveReport({ title, description, subtitle });
  }, []);

  return (
    <div className="space-y-6" role="main" aria-label="Reports & Analytics">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Reports & Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            View system usage and security reports
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="glass"
            onClick={() => handleExportReport('pdf')}
            className="h-10 text-[10px] font-black uppercase tracking-widest px-8 shadow-none"
            aria-label="Export PDF report"
          >
            <i className="fas fa-file-invoice mr-2" aria-hidden="true" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            className="h-10 text-[10px] font-black uppercase tracking-widest px-8 border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] shadow-none"
            onClick={() => handleExportReport('csv')}
            aria-label="Export CSV report"
          >
            <i className="fas fa-table mr-2" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="group" aria-label="Report cards">
        {/* Access Pattern Report */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 hover:border-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('Usage Analysis', 'Access frequency, trends, and access point utilization.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('Usage Analysis', 'Access frequency, trends, and access point utilization.', 'Last generated: Today');
            }
          }}
          aria-label="Access Pattern Report - Peak times, location trends, and usage patterns"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-chart-line text-white text-base" />
              </div>
              Usage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center border border-white/5 shadow-2xl">
                <i className="fas fa-chart-line text-white text-lg" />
              </div>
              <Badge variant="info" className="text-[8px] font-black uppercase tracking-widest">REAL-TIME</Badge>
            </div>
            <h3 className="text-xl font-black text-[color:var(--text-main)] uppercase tracking-tight mb-2">Usage Analysis</h3>
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest leading-relaxed">
              Analyze access frequency, trends, and access point usage.
            </p>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Last Generated: Today</span>
              <i className="fas fa-chevron-right text-[color:var(--text-sub)] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* Failed Access Report */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('Incident Analytics', 'Denied access attempts and alert activity.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('Incident Analytics', 'Denied access attempts and alert activity.', 'Last generated: Today');
            }
          }}
          aria-label="Failed Access Report - Denied attempts, security violations, and alerts"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-biohazard text-white text-base" />
              </div>
              Incident Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mb-6 opacity-60">Denied access attempts and alerts.</p>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                <span className="text-[9px] font-black text-red-300 uppercase tracking-widest opacity-50">Access Denied:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Today's denied access events: ${reportMetrics.deniedAccessEvents}`}>
                  {reportMetrics.deniedAccessEvents} EVENTS
                </span>
              </div>
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Weekly Total:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label="This week's denied access events: 142">142 EVENTS</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-red-500/50 uppercase tracking-[0.2em] text-center">VIEW REPORT</p>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Report */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('Compliance Report', 'Audit logs and compliance metrics.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('Compliance Report', 'Audit logs and compliance metrics.', 'Last generated: Today');
            }
          }}
          aria-label="Compliance Audit Report - Security audit trail and compliance reports"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-shield-alt text-white text-base" />
              </div>
              Compliance Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mb-6 opacity-60">Security audit logs and metrics.</p>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Last Audit:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Last audit date: ${new Date(reportMetrics.lastSecurityScan).toLocaleDateString()}`}>
                  {new Date(reportMetrics.lastSecurityScan).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-50">Security Score:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Security score: ${reportMetrics.securityScore}%`}>
                  {reportMetrics.securityScore}%
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-[0.2em] text-center">VIEW REPORT</p>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Report */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('User Activity', 'Individual access history and patterns.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('User Activity', 'Individual access history and patterns.', 'Last generated: Today');
            }
          }}
          aria-label="User Activity Report - Individual user access history and patterns"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-fingerprint text-white text-base" />
              </div>
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mb-6 opacity-60">Individual user access history and locations.</p>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Total Users:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Total users: ${reportMetrics.totalUsers}`}>
                  {reportMetrics.totalUsers} USERS
                </span>
              </div>
              <div className="flex justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest opacity-50">Active Users:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Active users today: ${reportMetrics.activeUsers}`}>
                  {reportMetrics.activeUsers} ACTIVE
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-indigo-500/50 uppercase tracking-[0.2em] text-center">VIEW REPORT</p>
            </div>
          </CardContent>
        </Card>

        {/* Access Point Utilization */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('Device Usage', 'Access point utilization and performance metrics.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('Device Usage', 'Access point utilization and performance metrics.', 'Last generated: Today');
            }
          }}
          aria-label="Device Usage Report - Usage statistics and performance metrics"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-server text-white text-base" />
              </div>
              Device Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mb-6 opacity-60">Access point usage statistics.</p>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Access Points:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Total access points: ${reportMetrics.totalAccessPoints}`}>
                  {reportMetrics.totalAccessPoints} POINTS
                </span>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-50">Avg Load:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label="Utilization rate: 87%">87%</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-blue-500/50 uppercase tracking-[0.2em] text-center">VIEW REPORT</p>
            </div>
          </CardContent>
        </Card>

        {/* Time-Based Analysis */}
        <Card
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/5 transition-all duration-300 cursor-pointer group"
          onClick={() => openReport('Activity Timeline', 'Chronological security and access activity.', 'Last generated: Today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReport('Activity Timeline', 'Chronological security and access activity.', 'Last generated: Today');
            }
          }}
          aria-label="Activity Timeline Report - Hourly, daily, and weekly access trends"
        >
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-timeline text-white text-base" />
              </div>
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mb-6 opacity-60">Timeline analysis of access events.</p>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Peak Interval:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label="Peak day: Friday">FRIDAY</span>
              </div>
              <div className="flex justify-between p-3 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Daily Avg:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight" aria-label={`Average daily access events: ${reportMetrics.todayAccessEvents}`}>
                  {reportMetrics.todayAccessEvents} EVENTS
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-[color:var(--text-sub)]/50 uppercase tracking-[0.2em] text-center">VIEW TIMELINE</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={Boolean(activeReport)}
        onClose={() => setActiveReport(null)}
        title={activeReport?.title || 'Report'}
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setActiveReport(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleExportReport('pdf')} className="shadow-none hover:shadow-none">
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => handleExportReport('csv')}>
              Download CSV
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-[0.2em] italic opacity-70">
            {activeReport?.subtitle || 'Report summary'}
          </p>
          <p className="text-sm text-[color:var(--text-main)]">
            {activeReport?.description || 'Detailed report output.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Total Access Points</p>
              <p className="text-xl font-black text-white">{reportMetrics.totalAccessPoints}</p>
            </div>
            <div className="p-4 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Active Users</p>
              <p className="text-xl font-black text-white">{reportMetrics.activeUsers}</p>
            </div>
            <div className="p-4 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Today Events</p>
              <p className="text-xl font-black text-white">{reportMetrics.todayAccessEvents}</p>
            </div>
            <div className="p-4 bg-[color:var(--console-dark)]/20 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Denied Events</p>
              <p className="text-xl font-black text-white">{reportMetrics.deniedAccessEvents}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * ReportsTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 */
export const ReportsTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="Reports Tab">
      <ReportsTabComponent />
    </ErrorBoundary>
  );
});

ReportsTab.displayName = 'ReportsTab';
export default ReportsTab;
