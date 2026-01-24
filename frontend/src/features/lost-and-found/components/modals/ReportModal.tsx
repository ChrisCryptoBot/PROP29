/**
 * Report Modal
 * Export reports for Lost & Found items
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { LostFoundStatus } from '../../types/lost-and-found.types';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const {
        exportReport,
        loading
    } = useLostFoundContext();

    const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
    const [status, setStatus] = useState<LostFoundStatus | 'all'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleExport = async () => {
        const filters = status !== 'all' ? { status } : undefined;
        await exportReport(format, filters, startDate || undefined, endDate || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-2xl w-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className="fas fa-file-export text-white text-lg" />
                        </div>
                        Export Report
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Format
                            </label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv')}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                            >
                                <option value="pdf">PDF</option>
                                <option value="csv">CSV</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Status Filter
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as LostFoundStatus | 'all')}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                            >
                                <option value="all">All Statuses</option>
                                <option value={LostFoundStatus.FOUND}>Found</option>
                                <option value={LostFoundStatus.CLAIMED}>Claimed</option>
                                <option value={LostFoundStatus.EXPIRED}>Expired</option>
                                <option value={LostFoundStatus.DONATED}>Donated</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            variant="primary"
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                            disabled={loading.items}
                        >
                            {loading.items ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Exporting...
                                </div>
                            ) : (
                                <>
                                    <i className="fas fa-download mr-2" />
                                    Export Report
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};



