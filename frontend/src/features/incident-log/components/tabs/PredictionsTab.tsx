import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { Button } from '../../../../components/UI/Button';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { AgentTrustLevel } from '../../types/incident-log.types';
import { Pattern } from '../../types/incident-log.types';
import { showError } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const PredictionsTab: React.FC = () => {
    const { 
        incidents, 
        getPatternRecognition, 
        loading, 
        refreshIncidents,
        agentPerformanceMetrics,
        hardwareDevices,
        getAgentTrustLevel,
        propertyId
    } = useIncidentLogContext();
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [error, setError] = useState<string | null>(null);
    const [predictionType, setPredictionType] = useState<'incidents' | 'agents' | 'hardware'>('incidents');
    const hasIncidents = incidents.length > 0;

    useEffect(() => {
        const loadPatterns = async () => {
            if (!hasIncidents) {
                setPatterns([]);
                return;
            }

            try {
                const response = await getPatternRecognition({
                    time_range: timeRange,
                    property_id: propertyId,
                    analysis_types: ['incident_type', 'severity_trend', 'location_pattern']
                });
                setPatterns(response?.patterns || []);
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'loadPatternRecognition');
                setPatterns([]);
            }
        };

        loadPatterns();
    }, [getPatternRecognition, hasIncidents, timeRange, propertyId]);

    // Agent risk predictions
    const agentRiskPredictions = useMemo(() => {
        return agentPerformanceMetrics.map(agent => {
            const trustLevel = getAgentTrustLevel(agent.agent_id);
            const riskScore = 100 - agent.trust_score;
            
            let prediction = '';
            let recommendations: string[] = [];
            
            if (trustLevel === AgentTrustLevel.LOW) {
                prediction = 'High risk of continued poor performance';
                recommendations = [
                    'Require additional training',
                    'Implement closer supervision',
                    'Consider performance improvement plan'
                ];
            } else if (trustLevel === AgentTrustLevel.MEDIUM && agent.approval_rate < 70) {
                prediction = 'Declining performance trend detected';
                recommendations = [
                    'Monitor closely for next 7 days',
                    'Provide feedback on rejection patterns',
                    'Review training materials'
                ];
            } else if (trustLevel === AgentTrustLevel.HIGH) {
                prediction = 'Stable high performance expected';
                recommendations = [
                    'Consider for auto-approval eligibility',
                    'Use as training example for other agents'
                ];
            }

            return {
                agent_id: agent.agent_id,
                agent_name: agent.agent_name || `Agent ${agent.agent_id.slice(0, 6)}`,
                trust_level: trustLevel,
                risk_score: riskScore,
                prediction,
                recommendations,
                confidence: Math.random() * 0.3 + 0.7 // Mock confidence
            };
        }).filter(p => p.prediction);
    }, [agentPerformanceMetrics, getAgentTrustLevel]);

    // Hardware failure predictions
    const hardwareRiskPredictions = useMemo(() => {
        return hardwareDevices.map(device => {
            const riskScore = 100 - device.health_score;
            const criticalIssues = device.issues.filter(i => i.severity === 'critical' || i.severity === 'error');
            
            let prediction = '';
            let recommendations: string[] = [];
            
            if (device.health_score < 50 || criticalIssues.length > 2) {
                prediction = 'High risk of imminent failure';
                recommendations = [
                    'Schedule immediate maintenance',
                    'Prepare backup device',
                    'Consider replacement'
                ];
            } else if (device.health_score < 70 || criticalIssues.length > 0) {
                prediction = 'Declining health trend - maintenance needed';
                recommendations = [
                    'Schedule preventive maintenance',
                    'Monitor more closely',
                    'Update firmware if available'
                ];
            } else if (device.health_score > 90 && device.issues.length === 0) {
                prediction = 'Excellent health - stable operation expected';
                recommendations = [
                    'Continue current maintenance schedule'
                ];
            }

            return {
                device_id: device.device_id,
                device_name: device.device_name,
                device_type: device.device_type,
                risk_score: riskScore,
                prediction,
                recommendations,
                confidence: Math.random() * 0.2 + 0.8 // Mock confidence
            };
        }).filter(p => p.prediction);
    }, [hardwareDevices]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">AI Predictions</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Forecast risks and emerging patterns
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Prediction Type Selection */}
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPredictionType('incidents')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                predictionType === 'incidents' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Incidents
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPredictionType('agents')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                predictionType === 'agents' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Agents
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPredictionType('hardware')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                predictionType === 'hardware' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Hardware
                        </Button>
                    </div>

                    {/* Time Range Selection */}
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
                                    // Use context propertyId (already available from hook)
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
            {/* AI Predictions - Enhanced with Agent and Hardware Predictions */}
            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3  border border-white/5">
                            <i className={cn("fas text-white", 
                                predictionType === 'incidents' ? 'fa-brain' :
                                predictionType === 'agents' ? 'fa-user-shield' :
                                'fa-microchip'
                            )} />
                        </div>
                        <span className="uppercase tracking-tight">
                            {predictionType === 'incidents' ? 'Incident Predictions' :
                             predictionType === 'agents' ? 'Agent Performance Predictions' :
                             'Hardware Failure Predictions'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Incident Predictions */}
                    {predictionType === 'incidents' && (
                        <>
                            {loading.related ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading patterns" />
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                                        Loading Patterns...
                                    </p>
                                </div>
                            ) : !hasIncidents || patterns.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-brain"
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
                                                    Pattern
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
                        </>
                    )}

                    {/* Agent Performance Predictions */}
                    {predictionType === 'agents' && (
                        <>
                            {agentRiskPredictions.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-user-shield"
                                    title="No Agent Predictions Available"
                                    description="Agent performance predictions will appear once agents have sufficient activity history."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <div className="space-y-4">
                                    {agentRiskPredictions.map((prediction, index) => (
                                        <div
                                            key={prediction.agent_id}
                                            className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <p className="text-sm font-bold text-white">{prediction.agent_name}</p>
                                                        <span className={cn(
                                                            "px-2 py-1 text-xs font-bold uppercase rounded",
                                                            prediction.trust_level === AgentTrustLevel.HIGH ? "text-green-300 bg-green-500/20" :
                                                            prediction.trust_level === AgentTrustLevel.MEDIUM ? "text-yellow-300 bg-yellow-500/20" :
                                                            "text-red-300 bg-red-500/20"
                                                        )}>
                                                            {prediction.trust_level} Trust
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                                        {prediction.prediction}
                                                    </h4>
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        Risk Score: <span className={cn("font-semibold",
                                                            prediction.risk_score < 30 ? "text-green-400" :
                                                            prediction.risk_score < 60 ? "text-yellow-400" :
                                                            "text-red-400"
                                                        )}>{prediction.risk_score.toFixed(0)}%</span>
                                                        {' • '}
                                                        Confidence: <span className="text-blue-400 font-semibold">{(prediction.confidence * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-green-200 bg-green-500/10 border border-green-500/30 rounded-full">
                                                    Agent Risk
                                                </div>
                                            </div>
                                            {prediction.recommendations && prediction.recommendations.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Recommendations</p>
                                                    <div className="space-y-2">
                                                        {prediction.recommendations.map((rec, recIndex) => (
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
                        </>
                    )}

                    {/* Hardware Failure Predictions */}
                    {predictionType === 'hardware' && (
                        <>
                            {hardwareRiskPredictions.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-microchip"
                                    title="No Hardware Predictions Available"
                                    description="Hardware failure predictions will appear once devices have sufficient operational history."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <div className="space-y-4">
                                    {hardwareRiskPredictions.map((prediction, index) => (
                                        <div
                                            key={prediction.device_id}
                                            className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <i className={cn("fas",
                                                            prediction.device_type === 'camera' ? 'fa-video text-blue-400' :
                                                            prediction.device_type === 'sensor' ? 'fa-thermometer-half text-green-400' :
                                                            prediction.device_type === 'access_control' ? 'fa-key text-yellow-400' :
                                                            prediction.device_type === 'alarm' ? 'fa-bell text-red-400' :
                                                            'fa-microchip text-slate-400'
                                                        )} />
                                                        <p className="text-sm font-bold text-white">{prediction.device_name}</p>
                                                        <span className="px-2 py-1 text-xs font-bold uppercase rounded text-slate-300 bg-slate-500/20 capitalize">
                                                            {prediction.device_type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                                        {prediction.prediction}
                                                    </h4>
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        Risk Score: <span className={cn("font-semibold",
                                                            prediction.risk_score < 30 ? "text-green-400" :
                                                            prediction.risk_score < 60 ? "text-yellow-400" :
                                                            "text-red-400"
                                                        )}>{prediction.risk_score.toFixed(0)}%</span>
                                                        {' • '}
                                                        Confidence: <span className="text-blue-400 font-semibold">{(prediction.confidence * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-200 bg-orange-500/10 border border-orange-500/30 rounded-full">
                                                    Hardware Risk
                                                </div>
                                            </div>
                                            {prediction.recommendations && prediction.recommendations.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Recommendations</p>
                                                    <div className="space-y-2">
                                                        {prediction.recommendations.map((rec, recIndex) => (
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PredictionsTab;



