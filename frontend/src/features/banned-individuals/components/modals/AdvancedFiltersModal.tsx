import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const AdvancedFiltersModal: React.FC = () => {
    const {
        showAdvancedFiltersModal,
        setShowAdvancedFiltersModal,
        filterBanType, setFilterBanType,
        filterNationality, setFilterNationality,
        bannedIndividuals
    } = useBannedIndividualsContext();

    if (!showAdvancedFiltersModal) return null;

    const nationalities = Array.from(new Set(bannedIndividuals.map(i => i.nationality))).sort();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/10 pb-4 mb-2 group cursor-pointer">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-layer-group text-white text-lg" />
                        </div>
                        Advanced Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Restrict by Ban Type</label>
                            <select
                                value={filterBanType}
                                onChange={(e) => setFilterBanType(e.target.value)}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner shadow-black/20"
                            >
                                <option value="ALL" className="bg-slate-900">All Ban Durations</option>
                                <option value="TEMPORARY" className="bg-slate-900">Temporary Only</option>
                                <option value="PERMANENT" className="bg-slate-900">Permanent Only</option>
                                <option value="CONDITIONAL" className="bg-slate-900">Conditional Only</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Origin / Nationality</label>
                            <select
                                value={filterNationality}
                                onChange={(e) => setFilterNationality(e.target.value)}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner shadow-black/20"
                            >
                                <option value="ALL" className="bg-slate-900">All Nationalities</option>
                                {nationalities.map(nat => (
                                    <option key={nat} value={nat} className="bg-slate-900">{nat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-3 p-5 border border-white/10 rounded-2xl bg-white/5 shadow-inner">
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer rounded-lg rounded-full" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Show only flagged "Expiring Soon"</span>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => {
                                    setFilterBanType('ALL');
                                    setFilterNationality('ALL');
                                    setShowAdvancedFiltersModal(false);
                                }}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Reset
                            </Button>
                            <Button
                                variant="primary"
                                className="font-black uppercase tracking-widest text-[10px] px-10 shadow-lg"
                                onClick={() => setShowAdvancedFiltersModal(false)}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
