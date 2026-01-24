import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const BulkImportModal: React.FC = () => {
    const {
        showBulkImportModal,
        setShowBulkImportModal,
        handleBulkImport
    } = useBannedIndividualsContext();

    if (!showBulkImportModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-file-import text-blue-400 text-lg" />
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

                        <div className="relative group border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-blue-500/40 hover:bg-white/[0.02] transition-all cursor-pointer">
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
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-lg border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    <i className="fas fa-cloud-upload-alt text-4xl text-slate-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">Click to upload or drag & drop</p>
                                    <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Accepts CSV files up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                            <a href="#" className="text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center group">
                                <i className="fas fa-download mr-2 group-hover:translate-y-0.5 transition-transform" />
                                Download Sample File
                            </a>
                            <Button
                                variant="glass"
                                onClick={() => setShowBulkImportModal(false)}
                                className="px-8 py-2 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
