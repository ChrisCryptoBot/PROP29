import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
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

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'archived'>('all');

  const list = Array.isArray(evidence) ? evidence : [];

  const filteredEvidence = useMemo(() => {
    if (statusFilter === 'all') return list;
    return list.filter((item) => item.status === statusFilter);
  }, [list, statusFilter]);

  if (loading.evidence && list.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Evidence Management">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Evidence Management</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic opacity-70 text-slate-400">
            Review and archive video and photo evidence
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-folder-open text-white text-lg" />
            </div>
            Evidence Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {(['all', 'pending', 'reviewed', 'archived'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'glass' : 'outline'}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all shadow-none",
                  statusFilter === status
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All Evidence' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvidence.map((item) => (
              <Card
                key={item.id}
                className="bg-white/5 border border-white/5 shadow-inner hover:bg-white/[0.08] transition-all cursor-pointer group rounded-2xl overflow-hidden"
                onClick={() => {
                  setSelectedEvidence(item);
                  setShowEvidenceModal(true);
                }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border",
                      item.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        item.status === 'reviewed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          'text-slate-400 bg-white/5 border-white/10'
                    )}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
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
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
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
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
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
                </CardContent>
              </Card>
            ))}
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
        </CardContent>
      </Card>
    </div>
  );
};

