import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { RiskAssessmentPanel, PatternDetectionPanel } from '../../../../components/BannedIndividualsModule';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const AIAnalyticsTab: React.FC = () => {
    const { selectedIndividual, bannedIndividuals } = useBannedIndividualsContext();

    return (
        <div className="space-y-6">
            <Card className="glass-card border-white/10 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3 border border-blue-500/30 group-hover:scale-110 transition-transform">
                            <i className="fas fa-brain text-blue-400 text-lg" />
                        </div>
                        AI Risk Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-8">
                        {/* Risk Assessment */}
                        <section>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-4 flex items-center px-1">
                                <i className="fas fa-user-shield text-blue-400 mr-2" />
                                Individual Risk Assessment
                            </h3>
                            {selectedIndividual ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-1 shadow-inner">
                                        <RiskAssessmentPanel
                                            individual={selectedIndividual}
                                            allIndividuals={bannedIndividuals}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon="fas fa-fingerprint"
                                    title="No Subject Selected"
                                    description="Select an individual from the Records tab to perform biometric risk diagnostics and behavior analysis."
                                />
                            )}
                        </section>

                        {/* Pattern Detection */}
                        <section className="pt-8 border-t border-white/5">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-4 flex items-center px-1">
                                <i className="fas fa-network-wired text-cyan-400 mr-2" />
                                System Pattern Recognition
                            </h3>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-1 shadow-inner">
                                <PatternDetectionPanel individuals={bannedIndividuals} />
                            </div>
                        </section>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


