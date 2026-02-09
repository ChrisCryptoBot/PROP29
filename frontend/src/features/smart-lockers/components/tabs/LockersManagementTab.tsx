/**
 * Smart Lockers - Lockers Management Tab
 * Displays all lockers with management options
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { getStatusBadgeClass, getSizeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const LockersManagementTab: React.FC = () => {
  const { lockers, loading, setSelectedLocker } = useSmartLockersContext();

  if (loading.lockers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-list text-white text-lg" />
            </div>
            All Smart Lockers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {lockers.map((locker) => (
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1">
                      Battery: {locker.batteryLevel ?? 'N/A'}% | Signal: {locker.signalStrength ?? 'N/A'}%
                    </p>
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
                icon="fas fa-lock"
                title="No lockers found"
                description="Registry offline. No hardware assets detected in the current sector. Deploy a new locker to begin management."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

