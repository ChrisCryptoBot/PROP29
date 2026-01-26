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
    <div className="space-y-6">
      {/* Page Header - Gold Standard Structure */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visitor Security</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Visitor Registry & Management</h2>
          <p className="text-[11px] text-slate-400">
            Complete visitor lifecycle management with mobile agent integration and hardware verification.
          </p>
        </div>
        
        <Button
          onClick={() => setShowRegisterModal(true)}
          variant="glass"
          className="text-xs font-black uppercase tracking-widest px-6"
        >
          <i className="fas fa-user-plus mr-2" />
          Register Visitor
        </Button>
      </div>

      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center mr-3">
                <i className="fas fa-users text-white text-sm" />
              </div>
              Active Visitor Registry
            </CardTitle>
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
                  : "border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
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
            className="bg-black/20 border-dashed border-2 border-white/5"
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
    </div>
  );
});

VisitorsTab.displayName = 'VisitorsTab';
