import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';
import { showInfo, showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const DetectionsTab: React.FC = () => {
    const { 
        detectionAlerts, 
        loading,
        handleViewFootage,
        handleMarkFalsePositive,
        fetchDetectionAlerts
    } = useBannedIndividualsContext();

    useEffect(() => {
        fetchDetectionAlerts();
    }, [fetchDetectionAlerts]);

    const getDetectionStatusBadgeVariant = (status: string): 'destructive' | 'success' | 'warning' | 'info' => {
        switch (status) {
            case 'ACTIVE': return 'destructive';
            case 'RESOLVED': return 'success';
            case 'FALSE_POSITIVE': return 'warning';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Detections</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Real-time detection alerts and response tracking
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-exclamation-triangle text-white text-lg" />
                        </div>
                        Detection History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading.detections ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {detectionAlerts.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-history"
                                    title="No Detections Logged"
                                    description="System monitoring is active, but no flagged individuals have been detected at this facility recently."
                                />
                            ) : (
                            detectionAlerts.map((alert) => (
                                <div key={alert.id} className="p-4 border border-white/5 bg-white/5 rounded-lg hover:shadow-md transition-shadow group">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 group-hover:border-white/5 transition-colors">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-[color:var(--text-main)] group-hover:text-red-400 transition-colors">{alert.individualName}</h3>
                                        <Badge variant={getDetectionStatusBadgeVariant(alert.status)} size="sm">
                                            {alert.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">Location:</span>
                                            <p className="font-bold text-[color:var(--text-main)] mt-1">{alert.location}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">Confidence:</span>
                                            <p className="font-bold text-[color:var(--text-main)] mt-1">{alert.confidence}%</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">Response Time:</span>
                                            <p className="font-bold text-[color:var(--text-main)] mt-1">{alert.responseTime} minutes</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[color:var(--text-sub)] mt-2">{alert.actionTaken}</p>
                                    {alert.notes && (
                                        <p className="text-xs text-[color:var(--text-muted)] mt-1 italic italic-medium underline-offset-2">
                                            Note: {alert.notes}
                                        </p>
                                    )}
                                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-white/5">
                                        <Button
                                            size="sm"
                                            variant="glass"
                                            className="font-bold uppercase text-[10px] tracking-widest px-6"
                                            onClick={() => handleViewFootage(alert.id)}
                                            disabled={loading.detections}
                                        >
                                            <i className="fas fa-video mr-2 text-blue-400" />
                                            View Footage
                                        </Button>
                                        {alert.status === 'ACTIVE' && (
                                            <Button
                                                size="sm"
                                                variant="glass"
                                                className="font-bold uppercase text-[10px] tracking-widest px-6 hover:text-red-400"
                                                onClick={() => handleMarkFalsePositive(alert.id)}
                                                disabled={loading.detections}
                                            >
                                                <i className="fas fa-times-circle mr-2 text-red-500" />
                                                Mark False Positive
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

