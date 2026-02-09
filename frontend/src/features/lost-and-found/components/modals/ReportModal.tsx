/**
 * Report Modal
 * Export reports for Lost & Found items. Uses global Modal (UI gold standard).
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { LostFoundStatus } from '../../types/lost-and-found.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500 [&>option]:bg-slate-900';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const { exportReport, loading } = useLostFoundContext();
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [status, setStatus] = useState<LostFoundStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async () => {
    const filters = status !== 'all' ? { status } : undefined;
    const success = await exportReport(format, filters, startDate || undefined, endDate || undefined);
    if (success) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export report"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={loading.items}>
            {loading.items ? 'Exporting…' : 'Export'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv')}
            className={inputClass + ' appearance-none cursor-pointer'}
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LostFoundStatus | 'all')}
            className={inputClass + ' appearance-none cursor-pointer'}
          >
            <option value="all">All</option>
            <option value={LostFoundStatus.FOUND}>Found</option>
            <option value={LostFoundStatus.CLAIMED}>Claimed</option>
            <option value={LostFoundStatus.EXPIRED}>Expired</option>
            <option value={LostFoundStatus.DONATED}>Donated</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
