import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';

export const EvidenceManagementTab: React.FC = () => {
  const {
    evidence,
    loading,
    setSelectedEvidence,
    setShowEvidenceModal,
    markEvidenceReviewed,
    archiveEvidence,
    canManageEvidence,
  } = useSecurityOperationsContext();
  const { trackAction } = useSecurityOperationsTelemetry();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'archived'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const list = Array.isArray(evidence) ? evidence : [];

  const filteredEvidence = useMemo(() => {
    if (statusFilter === 'all') return list;
    return list.filter((item) => item.status === statusFilter);
  }, [list, statusFilter]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredEvidence.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredEvidence.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;
    
    trackAction('bulk_review', 'evidence', { count: selectedItems.size });
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedItems).map(itemId => markEvidenceReviewed(itemId));
      await Promise.allSettled(promises);
      setSelectedItems(new Set());
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedItems.size === 0) return;
    
    trackAction('bulk_archive', 'evidence', { count: selectedItems.size });
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedItems).map(itemId => archiveEvidence(itemId));
      await Promise.allSettled(promises);
      setSelectedItems(new Set());
    } finally {
      setBulkActionLoading(false);
    }
  };

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === filteredEvidence.length && filteredEvidence.length > 0;

  if (loading.evidence && list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading evidence" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Evidence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Evidence Management">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Evidence Management</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Review and archive video and photo evidence
          </p>
        </div>
      </div>
      <section aria-labelledby="soc-evidence-heading">
        <h3 id="soc-evidence-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4">Evidence Registry</h3>
        <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'reviewed', 'archived'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'glass' : 'outline'}
                  className={cn(
                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all shadow-none",
                    statusFilter === status
                      ? "bg-white/10 border-white/20 text-white"
                      : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => {
                    setStatusFilter(status);
                    trackAction('filter_change', 'evidence', { filter: status });
                  }}
                >
                  {status === 'all' ? 'All Evidence' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Bulk Operations */}
            {filteredEvidence.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                {/* Select All Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    {selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}
                  </span>
                </label>

                {/* Bulk Action Buttons */}
                {selectedCount > 0 && canManageEvidence && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkActionLoading}
                      onClick={handleBulkApprove}
                      className="font-black uppercase tracking-widest text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <i className="fas fa-check-double mr-2" />
                      Approve ({selectedCount})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkActionLoading}
                      onClick={handleBulkArchive}
                      className="font-black uppercase tracking-widest text-[10px] border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
                    >
                      <i className="fas fa-archive mr-2" />
                      Archive ({selectedCount})
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvidence.map((item) => {
              const isSelected = selectedItems.has(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group rounded-md overflow-hidden relative",
                    isSelected ? "border-blue-500/40 bg-blue-500/5" : "border-white/5"
                  )}
                  onClick={() => {
                    setSelectedEvidence(item);
                    setShowEvidenceModal(true);
                  }}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e as any)}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h4 className="card-title-text">{item.title}</h4>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border",
                        item.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          item.status === 'reviewed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            'text-slate-400 bg-white/5 border-white/5'
                      )}>
                        {item.status}
                      </span>
                    </div>

                  <div className="space-y-2 bg-black/40 p-3 rounded-md border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Camera:</span>
                      <span className="text-white">{item.camera}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Date/Time:</span>
                      <span className="text-white">{item.date} · {item.time}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">File Size:</span>
                      <span className="text-white">{item.size}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      disabled={!canManageEvidence || item.status !== 'pending'}
                      onClick={(event) => {
                        event.stopPropagation();
                        markEvidenceReviewed(item.id);
                      }}
                    >
                      <i className="fas fa-check-double mr-2 text-emerald-500" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      disabled={!canManageEvidence || item.status === 'archived'}
                      onClick={(event) => {
                        event.stopPropagation();
                        archiveEvidence(item.id);
                      }}
                    >
                      <i className="fas fa-archive mr-2 text-slate-500" />
                      Archive
                    </Button>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs" />
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
            
            {/* Bulk Operation Progress */}
            {bulkActionLoading && (
              <div className="col-span-full bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-blue-400 font-bold text-sm">Processing bulk operations...</span>
              </div>
            )}

            {filteredEvidence.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-folder-open"
                  title="No evidence items found"
                  description="Adjust filters to locate archived records or pending files."
                />
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

