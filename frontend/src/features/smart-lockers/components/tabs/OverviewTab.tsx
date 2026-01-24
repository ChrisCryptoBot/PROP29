/**
 * Smart Lockers - Overview Tab
 * Displays key metrics, recent locker activity, and quick actions
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { getStatusBadgeClass, getSizeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const OverviewTab: React.FC = () => {
  const { lockers, metrics, setSelectedLocker } = useSmartLockersContext();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Smart Lockers key metrics">
        <MetricCard
          icon="fa-lock"
          label="Total Lockers"
          value={metrics?.totalLockers ?? 0}
          badge="Total"
          color="blue"
        />
        <MetricCard
          icon="fa-check-circle"
          label="Available Lockers"
          value={metrics?.availableLockers ?? 0}
          badge="Available"
          color="emerald"
        />
        <MetricCard
          icon="fa-user"
          label="Occupied Lockers"
          value={metrics?.occupiedLockers ?? 0}
          badge="Occupied"
          color="blue"
        />
        <MetricCard
          icon="fa-chart-line"
          label="Utilization Rate"
          value={`${metrics?.utilizationRate ?? 0}%`}
          badge="Rate"
          color="blue"
        />
      </div>

      {/* Recent Lockers */}
      <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
              <i className="fas fa-history text-white text-lg" />
            </div>
            Recent Locker Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lockers.slice(0, 3).map((locker) => (
              <div
                key={locker.id}
                className="flex items-center justify-between p-4 border border-white/5 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group/item shadow-inner cursor-pointer"
                onClick={() => setSelectedLocker(locker)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover/item:scale-105 transition-transform">
                    <i className="fas fa-lock text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{locker.lockerNumber}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">{locker.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn("px-2.5 py-1 text-xs font-black rounded uppercase tracking-widest", getStatusBadgeClass(locker.status))}>
                    {locker.status}
                  </span>
                  <span className={cn("px-2.5 py-1 text-xs font-black rounded uppercase tracking-widest", getSizeBadgeClass(locker.size))}>
                    {locker.size}
                  </span>
                </div>
              </div>
            ))}
            {lockers.length === 0 && (
              <EmptyState
                icon="fas fa-search"
                title="No activity detected"
                description="Locker registry is currently empty. System awaiting initial asset deployment or user interaction."
              />
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string | number; badge: string; color: 'blue' | 'emerald' | 'red' }> = ({ icon, label, value, badge, color }) => (
  <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] shadow-sm group transition-all duration-300">
    <CardContent className="pt-6 px-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mt-2 transition-transform duration-300 group-hover:scale-110",
          color === 'blue' ? "bg-gradient-to-br from-blue-600 to-blue-800" : (color === 'emerald' ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-700")
        )}>
          <i className={cn("fas text-white text-xl", icon)} />
        </div>
        <span className={cn(
          "px-2.5 py-1 text-xs font-black rounded uppercase tracking-widest",
          color === 'blue' ? "text-blue-300 bg-blue-500/20 border border-blue-500/30" : (color === 'emerald' ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/30" : "text-red-300 bg-red-500/20 border border-red-500/30")
        )}>
          {badge}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{value}</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">{label}</p>
      </div>
    </CardContent>
  </Card>
);

