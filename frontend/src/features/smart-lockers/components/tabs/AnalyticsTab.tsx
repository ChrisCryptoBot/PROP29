/**
 * Smart Lockers - Analytics Tab
 * Displays locker analytics and metrics
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { cn } from '../../../../utils/cn';

export const AnalyticsTab: React.FC = () => {
  const { metrics, loading } = useSmartLockersContext();

  if (loading.metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading analytics">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Locker Analytics">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Locker performance and health metrics
          </p>
        </div>
      </div>

      {/* Compact metrics bar (gold standard — no KPI cards) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Locker analytics metrics">
        <span>Avg Occupancy <strong className="font-black text-white">{metrics?.averageOccupancyTime ?? 0}h</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Battery Alerts <strong className="font-black text-white">{metrics?.batteryAlerts ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Signal Issues <strong className="font-black text-white">{metrics?.signalIssues ?? 0}</strong></span>
      </div>
    </div>
  );
};

