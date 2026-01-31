/**
 * Patrol actions: deploy, complete, reassign, cancel, emergency alert.
 * Extracted from usePatrolState for modularity.
 */

import { useCallback } from 'react';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, dismissToast } from '../../../utils/toast';
import { StateUpdateService } from '../../../services/StateUpdateService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { usePatrolTelemetry } from './usePatrolTelemetry';
import type { PatrolOfficer, UpcomingPatrol, EmergencyStatus } from '../types';

export interface UsePatrolActionsArgs {
    officers: PatrolOfficer[];
    upcomingPatrols: UpcomingPatrol[];
    setOfficers: React.Dispatch<React.SetStateAction<PatrolOfficer[]>>;
    setUpcomingPatrols: React.Dispatch<React.SetStateAction<UpcomingPatrol[]>>;
    emergencyStatus: EmergencyStatus;
    setEmergencyStatus: React.Dispatch<React.SetStateAction<EmergencyStatus>>;
    refresh: () => Promise<void>;
    selectedPropertyId: string | null;
    operationQueue?: {
        enqueue: (operation: string, payload: Record<string, unknown>) => string;
    };
    setLastSyncTimestamp?: (timestamp: Date) => void;
    requestDedup?: {
        isDuplicate: (requestKey: string) => boolean;
        recordRequest: (requestKey: string, ...args: any[]) => void;
        clearRequest: (requestKey: string) => void;
    };
    operationLock?: {
        acquireLock: (operation: string, entityId: string) => boolean;
        releaseLock: (operation: string, entityId: string) => void;
        isLocked: (operation: string, entityId: string) => boolean;
    };
}

