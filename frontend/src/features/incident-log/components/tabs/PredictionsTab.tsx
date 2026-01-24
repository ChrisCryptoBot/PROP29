import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { Button } from '../../../../components/UI/Button';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { Pattern } from '../../types/incident-log.types';
import { showError } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const PredictionsTab: React.FC = () => {
    const { incidents, getPatternRecognition, loading, refreshIncidents } = useIncidentLogContext();
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [error, setError] = useState<string | null>(null);
    const hasIncidents = incidents.length > 0;

    useEffect(() => {
        const loadPatterns = async () => {
            if (!hasIncidents) {
                setPatterns([]);
                return;
            }

            try {
                const propertyId = localStorage.getItem('propertyId') || undefined;
                const response = await getPatternRecognition({
                    time_range: '30d',
                    property_id: propertyId,
                    analysis_types: ['incident_type', 'severity_trend', 'location_pattern']
                });
                setPatterns(response?.patterns || []);
            } catch (error) {
                console.error('Failed to load pattern recognition:', error);
                setPatterns([]);
            }
        };

        loadPatterns();
    }, [getPatternRecognition, hasIncidents]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Incident Log</p>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Predictions</h2>
                    <p className="text-[11px] text-[color:var(--text-sub)]">Forecast risks and emerging patterns.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTimeRange('7d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                timeRange === '7d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            7 Days
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTimeRange('30d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                timeRange === '30d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            30 Days
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTimeRange('90d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                timeRange === '90d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            90 Days
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setPatterns([]);
                            setError(null);
                            const loadPatterns = async () => {
                                if (!hasIncidents) return;
                                try {
                                    const propertyId = localStorage.getItem('propertyId') || undefined;
                                    const response = await getPatternRecognition({
                                        time_range: timeRange,
                                        property_id: propertyId,
                                        analysis_types: ['incident_type', 'severity_trend', 'location_pattern']
                                    });
                                    setPatterns(response?.patterns || []);
                                } catch (error) {
                                    setError('Failed to refresh predictions. Please try again.');
                                }
                            };
                            loadPatterns();
                        }}
                        disabled={loading.related}
                        className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                        <i className={cn("fas fa-sync-alt mr-2", loading.related && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>
            {/* AI Predictions */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-brain text-white" />
                        </div>
                        <span className="uppercase tracking-tight">AI Predictions</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}
                    {loading.related ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : !hasIncidents || patterns.length === 0 ? (
                        <EmptyState
                            icon="fas fa-chart-line"
                            title="No Predictive Insights Available"
                            description={hasIncidents ? 'No patterns detected for the selected window.' : 'Create incidents to enable AI insights and forecasts.'}
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <div className="space-y-4">
                            {patterns.map((pattern, index) => (
                                <div
                                    key={`${pattern.type}-${index}`}
                                    className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                                {pattern.type.replace(/_/g, ' ')}
                                            </p>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                                {pattern.insight}
                                            </h4>
                                            <div className="mt-2 text-xs text-slate-400">
                                                Confidence: <span className="text-blue-400 font-semibold">{(pattern.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-200 bg-blue-500/10 border border-blue-500/30 rounded-full">
                                            Insight
                                        </div>
                                    </div>
                                    {pattern.recommendations && pattern.recommendations.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Recommendations</p>
                                            <div className="space-y-2">
                                                {pattern.recommendations.map((rec, recIndex) => (
                                                    <div key={recIndex} className="flex items-start gap-2 text-xs text-slate-300">
                                                        <i className="fas fa-check text-emerald-400 mt-0.5 flex-shrink-0" />
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PredictionsTab;



