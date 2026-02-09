/**
 * Smart Lockers - Overview Tab
 * Displays key metrics, recent locker activity, and quick actions
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { getStatusBadgeClass, getSizeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const OverviewTab: React.FC = () => {
  const { lockers, metrics, setSelectedLocker } = useSmartLockersContext();

  return (
    <div className="space-y-6">
      {/* Compact metrics bar (gold standard — no KPI cards at top) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Smart Lockers key metrics">
        <span>Total <strong className="font-black text-white">{metrics?.totalLockers ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Available <strong className="font-black text-white">{metrics?.availableLockers ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Occupied <strong className="font-black text-white">{metrics?.occupiedLockers ?? 0}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Utilization <strong className="font-black text-white">{metrics?.utilizationRate ?? 0}%</strong></span>
      </div>

      {/* Recent Lockers */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-history text-white text-lg" />
            </div>
            Recent Locker Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {lockers.slice(0, 3).map((locker) => (
              <div
                key={locker.id}
                className="flex items-center justify-between p-4 border border-white/5 bg-white/5 rounded-md hover:bg-white/10 cursor-pointer"
                onClick={() => setSelectedLocker(locker)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                    <i className="fas fa-lock text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{locker.lockerNumber}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)]">{formatLocationDisplay(locker.location) || '—'}</p>
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
