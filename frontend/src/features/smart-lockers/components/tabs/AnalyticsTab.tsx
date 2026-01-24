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
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/10 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
              <i className="fas fa-chart-bar text-white text-lg" />
            </div>
            Locker Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalyticsItem
              icon="fa-clock"
              label="Average Occupancy"
              value={`${metrics?.averageOccupancyTime ?? 0} hours`}
              color="blue"
            />
            <AnalyticsItem
              icon="fa-battery-quarter"
              label="Battery Alerts"
              value={`${metrics?.batteryAlerts ?? 0} lockers`}
              color="amber"
            />
            <AnalyticsItem
              icon="fa-wifi"
              label="Signal Issues"
              value={`${metrics?.signalIssues ?? 0} lockers`}
              color="red"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnalyticsItem: React.FC<{ icon: string; label: string; value: string; color: 'blue' | 'emerald' | 'amber' | 'red' }> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: "from-blue-600 to-blue-800 shadow-blue-500/20",
    emerald: "from-emerald-600 to-emerald-800 shadow-emerald-500/20",
    amber: "from-amber-500 to-amber-700 shadow-amber-500/20",
    red: "from-red-500 to-red-700 shadow-red-500/20",
  };

  return (
    <div className="text-center group p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all shadow-inner">
      <div className={cn(
        "w-20 h-20 bg-gradient-to-br rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110",
        colorClasses[color]
      )}>
        <i className={cn("fas text-white text-3xl", icon)} />
      </div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-3">{label}</h3>
      <p className="text-lg font-black text-white uppercase tracking-widest">{value}</p>
    </div>
  );
};
