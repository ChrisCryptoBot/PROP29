/**
 * ManagementTab Component
 * 
 * Tab for managing handovers with emergency actions and handover list.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { HandoverCard } from '../HandoverCard';
import { cn } from '../../../../utils/cn';
import { useHandovers } from '../../hooks';
import { SHIFT_TYPE_LABELS, HANDOVER_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import { showSuccess } from '../../../../utils/toast';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import type { Handover } from '../../types';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { getShiftTypeBadge, getStatusBadgeClass, getPriorityBadgeClass } from '../../utils/badgeHelpers';

export interface ManagementTabProps {
  onHandoverSelect: (handover: Handover) => void;
  onCreateClick: () => void;
}

/**
 * Management Tab Component
 */
export const ManagementTab: React.FC<ManagementTabProps> = ({
  onHandoverSelect,
  onCreateClick,
}) => {
  const { handovers, completeHandover, loading } = useHandovers();

  const [filter, setFilter] = React.useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');

  const filteredHandovers = React.useMemo(() => {
    if (filter === 'all') return handovers;
    return handovers.filter((h) => h.status === filter);
  }, [handovers, filter]);

  const handleCompleteHandover = async (id: string) => {
    try {
      await completeHandover(id);
      showSuccess('Handover completed successfully');
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:handleCompleteHandover');
    }
  };

  const handleOverdueAlert = () => {
    setFilter('overdue');
    const count = handovers.filter((h) => h.status === 'overdue').length;
    if (count > 0) showSuccess(`Showing ${count} overdue handover(s)`);
  };

  const handleIncompleteAlert = () => {
    setFilter('in_progress');
    const count = handovers.filter((h) => h.status === 'in_progress').length;
    if (count > 0) showSuccess(`Showing ${count} in-progress handover(s)`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Management</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Create and manage handovers
          </p>
        </div>
      </div>

      {/* Compact metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Handover metrics">
        <span>Total <strong className="font-black text-white">{handovers.length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Pending <strong className="font-black text-white">{handovers.filter((h) => h.status === 'pending').length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>In Progress <strong className="font-black text-white">{handovers.filter((h) => h.status === 'in_progress').length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Completed <strong className="font-black text-white">{handovers.filter((h) => h.status === 'completed').length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Overdue <strong className="font-black text-white">{handovers.filter((h) => h.status === 'overdue').length}</strong></span>
      </div>

      {/* Emergency Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={handleOverdueAlert}
          variant="outline"
          className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 w-full justify-start h-auto py-4"
        >
          <div className="text-left">
            <div className="flex items-center mb-1">
              <i className="fas fa-exclamation-triangle mr-2" />
              <span className="font-black uppercase tracking-wider text-xs">Overdue Alert</span>
            </div>
            <p className="text-[10px] text-[color:var(--text-sub)]">Check overdue handovers</p>
          </div>
        </Button>
        <Button
          onClick={handleIncompleteAlert}
          variant="outline"
          className="bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 w-full justify-start h-auto py-4"
        >
          <div className="text-left">
            <div className="flex items-center mb-1">
              <i className="fas fa-clock mr-2" />
              <span className="font-black uppercase tracking-wider text-xs">Incomplete Alert</span>
            </div>
            <p className="text-[10px] text-[color:var(--text-sub)]">Monitor active handovers</p>
          </div>
        </Button>
      </div>

      {/* Handover List */}
      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-list text-white" />
              </div>
              <span className="card-title-text">Recent Handovers</span>
            </CardTitle>
            <Button
              variant="primary"
              onClick={onCreateClick}
              className="font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-none"
            >
              <i className="fas fa-plus mr-2" />
              Create Handover
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {['all', 'pending', 'in_progress', 'completed', 'overdue'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status as any)}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-colors rounded-md border",
                  filter === status
                    ? "bg-white/10 text-white border-white/20"
                    : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {status === 'all' ? 'All Handovers' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <div className="space-y-4 pt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-label="Loading handovers">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading handovers...</p>
              </div>
            ) : filteredHandovers.length === 0 ? (
              <EmptyState
                icon="fas fa-clipboard-list"
                title="No Handovers Found"
                description="Create your first handover to get started with digital monitoring."
                className="bg-black/20 border-dashed border-2 border-white/5"
                action={{
                  label: "CREATE HANDOVER",
                  onClick: onCreateClick,
                  variant: "outline"
                }}
              />
            ) : (
              filteredHandovers.map((handover) => (
                <HandoverCard
                  key={handover.id}
                  handover={handover}
                  onSelect={onHandoverSelect}
                  onComplete={handleCompleteHandover}
                  getShiftTypeBadge={getShiftTypeBadge}
                  getStatusBadgeClass={getStatusBadgeClass}
                  getPriorityBadgeClass={getPriorityBadgeClass}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



