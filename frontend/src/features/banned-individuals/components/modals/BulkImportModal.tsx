import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const BulkImportModal: React.FC = () => {
    const {
        showBulkImportModal,
        setShowBulkImportModal,
        handleBulkImport,
        bulkImportResults,
        setBulkImportResults,
        loading
    } = useBannedIndividualsContext();

    if (!showBulkImportModal) return null;

    const handleClose = () => {
        setBulkImportResults(null);
        setShowBulkImportModal(false);
    };

    const handleExportErrors = () => {
        if (!bulkImportResults || bulkImportResults.errors.length === 0) return;
        
        const errorReport = bulkImportResults.errors.map(err => `Row ${err.row}: ${err.error}`).join('\n');
        const blob = new Blob([errorReport], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-import-errors-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-file-import text-white text-lg" />
                        </div>
                        Bulk Import List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl shadow-inner text-sm">
                            <h4 className="font-bold text-blue-400 flex items-center mb-2 uppercase tracking-widest text-xs">
                                <i className="fas fa-info-circle mr-2 opacity-70" />
                                CSV Import Instructions
                            </h4>
                            <p className="text-blue-100/60 font-medium mb-4">
                                Ensure your CSV file contains the following 6 mandatory columns in exact order:
                            </p>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-[11px] flex justify-between text-blue-300 shadow-inner">
                                <span className="opacity-90">First Name, Last Name, Nationality, Reason, Ban Type, Risk Level</span>
                            </div>
                        </div>

                        <div className="relative group border-2 border-dashed border-white/5 rounded-2xl p-12 text-center hover:border-blue-500/40 hover:bg-white/[0.02] transition-all cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleBulkImport(file);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-5">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                    <i className="fas fa-cloud-upload-alt text-white text-3xl" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">Click to upload or drag & drop</p>
                                    <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Accepts CSV files up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Import Results */}
                        {bulkImportResults && (
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-white flex items-center uppercase tracking-widest text-xs">
                                        <i className="fas fa-chart-pie mr-2" />
                                        Import Results
                                    </h4>
                                    {bulkImportResults.failed > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportErrors}
                                            className="text-[10px] px-3 h-7"
                                        >
                                            <i className="fas fa-download mr-1.5" />
                                            Export Errors
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Success</p>
                                        <p className="text-2xl font-black text-emerald-400">{bulkImportResults.success}</p>
                                    </div>
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mb-1">Failed</p>
                                        <p className="text-2xl font-black text-red-400">{bulkImportResults.failed}</p>
                                    </div>
                                </div>
                                {bulkImportResults.errors.length > 0 && (
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Error Details:</p>
                                        {bulkImportResults.errors.map((err, idx) => (
                                            <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                                                            Row {err.row}
                                                        </p>
                                                        <p className="text-xs text-red-300/80 font-medium">{err.error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                            <a href="#" className="text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center group">
                                <i className="fas fa-download mr-2 group-hover:translate-y-0.5 transition-transform" />
                                Download Sample File
                            </a>
                            <div className="flex gap-3">
                                {bulkImportResults && bulkImportResults.success > 0 && bulkImportResults.failed === 0 && (
                                    <Button
                                        variant="primary"
                                        onClick={handleClose}
                                        className="px-6 py-2 font-bold uppercase text-[10px] tracking-widest"
                                    >
                                        Done
                                    </Button>
                                )}
                                <Button
                                    variant="glass"
                                    onClick={handleClose}
                                    className="px-8 py-2 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                                    disabled={loading.bulkImport}
                                >
                                    {loading.bulkImport ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2" />
                                            Importing...
                                        </>
                                    ) : (
                                        'Close'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
