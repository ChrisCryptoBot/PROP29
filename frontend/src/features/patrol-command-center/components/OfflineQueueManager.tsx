import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Badge } from '../../../components/UI/Badge';
import { EmptyState } from '../../../components/UI/EmptyState';
import { usePatrolContext } from '../context/PatrolContext';
import { showSuccess, showError } from '../../../utils/toast';

export const OfflineQueueManager: React.FC = () => {
    const {
        checkInQueuePendingCount,
        checkInQueueFailedCount,
        retryCheckInQueue,
        operationQueuePendingCount,
        operationQueueFailedCount,
        retryOperationQueue
    } = usePatrolContext();

    const handleRetryFailed = () => {
        try {
            retryCheckInQueue();
            retryOperationQueue();
            showSuccess('Retrying failed operations...');
        } catch (error) {
            showError('Failed to retry operations');
        }
    };

    const totalPending = checkInQueuePendingCount + operationQueuePendingCount;
    const totalFailed = checkInQueueFailedCount + operationQueueFailedCount;

    if (totalPending === 0 && totalFailed === 0) {
        return null;
    }

    return (
        <Card className="bg-slate-900/50 border border-white/5">
            <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center text-white">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                            <i className="fas fa-sync-alt text-white"></i>
                        </div>
                        <span className="card-title-text">Offline Queue</span>
                    </span>
                    <div className="flex items-center gap-2">
                        {totalPending > 0 && (
                            <Badge variant="warning" className="glass-card border-none">
                                {totalPending} pending
                            </Badge>
                        )}
                        {totalFailed > 0 && (
                            <Badge variant="destructive" className="glass-card border-none">
                                {totalFailed} failed
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
                <div className="space-y-4">
                    {totalPending > 0 && (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-amber-400">
                                        {totalPending} operation{totalPending !== 1 ? 's' : ''} pending sync
                                    </p>
                                    <p className="text-[10px] text-amber-300/70 mt-1">
                                        {checkInQueuePendingCount > 0 && `${checkInQueuePendingCount} check-in${checkInQueuePendingCount !== 1 ? 's' : ''}, `}
                                        {operationQueuePendingCount > 0 && `${operationQueuePendingCount} other operation${operationQueuePendingCount !== 1 ? 's' : ''}`}
                                        {checkInQueuePendingCount === 0 && operationQueuePendingCount === 0 && 'These will sync automatically when connection is restored'}
                                    </p>
                                </div>
                                <i className="fas fa-clock text-amber-400/50 text-2xl" />
                            </div>
                        </div>
                    )}
                    {totalFailed > 0 && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-bold text-red-400">
                                        {totalFailed} operation{totalFailed !== 1 ? 's' : ''} failed to sync
                                    </p>
                                    <p className="text-[10px] text-red-300/70 mt-1">
                                        {checkInQueueFailedCount > 0 && `${checkInQueueFailedCount} check-in${checkInQueueFailedCount !== 1 ? 's' : ''}, `}
                                        {operationQueueFailedCount > 0 && `${operationQueueFailedCount} other operation${operationQueueFailedCount !== 1 ? 's' : ''}`}
                                        {checkInQueueFailedCount === 0 && operationQueueFailedCount === 0 && 'These operations exceeded retry attempts and need manual intervention'}
                                    </p>
                                </div>
                                <i className="fas fa-exclamation-triangle text-red-400/50 text-2xl" />
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRetryFailed}
                                className="w-full"
                            >
                                <i className="fas fa-redo mr-2" />
                                Retry Failed Operations
                            </Button>
                        </div>
                    )}
                    {totalPending === 0 && totalFailed === 0 && (
                        <EmptyState
                            icon="fas fa-check-circle"
                            title="Queue is empty"
                            description="All operations have been synced successfully"
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
