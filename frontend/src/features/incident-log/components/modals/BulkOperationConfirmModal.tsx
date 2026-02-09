import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { BulkOperationResult, IncidentStatus, AgentTrustLevel } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';

interface BulkOperationConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    operation: {
        type: 'approve' | 'reject' | 'delete' | 'status_change' | null;
        incidentIds: string[];
        reason?: string;
        newStatus?: IncidentStatus;
        title: string;
        description: string;
    } | null;
    onConfirm: (reason?: string) => Promise<BulkOperationResult | boolean | null>;
}

interface OperationProgress {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ incident_id: string; error: string }>;
    startTime: Date;
    endTime?: Date;
}

export const BulkOperationConfirmModal: React.FC<BulkOperationConfirmModalProps> = ({
    isOpen,
    onClose,
    operation,
    onConfirm
}) => {
    const { 
        incidents, 
        agentPerformanceMetrics,
        getAgentTrustLevel,
        bulkOperationResult,
        loading 
    } = useIncidentLogContext();

    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);
    const [results, setResults] = useState<BulkOperationResult | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && operation) {
            setReason(operation.reason || '');
            setIsProcessing(false);
            setShowResults(false);
            setOperationProgress(null);
            setResults(null);
            abortControllerRef.current = null;
        }
    }, [isOpen, operation]);

    // Get affected incidents details
    const affectedIncidents = React.useMemo(() => {
        if (!operation) return [];
        return incidents.filter(incident => operation.incidentIds.includes(incident.incident_id));
    }, [incidents, operation]);

    // Analyze affected incidents by source and trust level
    const operationAnalysis = React.useMemo(() => {
        if (!affectedIncidents.length) return null;

        const analysis = {
            bySource: { manager: 0, agent: 0, device: 0, sensor: 0, unknown: 0 },
            byTrustLevel: { HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 },
            bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
            agentIds: new Set<string>()
        };

        affectedIncidents.forEach(incident => {
            // Source analysis
            const source = incident.source || 'unknown';
            if (source in analysis.bySource) {
                (analysis.bySource as any)[source]++;
            } else {
                analysis.bySource.unknown++;
            }

            // Agent trust level analysis
            if (incident.source_agent_id) {
                analysis.agentIds.add(incident.source_agent_id);
                const trustLevel = getAgentTrustLevel(incident.source_agent_id);
                // Convert string enum value to uppercase key
                const trustLevelKey = trustLevel.toUpperCase() as keyof typeof analysis.byTrustLevel;
                analysis.byTrustLevel[trustLevelKey]++;
            }

            // Severity analysis
            const severity = incident.severity?.toLowerCase() as keyof typeof analysis.bySeverity;
            if (severity && severity in analysis.bySeverity) {
                analysis.bySeverity[severity]++;
            }
        });

        return analysis;
    }, [affectedIncidents, getAgentTrustLevel]);

    const handleConfirm = async () => {
        if (!operation) return;

        // Validation for operations requiring reason
        if (operation.type && (operation.type === 'reject' || operation.type === 'delete') && !reason.trim()) {
            return;
        }

        setIsProcessing(true);
        setOperationProgress({
            total: operation.incidentIds.length,
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
            startTime: new Date()
        });

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const result = await onConfirm(reason.trim() || undefined);
            
            // Handle different result types
            if (result && typeof result === 'object' && 'successful' in result) {
                // BulkOperationResult type
                setResults(result);
                setOperationProgress(prev => prev ? {
                    ...prev,
                    processed: result.total,
                    successful: result.successful,
                    failed: result.failed,
                    errors: result.errors?.map(err => ({ 
                        incident_id: err.incident_id, 
                        error: err.error_message 
                    })) || [],
                    endTime: new Date()
                } : null);
            } else if (typeof result === 'boolean') {
                // Boolean result (legacy operations) – derive result shape for UI
                const derivedResult: BulkOperationResult = {
                    operation_type: operation.type as any,
                    total: operation.incidentIds.length,
                    successful: result ? operation.incidentIds.length : 0,
                    failed: result ? 0 : operation.incidentIds.length,
                    skipped: 0,
                    errors: result ? [] : [{
                        incident_id: 'unknown',
                        error_code: 'OPERATION_FAILED',
                        error_message: 'Operation completed with unknown status'
                    }],
                    execution_time_ms: 1000,
                    executed_by: 'current_user',
                    executed_at: new Date().toISOString()
                };
                setResults(derivedResult);
                setOperationProgress(prev => prev ? {
                    ...prev,
                    processed: operation.incidentIds.length,
                    successful: derivedResult.successful,
                    failed: derivedResult.failed,
                    errors: [],
                    endTime: new Date()
                } : null);
            }

            setShowResults(true);
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), `bulkOperationConfirm-${operation?.type || 'unknown'}`);
            setOperationProgress(prev => prev ? {
                ...prev,
                processed: operation.incidentIds.length,
                successful: 0,
                failed: operation.incidentIds.length,
                errors: [{ incident_id: 'unknown', error: String(error) }],
                endTime: new Date()
            } : null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        if (isProcessing && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsProcessing(false);
        }
        
        if (!isProcessing) {
            onClose();
        }
    };

    const handleClose = () => {
        setReason('');
        setShowResults(false);
        setResults(null);
        setOperationProgress(null);
        onClose();
    };

    if (!operation) return null;

    const getOperationIcon = () => {
        switch (operation.type) {
            case 'approve': return 'fa-check text-green-400';
            case 'reject': return 'fa-times text-red-400';
            case 'delete': return 'fa-trash text-red-400';
            case 'status_change': return 'fa-edit text-blue-400';
            default: return 'fa-cogs text-slate-400';
        }
    };

    const getOperationColor = () => {
        switch (operation.type) {
            case 'approve': return 'border-green-500/30 bg-green-500/10';
            case 'reject': return 'border-red-500/30 bg-red-500/10';
            case 'delete': return 'border-red-500/30 bg-red-500/10';
            case 'status_change': return 'border-blue-500/30 bg-blue-500/10';
            default: return 'border-slate-500/30 bg-slate-500/10';
        }
    };

    const requiresReason = operation.type && (operation.type === 'reject' || operation.type === 'delete');
    const canConfirm = !requiresReason || reason.trim().length > 0;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleCancel}
            title={showResults ? "Operation Results" : operation.title}
            size="lg"
            footer={!showResults ? (
                <>
                    <Button
                        variant="subtle"
                        onClick={handleCancel}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Cancel Operation' : 'Cancel'}
                    </Button>
                    <Button
                        variant="glass"
                        onClick={handleConfirm}
                        disabled={!canConfirm || isProcessing}
                        className={cn(
                            operation.type === 'approve' ? 'border-green-500/30 text-green-300 hover:bg-green-500/10' :
                            operation.type === 'reject' ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' :
                            operation.type === 'delete' ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' :
                            'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'
                        )}
                    >
                        {isProcessing ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className={cn("fas mr-2", getOperationIcon())} />
                                Confirm {operation.type ? (operation.type.charAt(0).toUpperCase() + operation.type.slice(1)) : 'Operation'}
                            </>
                        )}
                    </Button>
                </>
            ) : (
                <Button variant="glass" onClick={handleClose}>
                    <i className="fas fa-check mr-2" />
                    Close
                </Button>
            )}
        >
            <div className="space-y-6">
                {/* Operation Overview */}
                {!showResults && (
                    <div className={cn("p-4 border rounded-md", getOperationColor())}>
                        <div className="flex items-center space-x-3 mb-3">
                            <i className={cn("fas text-lg", getOperationIcon())} />
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{operation.title}</h3>
                                <p className="text-sm text-slate-300">{operation.description}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{operation.incidentIds.length}</div>
                                <div className="text-xs text-slate-400">Total Incidents</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{operationAnalysis?.agentIds.size || 0}</div>
                                <div className="text-xs text-slate-400">Unique Agents</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {operationAnalysis ? Object.values(operationAnalysis.bySeverity).reduce((a, b) => a + b, 0) : 0}
                                </div>
                                <div className="text-xs text-slate-400">All Severities</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Operation Analysis */}
                {!showResults && operationAnalysis && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-slate-900/50 border border-white/5">
                            <CardHeader>
                                <CardTitle className="text-sm text-white">Source Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(operationAnalysis.bySource).map(([source, count]) => 
                                        count > 0 && (
                                            <div key={source} className="flex justify-between items-center">
                                                <span className="text-sm text-slate-300 capitalize">
                                                    <i className={cn(
                                                        "fas mr-2",
                                                        source === 'agent' ? 'fa-user-shield text-blue-400' :
                                                        source === 'device' ? 'fa-microchip text-orange-400' :
                                                        source === 'manager' ? 'fa-user-tie text-green-400' :
                                                        'fa-question text-slate-400'
                                                    )} />
                                                    {source === 'unknown' ? 'Other' : source}
                                                </span>
                                                <span className="text-sm font-bold text-white">{count}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border border-white/5">
                            <CardHeader>
                                <CardTitle className="text-sm text-white">Agent Trust Levels</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(operationAnalysis.byTrustLevel).map(([level, count]) => 
                                        count > 0 && (
                                            <div key={level} className="flex justify-between items-center">
                                                <span className={cn(
                                                    "text-sm capitalize",
                                                    level === 'HIGH' ? 'text-green-300' :
                                                    level === 'MEDIUM' ? 'text-yellow-300' :
                                                    level === 'LOW' ? 'text-red-300' :
                                                    'text-slate-300'
                                                )}>
                                                    <i className={cn(
                                                        "fas mr-2",
                                                        level === 'HIGH' ? 'fa-shield-check' :
                                                        level === 'MEDIUM' ? 'fa-shield-exclamation' :
                                                        level === 'LOW' ? 'fa-shield-x' :
                                                        'fa-shield-question'
                                                    )} />
                                                    {level} Trust
                                                </span>
                                                <span className="text-sm font-bold text-white">{count}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Reason Input */}
                {!showResults && requiresReason && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">
                            <i className="fas fa-exclamation-triangle text-red-400 mr-2" />
                            {operation.type === 'reject' ? 'Rejection Reason' : 'Deletion Reason'} (Required)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full min-h-[100px] px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            placeholder={`Describe why these ${operation.incidentIds.length} incidents are being ${operation.type || 'processed'}ed. This reason will be logged for audit purposes.`}
                            disabled={isProcessing}
                        />
                        <p className="text-xs text-slate-400">
                            <i className="fas fa-info-circle mr-1" />
                            This reason will be applied to all {operation.incidentIds.length} selected incidents.
                        </p>
                    </div>
                )}

                {/* Operation Progress */}
                {isProcessing && operationProgress && (
                    <Card className="bg-slate-900/50 border border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <i className="fas fa-spinner fa-spin mr-2 text-blue-400" />
                                Processing Operation...
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">Progress</span>
                                        <span className="text-white">
                                            {operationProgress.processed} / {operationProgress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: `${(operationProgress.processed / operationProgress.total) * 100}%` 
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Live Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-green-400">{operationProgress.successful}</div>
                                        <div className="text-xs text-slate-400">Successful</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-red-400">{operationProgress.failed}</div>
                                        <div className="text-xs text-slate-400">Failed</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-300">
                                            {operationProgress.total - operationProgress.processed}
                                        </div>
                                        <div className="text-xs text-slate-400">Remaining</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Operation Results */}
                {showResults && results && (
                    <div className="space-y-4">
                        <Card className={cn(
                            "border",
                            results.failed === 0 ? "border-green-500/30 bg-green-500/10" : 
                            results.successful === 0 ? "border-red-500/30 bg-red-500/10" :
                            "border-yellow-500/30 bg-yellow-500/10"
                        )}>
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <i className={cn(
                                        "fas mr-2 text-lg",
                                        results.failed === 0 ? "fa-check-circle text-green-400" :
                                        results.successful === 0 ? "fa-times-circle text-red-400" :
                                        "fa-exclamation-triangle text-yellow-400"
                                    )} />
                                    Operation Complete
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">{results.total}</div>
                                        <div className="text-xs text-slate-400">Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-400">{results.successful}</div>
                                        <div className="text-xs text-slate-400">Successful</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                                        <div className="text-xs text-slate-400">Failed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-300">{results.skipped}</div>
                                        <div className="text-xs text-slate-400">Skipped</div>
                                    </div>
                                </div>

                                <div className="text-center text-sm text-slate-400">
                                    <i className="fas fa-clock mr-1" />
                                    Completed in {results.execution_time_ms}ms
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error Details */}
                        {results.errors && results.errors.length > 0 && (
                            <Card className="bg-slate-900/50 border border-red-500/30">
                                <CardHeader>
                                    <CardTitle className="text-red-300 flex items-center">
                                        <i className="fas fa-exclamation-triangle mr-2" />
                                        Error Details ({results.errors.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {results.errors.map((error, index) => (
                                            <div key={index} className="p-2 bg-red-500/10 rounded text-sm">
                                                <div className="font-mono text-red-300">
                                                    {error.incident_id}: {error.error_code}
                                                </div>
                                                <div className="text-red-200 text-xs mt-1">
                                                    {error.error_message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default BulkOperationConfirmModal;