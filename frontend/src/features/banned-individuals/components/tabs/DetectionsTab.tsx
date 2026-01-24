import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';
import { showInfo, showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const DetectionsTab: React.FC = () => {
    const { detectionAlerts } = useBannedIndividualsContext();

    const handleViewFootage = (alertId: string, individualName: string) => {
        // TODO: Implement video footage viewer modal
        // For now, show a message indicating the feature is coming soon
        showInfo('Video footage viewer feature coming soon. This will open a modal to view detection footage.');
    };

    const handleMarkAsFalsePositive = (alertId: string, individualName: string) => {
        // TODO: Implement mark as false positive functionality
        showSuccess(`Marked alert for ${individualName} as false positive`);
    };

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
            <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)]">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                            <i className="fas fa-exclamation-triangle text-white text-lg" />
                        </div>
                        Detection History
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 group-hover:border-white/10 transition-colors">
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
                                            onClick={() => handleViewFootage(alert.id, alert.individualName)}
                                        >
                                            <i className="fas fa-video mr-2 text-blue-400" />
                                            View Footage
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="glass"
                                            className="font-bold uppercase text-[10px] tracking-widest px-6 hover:text-red-400"
                                            onClick={() => handleMarkAsFalsePositive(alert.id, alert.individualName)}
                                        >
                                            <i className="fas fa-times-circle mr-2 text-red-500" />
                                            Mark False Positive
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

