import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError } from '../../../../utils/toast';
import { incidentService } from '../../services/IncidentService';
import { cn } from '../../../../utils/cn';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const propertyId = localStorage.getItem('propertyId') || '';
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomRange, setShowCustomRange] = useState(false);

    const downloadReport = async (label: string, format: 'pdf' | 'csv', startDate: Date, endDate: Date) => {
        if (!propertyId) {
            dismissLoadingAndShowError(showLoading('Preparing report...'), 'Property selection is required.');
            return;
        }
        // Date validation
        if (startDate > endDate) {
            showError('Start date must be before end date.');
            return;
        }
        const toastId = showLoading(`Generating ${format.toUpperCase()} report...`);
        try {
            const blob = await incidentService.exportReport({
                format,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                filters: { property_id: propertyId }
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'csv' ? 'csv' : 'pdf';
            link.download = `incident-report-${label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${extension}`;
            link.click();
            window.URL.revokeObjectURL(url);
            dismissLoadingAndShowSuccess(toastId, `${format.toUpperCase()} report downloaded.`);
            onClose();
        } catch (error) {
            dismissLoadingAndShowError(toastId, `Failed to generate ${format} report.`);
        }
    };

    const handleCustomDownload = () => {
        if (!customStartDate || !customEndDate) {
            showError('Please select both start and end dates.');
            return;
        }
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        if (start > end) {
            showError('Start date must be before end date.');
            return;
        }
        downloadReport('custom', 'pdf', start, end);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Report"
            size="lg"
            footer={(
                <Button
                    variant="subtle"
                    onClick={onClose}
                    className="text-[9px] font-black uppercase tracking-widest"
                >
                    Cancel
                </Button>
            )}
        >
            <div className="space-y-4">
                <div className="mb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Export Format</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const start = showCustomRange && customStartDate ? new Date(customStartDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                                const end = showCustomRange && customEndDate ? new Date(customEndDate) : new Date();
                                downloadReport(showCustomRange ? 'custom' : 'monthly', 'pdf', start, end);
                            }}
                            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                            <i className="fas fa-file-pdf mr-2" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                const start = showCustomRange && customStartDate ? new Date(customStartDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                                const end = showCustomRange && customEndDate ? new Date(customEndDate) : new Date();
                                downloadReport(showCustomRange ? 'custom' : 'monthly', 'csv', start, end);
                            }}
                            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                            <i className="fas fa-file-csv mr-2" />
                            CSV
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        onClick={() => downloadReport('daily', 'pdf', new Date(Date.now() - 24 * 60 * 60 * 1000), new Date())}
                        className="h-24 flex-col text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                        <i className="fas fa-calendar-day text-2xl mb-3" />
                        Daily Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => downloadReport('weekly', 'pdf', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())}
                        className="h-24 flex-col text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                        <i className="fas fa-calendar-week text-2xl mb-3" />
                        Weekly Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => downloadReport('monthly', 'pdf', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())}
                        className="h-24 flex-col text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                        <i className="fas fa-calendar-alt text-2xl mb-3" />
                        Monthly Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowCustomRange(!showCustomRange)}
                        className={cn(
                            "h-24 flex-col text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white",
                            showCustomRange && "bg-white/10 border-white/20"
                        )}
                    >
                        <i className="fas fa-cog text-2xl mb-3" />
                        Custom Range
                    </Button>
                </div>
                {showCustomRange && (
                    <div className="space-y-4 p-4 bg-white/5 border border-white/5 rounded-lg">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Custom Date Range</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCustomDownload}
                                disabled={!customStartDate || !customEndDate}
                                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <i className="fas fa-file-pdf mr-2" />
                                Download PDF
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (!customStartDate || !customEndDate) {
                                        showError('Please select both start and end dates.');
                                        return;
                                    }
                                    const start = new Date(customStartDate);
                                    const end = new Date(customEndDate);
                                    if (start > end) {
                                        showError('Start date must be before end date.');
                                        return;
                                    }
                                    downloadReport('custom', 'csv', start, end);
                                }}
                                disabled={!customStartDate || !customEndDate}
                                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <i className="fas fa-file-csv mr-2" />
                                Download CSV
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ReportModal;



