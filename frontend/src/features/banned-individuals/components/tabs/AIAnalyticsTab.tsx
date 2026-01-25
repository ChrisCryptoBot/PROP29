import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { RiskAssessmentPanel, PatternDetectionPanel } from '../../../../components/BannedIndividualsModule';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const AIAnalyticsTab: React.FC = () => {
    const { selectedIndividual, bannedIndividuals } = useBannedIndividualsContext();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Risk Analysis</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        AI-powered risk assessment and pattern detection
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-brain text-white text-lg" />
                        </div>
                        AI Risk Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-8">
                        {/* Pattern Detection */}
                        <section>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-4 flex items-center px-1">
                                <i className="fas fa-network-wired text-cyan-400 mr-2" />
                                System Pattern Recognition
                            </h3>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-1 shadow-inner">
                                <PatternDetectionPanel individuals={bannedIndividuals} />
                            </div>
                        </section>

                        {/* Individual Risk Assessment - Only shown when individual is selected */}
                        {selectedIndividual && (
                            <section className="pt-8 border-t border-white/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-4 flex items-center px-1">
                                    <i className="fas fa-user-shield text-blue-400 mr-2" />
                                    Individual Risk Assessment: {selectedIndividual.firstName} {selectedIndividual.lastName}
                                </h3>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-1 shadow-inner">
                                    <RiskAssessmentPanel
                                        individual={selectedIndividual}
                                        allIndividuals={bannedIndividuals}
                                    />
                                </div>
                            </section>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


