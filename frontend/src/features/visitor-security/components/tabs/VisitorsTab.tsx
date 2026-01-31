/**
 * Visitors Tab
 * Main tab for visitor management with filtering and actions
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Paginated visitors
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredVisitors.slice(start, end);
  }, [filteredVisitors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  if (loading.visitors && filteredVisitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="status" aria-label="Loading visitors">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading visitors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Gold Standard */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Visitor Registry & Management</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
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
          {['all', 'registered', 'checked_in', 'checked_out', 'overdue', 'cancelled'].map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType as any)}
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                filter === filterType
                  ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/30 border-none"
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
          <>
            <div className="space-y-3">
              {paginatedVisitors.map(visitor => (
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

            {/* Pagination Controls */}
            {filteredVisitors.length > 0 && totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                  Showing <span className="text-[color:var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="text-[color:var(--text-main)]">{Math.min(currentPage * itemsPerPage, filteredVisitors.length)}</span> of{' '}
                  <span className="text-[color:var(--text-main)]">{filteredVisitors.length}</span> visitors
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-[10px] font-black uppercase tracking-widest border-white/5"
                  >
                    <i className="fas fa-chevron-left mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'glass'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="text-[10px] font-black uppercase tracking-widest min-w-[2rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-[10px] font-black uppercase tracking-widest border-white/5"
                  >
                    Next
                    <i className="fas fa-chevron-right ml-1" />
                  </Button>
                  <Select
                    id="items-per-page"
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest w-20 ml-2"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  </div>
  );
});

VisitorsTab.displayName = 'VisitorsTab';
