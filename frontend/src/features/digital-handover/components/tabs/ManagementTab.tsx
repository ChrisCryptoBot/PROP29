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
import type { Handover } from '../../types';
import { EmptyState } from '../../../../components/UI/EmptyState';

export interface ManagementTabProps {
  onHandoverSelect: (handover: Handover) => void;
  onCreateClick: () => void;
}

/**
 * Shift type badge helper
 */
const getShiftTypeBadge = (shiftType: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    morning: { label: 'Morning', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    afternoon: { label: 'Afternoon', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    night: { label: 'Night', className: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  };

  const badge = badges[shiftType] || badges.morning;
  return (
    <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border', badge.className)}>
      {badge.label}
    </span>
  );
};

/**
 * Status badge class helper
 */
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'in_progress':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'pending':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'overdue':
      return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Priority badge class helper
 */
const getPriorityBadgeClass = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    case 'high':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'low':
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

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
      console.error('Failed to complete handover:', error);
    }
  };

  const handleOverdueAlert = () => {
    const overdueHandovers = handovers.filter((h) => h.status === 'overdue');
    showSuccess(`${overdueHandovers.length} handovers are overdue`);
  };

  const handleIncompleteAlert = () => {
    const incompleteHandovers = handovers.filter((h) => h.status === 'in_progress');
    showSuccess(`${incompleteHandovers.length} handovers are incomplete`);
  };

  return (
    <div className="space-y-6">
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
            <p className="text-[10px] opacity-70">Check overdue handovers</p>
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
            <p className="text-[10px] opacity-70">Monitor active handovers</p>
          </div>
        </Button>
      </div>

      {/* Handover List */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-list text-white text-sm" />
              </div>
              Recent Handovers
            </CardTitle>
            <Button
              variant="primary"
              onClick={onCreateClick}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-[10px] px-8 h-10 border-none"
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
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                  filter === status
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                    : "border-[color:var(--border-subtle)]/50 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-[color:var(--text-main)]"
                )}
              >
                {status === 'all' ? 'All Handovers' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <div className="space-y-4 pt-6">
            {loading ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
                <p className="text-[color:var(--text-sub)]">Loading handovers...</p>
              </div>
            ) : filteredHandovers.length === 0 ? (
              <EmptyState
                icon="fas fa-clipboard-list"
                title="No Handovers Found"
                description="Create your first handover to get started with digital monitoring."
                className="bg-black/20 border-dashed border-2 border-white/10"
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



