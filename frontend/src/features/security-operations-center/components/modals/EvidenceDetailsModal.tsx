import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { cn } from '../../../../utils/cn';

type EvidenceStatus = 'pending' | 'reviewed' | 'archived';

export const EvidenceDetailsModal: React.FC = () => {
  const {
    selectedEvidence,
    setSelectedEvidence,
    showEvidenceModal,
    setShowEvidenceModal,
    updateEvidenceStatus,
    canManageEvidence,
    loading,
  } = useSecurityOperationsContext();

  const [editStatus, setEditStatus] = useState<EvidenceStatus>('pending');

  useEffect(() => {
    if (selectedEvidence) setEditStatus(selectedEvidence.status);
  }, [selectedEvidence]);

  const handleClose = () => {
    setShowEvidenceModal(false);
    setSelectedEvidence(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedEvidence || editStatus === selectedEvidence.status) return;
    await updateEvidenceStatus(selectedEvidence.id, editStatus);
    setSelectedEvidence({ ...selectedEvidence, status: editStatus });
  };

  if (!selectedEvidence) return null;

  return (
    <Modal
      isOpen={showEvidenceModal}
      onClose={handleClose}
      title="Evidence Details"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="subtle" onClick={handleClose} className="text-xs font-black uppercase tracking-widest">
            Close
          </Button>
          {canManageEvidence && (
            <Button
              variant="primary"
              className="text-xs font-black uppercase tracking-widest"
              onClick={handleUpdateStatus}
              disabled={loading.actions || editStatus === selectedEvidence.status}
            >
              {loading.actions ? 'Updating...' : 'Update status'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
          {selectedEvidence.title}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Camera</p>
              <p className="text-white font-bold">{selectedEvidence.camera}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Date</p>
                <p className="text-white font-mono text-sm">{selectedEvidence.date}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Time</p>
                <p className="text-white font-mono text-sm">{selectedEvidence.time}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">File size</p>
              <p className="text-white font-mono text-sm">{selectedEvidence.size}</p>
            </div>
            {selectedEvidence.incidentId && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Linked incident</p>
                <p className="text-blue-400 font-mono text-sm">{selectedEvidence.incidentId}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
              {canManageEvidence ? (
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as EvidenceStatus)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="pending" className="bg-[#1a1c1e] text-white">Pending</option>
                  <option value="reviewed" className="bg-[#1a1c1e] text-white">Reviewed</option>
                  <option value="archived" className="bg-[#1a1c1e] text-white">Archived</option>
                </select>
              ) : (
                <div
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-bold uppercase tracking-wider',
                    selectedEvidence.status === 'pending'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : selectedEvidence.status === 'reviewed'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-slate-400 bg-white/5 border-white/5'
                  )}
                >
                  {selectedEvidence.status}
                </div>
              )}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {selectedEvidence.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded uppercase tracking-widest"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Chain of custody</p>
          <div className="space-y-2">
            {selectedEvidence.chainOfCustody.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-1"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{entry.timestamp}</p>
                <p className="text-white font-bold">{entry.handler}</p>
                <p className="text-slate-400 text-sm">{entry.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