export function usePatrolActions({
    officers,
    upcomingPatrols,
    setOfficers,
    setUpcomingPatrols,
    emergencyStatus,
    setEmergencyStatus,
    refresh,
    selectedPropertyId,
    operationQueue,
    setLastSyncTimestamp,
    requestDedup,
    operationLock
}: UsePatrolActionsArgs) {
    const { trackAction, trackPerformance, trackError } = usePatrolTelemetry();
    
    const handleDeployOfficer = useCallback(
        async (officerId: string, patrolId: string) => {
            if (!officerId || !patrolId) {
                showError('Invalid officer or patrol ID');
                return;
            }
            const officer = officers.find((o) => o && o.id === officerId);
            if (!officer) {
                showError('Officer not found');
                return;
            }
            if (officer.status === 'on-duty') {
                showError('Officer is already deployed');
                return;
            }
            const patrol = upcomingPatrols.find((p) => p && p.id === patrolId);
            if (!patrol) {
                showError('Patrol not found');
                return;
            }
            if (patrol.status !== 'scheduled') {
                showError('Can only deploy to scheduled patrols');
                return;
            }
            // Check for duplicate request
            const requestKey = `deploy_officer-${patrolId}-${officerId}`;
            if (requestDedup?.isDuplicate(requestKey)) {
                showError('Deployment request already in progress. Please wait.');
                return;
            }
            requestDedup?.recordRequest(requestKey, patrolId, officerId);

            const toastId = showLoading('Deploying officer...');
            const startTime = Date.now();
            trackAction('deploy_officer_start', 'patrol', { officerId, patrolId });
            
            // Optimistic update
            const previousOfficerState = officer.status;
            const previousPatrolState = patrol.status;
            setOfficers((prev) => StateUpdateService.updateItem(prev, officerId, { status: 'on-duty', currentPatrol: patrolId }));
            setUpcomingPatrols((prev) =>
                StateUpdateService.updateItem(prev, patrolId, {
                    status: 'in-progress',
                    assignedOfficer: officer.name,
                    version: typeof patrol.version === 'number' ? patrol.version + 1 : undefined
                })
            );

            // Check if offline - enqueue if so
            if (!navigator.onLine && operationQueue) {
                operationQueue.enqueue('deploy_officer', {
                    patrolId,
                    officerId,
                    version: patrol.version
                });
                dismissToast(toastId);
                showSuccess('Deployment queued for sync when connection is restored');
                return;
            }

            try {
                const payload: { guard_id: string; status: string; version?: number } = {
                    guard_id: officerId,
                    status: 'active'
                };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                
                await retryWithBackoff(
                    () => PatrolEndpoint.updatePatrol(patrolId, payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000,
                        shouldRetry: (error) => {
                            const status = (error as { response?: { status?: number } })?.response?.status;
                            // Don't retry on 409 (conflict) or 4xx errors
                            if (status && status >= 400 && status < 500) return false;
                            // Retry on 5xx or network errors
                            return true;
                        }
                    }
                );
                
                const duration = Date.now() - startTime;
                trackPerformance('deploy_officer', duration, { officerId, patrolId });
                trackAction('deploy_officer_success', 'patrol', { officerId, patrolId, duration });
                setLastSyncTimestamp?.(new Date());
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('deploy_officer', patrolId);
                dismissLoadingAndShowSuccess(toastId, `Officer ${officer.name} deployed successfully!`);
            } catch (err: unknown) {
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('deploy_officer', patrolId);
                const isNetworkIssue = !navigator.onLine || !(err as { response?: unknown }).response;
                if (isNetworkIssue && operationQueue) {
                    // Enqueue for retry when online
                    operationQueue.enqueue('deploy_officer', {
                        patrolId,
                        officerId,
                        version: patrol.version
                    });
                    dismissToast(toastId);
                    showSuccess('Deployment queued for sync when connection is restored');
                    return;
                }
                const duration = Date.now() - startTime;
                trackError(err as Error, { action: 'deploy_officer', officerId, patrolId, duration });
                // Rollback optimistic update
                setOfficers((prev) => StateUpdateService.updateItem(prev, officerId, { status: previousOfficerState, currentPatrol: undefined }));
                setUpcomingPatrols((prev) =>
                    StateUpdateService.updateItem(prev, patrolId, {
                        status: previousPatrolState,
                        assignedOfficer: patrol.assignedOfficer,
                        version: patrol.version
                    })
                );

                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                dismissLoadingAndShowError(toastId, 'Failed to deploy officer. Please try again.');
                ErrorHandlerService.handle(err, 'deployOfficer');
            }
        },
        [officers, upcomingPatrols, setOfficers, setUpcomingPatrols, refresh]
    );

    const handleCompletePatrol = useCallback(
        async (patrolId: string) => {
            if (!patrolId) {
                showError('Invalid patrol ID');
                return;
            }
            const patrol = upcomingPatrols.find((p) => p && p.id === patrolId);
            if (!patrol) {
                showError('Patrol not found');
                return;
            }
            if (patrol.status === 'completed') {
                showError('Patrol is already completed');
                return;
            }
            if (patrol.status !== 'in-progress') {
                showError('Can only complete patrols that are in progress');
                return;
            }
            const toastId = showLoading('Completing patrol...');
            const startTime = Date.now();
            const requestKey = `complete_patrol-${patrolId}`;
            trackAction('complete_patrol_start', 'patrol', { patrolId });
            
            // Optimistic update
            const previousPatrolState = patrol.status;
            const previousOfficerState = patrol.assignedOfficer ? officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId)?.status : undefined;
            setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: 'completed' }));
            if (patrol.assignedOfficer) {
                const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                if (assigned) {
                    setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: 'off-duty', currentPatrol: undefined }));
                }
            }

            // Check if offline - enqueue if so
            if (!navigator.onLine && operationQueue) {
                operationQueue.enqueue('complete_patrol', {
                    patrolId,
                    version: patrol.version
                });
                dismissToast(toastId);
                showSuccess('Patrol completion queued for sync when connection is restored');
                return;
            }

            try {
                const payload: { version?: number } = {};
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                
                await retryWithBackoff(
                    () => PatrolEndpoint.completePatrol(patrolId, payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000,
                        shouldRetry: (error) => {
                            const status = (error as { response?: { status?: number } })?.response?.status;
                            // Don't retry on 409 (conflict) or 4xx errors
                            if (status && status >= 400 && status < 500) return false;
                            // Retry on 5xx or network errors
                            return true;
                        }
                    }
                );
                const duration = Date.now() - startTime;
                trackPerformance('complete_patrol', duration, { patrolId });
                trackAction('complete_patrol_success', 'patrol', { patrolId, duration });
                setLastSyncTimestamp?.(new Date());
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('complete_patrol', patrolId);
                dismissLoadingAndShowSuccess(toastId, 'Patrol completed successfully!');
            } catch (e) {
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('complete_patrol', patrolId);
                const isNetworkIssue = !navigator.onLine || !(e as { response?: unknown }).response;
                if (isNetworkIssue && operationQueue) {
                    // Enqueue for retry when online
                    operationQueue.enqueue('complete_patrol', {
                        patrolId,
                        version: patrol.version
                    });
                    dismissToast(toastId);
                    showSuccess('Patrol completion queued for sync when connection is restored');
                    return;
                }
                const duration = Date.now() - startTime;
                trackError(e as Error, { action: 'complete_patrol', patrolId, duration });
                // Rollback optimistic update
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: previousPatrolState }));
                if (patrol.assignedOfficer && previousOfficerState) {
                    const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                    if (assigned) {
                        setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: previousOfficerState, currentPatrol: patrolId }));
                    }
                }
                const status = (e as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                dismissLoadingAndShowError(toastId, 'Failed to complete patrol. Please try again.');
                ErrorHandlerService.handle(e, 'completePatrol');
            }
        },
        [officers, upcomingPatrols, setOfficers, setUpcomingPatrols, refresh]
    );

    const handleReassignOfficer = useCallback(
        async (patrolId: string, newOfficerId: string) => {
            if (!patrolId || !newOfficerId) {
                showError('Invalid patrol or officer ID');
                return;
            }
            const patrol = upcomingPatrols.find((p) => p && p.id === patrolId);
            if (!patrol) {
                showError('Patrol not found');
                return;
            }
            if (patrol.status === 'completed' || patrol.status === 'cancelled') {
                showError('Cannot reassign officer to a completed or cancelled patrol');
                return;
            }
            const newOfficer = officers.find((o) => o && o.id === newOfficerId);
            if (!newOfficer) {
                showError('Officer not found');
                return;
            }
            if (newOfficer.status === 'on-duty' && newOfficer.currentPatrol && newOfficer.currentPatrol !== patrolId) {
                showError('Officer is already assigned to another patrol');
                return;
            }
            if (patrol.assignedOfficer === newOfficer.name) {
                showError('Officer is already assigned to this patrol');
                return;
            }
            const toastId = showLoading('Reassigning officer...');
            const requestKey = `reassign_officer-${patrolId}-${newOfficerId}`;
            
            // Optimistic update
            const previousPatrolOfficer = patrol.assignedOfficer;
            const oldOfficer = officers.find((o) => o && o.name === patrol.assignedOfficer);
            const previousOldOfficerState = oldOfficer ? oldOfficer.status : undefined;
            const previousNewOfficerState = newOfficer.status;
            
            setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { assignedOfficer: newOfficer.name }));
            if (oldOfficer) {
                setOfficers((prev) => StateUpdateService.updateItem(prev, oldOfficer.id, { status: 'off-duty', currentPatrol: undefined }));
            }
            setOfficers((prev) => StateUpdateService.updateItem(prev, newOfficerId, { status: 'on-duty', currentPatrol: patrolId }));

            // Check if offline - enqueue if so
            if (!navigator.onLine && operationQueue) {
                operationQueue.enqueue('reassign_officer', {
                    patrolId,
                    newOfficerId,
                    version: patrol.version
                });
                dismissToast(toastId);
                showSuccess('Officer reassignment queued for sync when connection is restored');
                return;
            }

            try {
                const payload: { guard_id: string; version?: number } = { guard_id: newOfficerId };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                
                await retryWithBackoff(
                    () => PatrolEndpoint.updatePatrol(patrolId, payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000,
                        shouldRetry: (error) => {
                            const status = (error as { response?: { status?: number } })?.response?.status;
                            if (status && status >= 400 && status < 500) return false;
                            return true;
                        }
                    }
                );
                
                setLastSyncTimestamp?.(new Date());
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('reassign_officer', patrolId);
                dismissLoadingAndShowSuccess(toastId, `Officer ${newOfficer.name} assigned to patrol successfully`);
            } catch (err: unknown) {
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('reassign_officer', patrolId);
                const isNetworkIssue = !navigator.onLine || !(err as { response?: unknown }).response;
                if (isNetworkIssue && operationQueue) {
                    // Enqueue for retry when online
                    operationQueue.enqueue('reassign_officer', {
                        patrolId,
                        newOfficerId,
                        version: patrol.version
                    });
                    dismissToast(toastId);
                    showSuccess('Officer reassignment queued for sync when connection is restored');
                    return;
                }
                // Rollback optimistic update
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { assignedOfficer: previousPatrolOfficer }));
                if (oldOfficer && previousOldOfficerState) {
                    setOfficers((prev) => StateUpdateService.updateItem(prev, oldOfficer.id, { status: previousOldOfficerState, currentPatrol: patrolId }));
                }
                setOfficers((prev) => StateUpdateService.updateItem(prev, newOfficerId, { status: previousNewOfficerState, currentPatrol: undefined }));

                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                ErrorHandlerService.handle(err, 'reassignOfficer');
                dismissLoadingAndShowError(toastId, 'Failed to reassign officer. Please try again.');
            }
        },
        [officers, upcomingPatrols, setOfficers, setUpcomingPatrols, refresh]
    );

    const handleCancelPatrol = useCallback(
        async (patrolId: string) => {
            if (!patrolId) return;
            const patrol = upcomingPatrols.find((p) => p && p.id === patrolId);
            if (!patrol) {
                showError('Patrol not found');
                return;
            }
            if (patrol.status === 'completed' || patrol.status === 'cancelled') {
                showError('Cannot cancel completed/cancelled patrol');
                return;
            }
            const toastId = showLoading('Cancelling patrol...');
            const requestKey = `cancel_patrol-${patrolId}`;
            
            // Optimistic update
            const previousPatrolState = patrol.status;
            const previousOfficerState = patrol.assignedOfficer ? officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId)?.status : undefined;
            setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: 'cancelled' }));
            if (patrol.assignedOfficer) {
                const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                if (assigned) {
                    setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: 'off-duty', currentPatrol: undefined }));
                }
            }

            // Check if offline - enqueue if so
            if (!navigator.onLine && operationQueue) {
                operationQueue.enqueue('cancel_patrol', {
                    patrolId,
                    version: patrol.version
                });
                dismissToast(toastId);
                showSuccess('Patrol cancellation queued for sync when connection is restored');
                return;
            }

            try {
                const payload: { status: string; version?: number } = { status: 'interrupted' };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                
                await retryWithBackoff(
                    () => PatrolEndpoint.updatePatrol(patrolId, payload),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000,
                        shouldRetry: (error) => {
                            const status = (error as { response?: { status?: number } })?.response?.status;
                            if (status && status >= 400 && status < 500) return false;
                            return true;
                        }
                    }
                );
                
                setLastSyncTimestamp?.(new Date());
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('cancel_patrol', patrolId);
                dismissLoadingAndShowSuccess(toastId, 'Patrol cancelled successfully');
            } catch (err: unknown) {
                requestDedup?.clearRequest(requestKey);
                operationLock?.releaseLock('cancel_patrol', patrolId);
                const isNetworkIssue = !navigator.onLine || !(err as { response?: unknown }).response;
                if (isNetworkIssue && operationQueue) {
                    // Enqueue for retry when online
                    operationQueue.enqueue('cancel_patrol', {
                        patrolId,
                        version: patrol.version
                    });
                    dismissToast(toastId);
                    showSuccess('Patrol cancellation queued for sync when connection is restored');
                    return;
                }
                // Rollback optimistic update
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: previousPatrolState }));
                if (patrol.assignedOfficer && previousOfficerState) {
                    const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                    if (assigned) {
                        setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: previousOfficerState, currentPatrol: patrolId }));
                    }
                }

                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                dismissLoadingAndShowError(toastId, 'Failed to cancel patrol. Please try again.');
                ErrorHandlerService.handle(err, 'cancelPatrol');
            }
        },
        [officers, upcomingPatrols, setOfficers, setUpcomingPatrols, refresh]
    );

    const handleEmergencyAlert = useCallback(async () => {
        const onDuty = officers.filter((o) => o.status === 'on-duty');
        if (onDuty.length === 0) {
            showError('No officers on duty to alert');
            return;
        }
        // Check for duplicate request (use timestamp to allow multiple alerts, but prevent rapid duplicates)
        const requestKey = `emergency_alert-${Date.now()}`;
        // Allow multiple emergency alerts, but prevent duplicates within 1 second
        const recentKey = `emergency_alert-recent`;
        if (requestDedup?.isDuplicate(recentKey)) {
            showError('Emergency alert request already in progress. Please wait.');
            return;
        }
        requestDedup?.recordRequest(recentKey);

        const toastId = showLoading('Sending emergency alert...');
        const startTime = Date.now();
        const previousEmergencyStatus = { ...emergencyStatus };
        trackAction('emergency_alert_start', 'emergency', { officerCount: onDuty.length });
        
        // Optimistic update
        setEmergencyStatus((prev) => ({
            ...prev,
            level: 'critical',
            message: 'Emergency alert active',
            lastUpdated: 'Just now',
            activeAlerts: (prev.activeAlerts || 0) + 1
        }));

        try {
            await retryWithBackoff(
                () => PatrolEndpoint.createEmergencyAlert({
                    property_id: selectedPropertyId || undefined,
                    severity: 'critical',
                    message: 'Emergency alert active'
                }),
                {
                    maxRetries: 5, // More retries for critical emergency alerts
                    baseDelay: 500,
                    maxDelay: 3000
                }
            );
            const duration = Date.now() - startTime;
            trackPerformance('emergency_alert', duration, { officerCount: onDuty.length });
            trackAction('emergency_alert_success', 'emergency', { officerCount: onDuty.length, duration });
            dismissLoadingAndShowSuccess(toastId, `Emergency alert sent to ${onDuty.length} officer(s)!`);
        } catch (error) {
            const duration = Date.now() - startTime;
            trackError(error as Error, { action: 'emergency_alert', officerCount: onDuty.length, duration });
            // Rollback optimistic update
            setEmergencyStatus(previousEmergencyStatus);
            dismissLoadingAndShowError(toastId, 'Failed to send emergency alert. Please try again or contact support.');
            ErrorHandlerService.handle(error, 'emergencyAlert');
        }
    }, [officers, selectedPropertyId, setEmergencyStatus, emergencyStatus, trackAction, trackPerformance, trackError, operationQueue, setLastSyncTimestamp, requestDedup, operationLock]);

    return {
        handleDeployOfficer,
        handleCompletePatrol,
        handleReassignOfficer,
        handleCancelPatrol,
        handleEmergencyAlert
    };
}
