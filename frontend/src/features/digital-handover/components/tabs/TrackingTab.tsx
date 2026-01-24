/**
 * TrackingTab Component
 * 
 * Tab for tracking active handovers, shift timeline, and staff availability.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useHandoverContext } from '../../context/HandoverContext';
import type { Handover } from '../../types';
import { EmptyState } from '../../../../components/UI/EmptyState';

export interface TrackingTabProps {
  onHandoverSelect: (handover: Handover) => void;
}

/**
 * Tracking Tab Component
 */
export const TrackingTab: React.FC<TrackingTabProps> = ({
  onHandoverSelect,
}) => {
  const { handovers, loading, staff, timeline } = useHandoverContext();

  const inProgressHandovers = React.useMemo(
    () => handovers.filter((h) => h.status === 'in_progress'),
    [handovers]
  );

  return (
    <div className="space-y-6">
      {/* Active Handovers */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-clock text-white text-sm" />
              </div>
              Active Handovers
            </div>
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              {inProgressHandovers.length} In Progress
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4 pt-6">
            {loading.handovers ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
                <p className="text-[color:var(--text-sub)]">Loading active handovers...</p>
              </div>
            ) : inProgressHandovers.length === 0 ? (
              <EmptyState
                icon="fas fa-clock"
                title="No Active Handovers"
                description="There are currently no handovers in progress."
                className="bg-black/20 border-dashed border-2 border-white/10"
              />
            ) : (
              inProgressHandovers.map((handover) => {
                const completedCount = handover.checklistItems.filter((i) => i.status === 'completed').length;
                const totalCount = handover.checklistItems.length;
                const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div key={handover.id} className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg hover:bg-blue-500/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-[color:var(--text-main)] text-sm tracking-tight uppercase">
                          {handover.handoverFrom} → {handover.handoverTo}
                        </h4>
                        <p className="text-xs text-[color:var(--text-sub)] mt-1">
                          {handover.shiftType.charAt(0).toUpperCase() + handover.shiftType.slice(1)} Shift |{' '}
                          {handover.startTime} - {handover.endTime}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded text-amber-400 bg-amber-500/10 border border-amber-500/20 animate-pulse">
                        In Progress
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-[color:var(--text-sub)]">
                        <span className="uppercase tracking-wider opacity-70">Checklist Progress</span>
                        <span>
                          {completedCount} / {totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 uppercase tracking-widest text-[10px] font-black transition-all duration-300"
                      onClick={() => onHandoverSelect(handover)}
                    >
                      <i className="fas fa-eye mr-2" />
                      View Details
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shift Timeline */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-calendar-alt text-white text-sm" />
            </div>
            Today's Shift Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="space-y-4">
            {timeline.length === 0 ? (
              <EmptyState
                icon="fas fa-calendar-alt"
                title="No Shift Data"
                description="No shifts configured for today."
                className="bg-black/20 border-dashed border-2 border-white/10"
              />
            ) : (
              timeline.map((shift, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    shift.status === 'completed'
                      ? 'border-green-500/20 bg-green-500/5'
                      : shift.status === 'in_progress'
                        ? 'border-blue-500/20 bg-blue-500/5'
                        : 'border-[color:var(--border-subtle)]/30 bg-[color:var(--background-base)]/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[color:var(--text-main)] text-sm uppercase tracking-tight">{shift.shift}</h4>
                      <p className="text-xs text-[color:var(--text-sub)] mt-1 font-mono opacity-80">{shift.time}</p>
                      <p className="text-xs text-[color:var(--text-sub)] mt-1">{shift.staff}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border',
                        shift.status === 'completed'
                          ? 'text-green-400 bg-green-500/10 border-green-500/20'
                          : shift.status === 'in_progress'
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse'
                            : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      )}
                    >
                      {shift.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Availability */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-users text-white text-sm" />
            </div>
            Staff Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff.length === 0 ? (
              <div className="col-span-3">
                <p className="text-[color:var(--text-sub)] text-center py-4">No staff members found.</p>
              </div>
            ) : (
              staff.map((person) => (
                <div key={person.id} className="p-4 border border-[color:var(--border-subtle)]/20 rounded-lg bg-[color:var(--background-base)]/30 hover:bg-[color:var(--background-base)]/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[color:var(--surface-highlight)] rounded-full flex items-center justify-center border border-white/5">
                        <i className="fas fa-user text-[color:var(--text-sub)] text-xs" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[color:var(--text-main)] text-xs uppercase tracking-tight">{person.name}</h4>
                        <p className="text-[10px] text-[color:var(--text-sub)] uppercase tracking-wider opacity-70">{person.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border',
                        person.status === 'Available'
                          ? 'text-green-400 bg-green-500/10 border-green-500/20'
                          : person.status === 'On Duty'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      )}
                    >
                      {person.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
