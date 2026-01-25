import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { bannedIndividualsService } from '../../../../services/BannedIndividualsService';

export const AnalyticsTab: React.FC = () => {
    const { bannedIndividuals, detectionAlerts, metrics } = useBannedIndividualsContext();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const data = await bannedIndividualsService.getAnalytics({
                    startDate: dateRange.startDate || undefined,
                    endDate: dateRange.endDate || undefined
                });
                setAnalytics(data);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [dateRange]);

    const computedAnalytics = useMemo(() => {
        const totalDetections = detectionAlerts.length;
        const falsePositives = detectionAlerts.filter(a => a.status === 'FALSE_POSITIVE').length;
        const falsePositiveRate = totalDetections > 0 ? (falsePositives / totalDetections * 100).toFixed(1) : '0.0';
        
        const detectionFrequency = analytics?.detection_frequency || (totalDetections / 30).toFixed(1);
        const securityEffectiveness = analytics?.security_effectiveness || (100 - parseFloat(falsePositiveRate)).toFixed(1);

        // Risk level distribution
        const riskDistribution = bannedIndividuals.reduce((acc, ind) => {
            acc[ind.riskLevel] = (acc[ind.riskLevel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const total = bannedIndividuals.length;
        const riskPercentages = {
            CRITICAL: total > 0 ? Math.round(((riskDistribution.CRITICAL || 0) / total) * 100) : 0,
            HIGH: total > 0 ? Math.round(((riskDistribution.HIGH || 0) / total) * 100) : 0,
            MEDIUM: total > 0 ? Math.round(((riskDistribution.MEDIUM || 0) / total) * 100) : 0,
            LOW: total > 0 ? Math.round(((riskDistribution.LOW || 0) / total) * 100) : 0
        };

        // Monthly trends (last 12 months) - only use real data from analytics
        const monthlyTrends = analytics?.monthly_trends || [];

        return {
            detectionFrequency,
            falsePositiveRate,
            securityEffectiveness,
            riskPercentages,
            monthlyTrends
        };
    }, [bannedIndividuals, detectionAlerts, analytics]);

    const handleExport = () => {
        const data = {
            analytics: computedAnalytics,
            dateRange,
            generatedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `banned-individuals-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Reports</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Analytics, trends, and performance metrics
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                                <i className="fas fa-chart-bar text-white text-lg" />
                            </div>
                            Analytics & Reports
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="px-3 py-2 border border-white/10 bg-white/5 text-white rounded-lg text-sm"
                            />
                            <span className="text-white">to</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="px-3 py-2 border border-white/10 bg-white/5 text-white rounded-lg text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="text-[10px]"
                            >
                                <i className="fas fa-download mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <AnalyticsItem
                                icon="fa-chart-line"
                                label="Detection Frequency"
                                value={`${computedAnalytics.detectionFrequency} per day`}
                            />
                            <AnalyticsItem
                                icon="fa-check-circle"
                                label="False Positives"
                                value={`${computedAnalytics.falsePositiveRate}%`}
                            />
                            <AnalyticsItem
                                icon="fa-shield-alt"
                                label="Security Effectiveness"
                                value={`${computedAnalytics.securityEffectiveness}%`}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Visual Analytics */}
            {computedAnalytics.monthlyTrends.length > 0 && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter text-white">Monthly Detection Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-64 flex items-end justify-between space-x-2 px-2">
                            {computedAnalytics.monthlyTrends.map((trend: any, i: number) => {
                                const maxValue = Math.max(...computedAnalytics.monthlyTrends.map((t: any) => t.count));
                                const height = maxValue > 0 ? (trend.count / maxValue * 100) : 0;
                                return (
                                    <div key={i} className="flex-1 space-y-2 group">
                                        <div
                                            className="bg-blue-500/40 border-t border-blue-400 group-hover:bg-blue-500/60 transition-all duration-300 w-full"
                                            style={{ height: `${height}%` }}
                                        />
                                        <div className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">{trend.month}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Risk Level Distribution */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-white">Risk Level Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <RiskBar label="Critical" percentage={computedAnalytics.riskPercentages.CRITICAL} color="bg-red-500" borderColor="border-red-500/30" />
                        <RiskBar label="High" percentage={computedAnalytics.riskPercentages.HIGH} color="bg-orange-500" borderColor="border-orange-500/30" />
                        <RiskBar label="Medium" percentage={computedAnalytics.riskPercentages.MEDIUM} color="bg-yellow-500" borderColor="border-yellow-500/30" />
                        <RiskBar label="Low" percentage={computedAnalytics.riskPercentages.LOW} color="bg-emerald-500" borderColor="border-emerald-500/30" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const AnalyticsItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group shadow-inner">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600/80 to-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <i className={cn("fas", icon, "text-white text-2xl")} />
        </div>
        <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[0.2em] italic opacity-70">{label}</h3>
        <p className="text-2xl font-black text-white uppercase tracking-tighter">{value}</p>
    </div>
);

const RiskBar: React.FC<{ label: string; percentage: number; color: string; borderColor: string }> = ({ label, percentage, color, borderColor }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
            <span>{label}</span>
            <span className="text-white">{percentage}%</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 p-[2px]">
            <div
                className={cn("h-full rounded-full transition-all duration-1000", color, borderColor, "border shadow-[0_0_10px_rgba(255,255,255,0.05)]")}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
);


