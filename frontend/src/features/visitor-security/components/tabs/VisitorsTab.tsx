/**
 * Visitors Tab
 * Main tab for visitor management with filtering and actions
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { VisitorListItem } from '../shared';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';

export const VisitorsTab: React.FC = React.memo(() => {
  const {
    filteredVisitors,
    filter,
    setFilter,
    loading,
    setSelectedVisitor,
    setShowRegisterModal,
    checkInVisitor,
    checkOutVisitor,
    setShowQRModal,
    setShowVisitorDetailsModal
  } = useVisitorContext();

  if (loading.visitors && filteredVisitors.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Loading visitors...</p>
      </div>
    );
  }

  return (
    <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
      <CardHeader className="bg-white/5 border-b border-white/5 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-users text-white text-sm" />
            </div>
            Visitor List
          </CardTitle>
          <Button
            onClick={() => setShowRegisterModal(true)}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-8 h-10 border-none shadow-lg shadow-blue-500/20"
          >
            <i className="fas fa-user-plus mr-2" />
            Add Visitor
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-6">
        {/* Expired Badge Alert Banner */}
        {filteredVisitors.filter(v => v.status === 'overdue').length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                <i className="fas fa-exclamation-triangle text-red-500 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">
                  Security Alert: Expired Badges
                </h3>
                <p className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                  {filteredVisitors.filter(v => v.status === 'overdue').length} Visitors have exceeded authorized duration
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilter('overdue')}
              className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[9px] h-8"
            >
              View Expired
            </Button>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', 'registered', 'checked_in', 'checked_out', 'overdue'].map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType as any)}
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                filter === filterType
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                  : "border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
              )}
            >
              {filterType === 'all' ? 'All Subjects' : filterType.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Visitors List */}
        {filteredVisitors.length === 0 ? (
          <EmptyState
            icon="fas fa-search"
            title="No Matching Records"
            description="No visitors match your current filter criteria."
            className="bg-black/20 border-dashed border-2 border-white/10"
            action={{
              label: "ADD VISITOR",
              onClick: () => setShowRegisterModal(true),
              variant: 'outline'
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredVisitors.map(visitor => (
              <VisitorListItem
                key={visitor.id}
                visitor={visitor}
                onSelect={(v) => {
                  setSelectedVisitor(v);
                  setShowVisitorDetailsModal(true);
                }}
                onCheckIn={checkInVisitor}
                onCheckOut={checkOutVisitor}
                onGenerateQR={(v) => {
                  setSelectedVisitor(v);
                  setShowQRModal(true);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

VisitorsTab.displayName = 'VisitorsTab';
