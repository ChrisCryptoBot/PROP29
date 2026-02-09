/**
 * Metrics Overview Component
 * Renders a compact metrics bar (gold standard — no KPI card grid)
 */

import React from 'react';
import type { PatrolMetrics } from '../../types';

interface MetricsOverviewProps {
  metrics: PatrolMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]"
      role="group"
      aria-label="Patrol metrics"
    >
      <span>Active Patrols <strong className="font-black text-white">{metrics.activePatrols}</strong></span>
      <span className="text-white/30" aria-hidden>|</span>
      <span>On Duty <strong className="font-black text-white">{metrics.onDutyOfficers}</strong><span className="text-white/50">/ {metrics.totalOfficers || 0}</span></span>
      <span className="text-white/30" aria-hidden>|</span>
      <span>Active Routes <strong className="font-black text-white">{metrics.activeRoutes}</strong></span>
      <span className="text-white/30" aria-hidden>|</span>
      <span>Completion <strong className="font-black text-white">{metrics.checkpointCompletionRate ?? 0}%</strong></span>
    </div>
  );
};
