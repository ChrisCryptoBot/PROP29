/**
 * Patrol actions: deploy, complete, reassign, cancel, emergency alert.
 * Extracted from usePatrolState for modularity.
 */

import { useCallback } from 'react';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';
import { StateUpdateService } from '../../../services/StateUpdateService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import type { PatrolOfficer, UpcomingPatrol, EmergencyStatus } from '../types';

export interface UsePatrolActionsArgs {
    officers: PatrolOfficer[];
    upcomingPatrols: UpcomingPatrol[];
    setOfficers: React.Dispatch<React.SetStateAction<PatrolOfficer[]>>;
    setUpcomingPatrols: React.Dispatch<React.SetStateAction<UpcomingPatrol[]>>;
    setEmergencyStatus: React.Dispatch<React.SetStateAction<EmergencyStatus>>;
    refresh: () => Promise<void>;
    selectedPropertyId: string | null;
}

export function usePatrolActions({
    officers,
    upcomingPatrols,
    setOfficers,
    setUpcomingPatrols,
    setEmergencyStatus,
    refresh,
    selectedPropertyId
}: UsePatrolActionsArgs) {
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
            const toastId = showLoading('Deploying officer...');
            try {
                const payload: { guard_id: string; status: string; version?: number } = {
                    guard_id: officerId,
                    status: 'active'
                };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                await PatrolEndpoint.updatePatrol(patrolId, payload);
                setOfficers((prev) => StateUpdateService.updateItem(prev, officerId, { status: 'on-duty', currentPatrol: patrolId }));
                setUpcomingPatrols((prev) =>
                    StateUpdateService.updateItem(prev, patrolId, {
                        status: 'in-progress',
                        assignedOfficer: officer.name,
                        version: typeof patrol.version === 'number' ? patrol.version + 1 : undefined
                    })
                );
                dismissLoadingAndShowSuccess(toastId, `Officer ${officer.name} deployed successfully!`);
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                dismissLoadingAndShowError(toastId, 'Failed to deploy officer');
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
            try {
                await PatrolEndpoint.completePatrol(patrolId);
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: 'completed' }));
                if (patrol.assignedOfficer) {
                    const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                    if (assigned) {
                        setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: 'off-duty', currentPatrol: undefined }));
                    }
                }
                dismissLoadingAndShowSuccess(toastId, 'Patrol completed successfully!');
            } catch (e) {
                dismissLoadingAndShowError(toastId, 'Failed to complete patrol');
            }
        },
        [officers, upcomingPatrols, setOfficers, setUpcomingPatrols]
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
            try {
                const payload: { guard_id: string; version?: number } = { guard_id: newOfficerId };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                await PatrolEndpoint.updatePatrol(patrolId, payload);
                const oldOfficer = officers.find((o) => o && o.name === patrol.assignedOfficer);
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { assignedOfficer: newOfficer.name }));
                if (oldOfficer) {
                    setOfficers((prev) => StateUpdateService.updateItem(prev, oldOfficer.id, { status: 'off-duty', currentPatrol: undefined }));
                }
                setOfficers((prev) => StateUpdateService.updateItem(prev, newOfficerId, { status: 'on-duty', currentPatrol: patrolId }));
                dismissLoadingAndShowSuccess(toastId, `Officer ${newOfficer.name} assigned to patrol successfully`);
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                ErrorHandlerService.handle(err, 'reassignOfficer');
                dismissLoadingAndShowError(toastId, 'Failed to reassign officer');
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
            try {
                const payload: { status: string; version?: number } = { status: 'interrupted' };
                if (typeof patrol.version === 'number') payload.version = patrol.version;
                await PatrolEndpoint.updatePatrol(patrolId, payload);
                setUpcomingPatrols((prev) => StateUpdateService.updateItem(prev, patrolId, { status: 'cancelled' }));
                if (patrol.assignedOfficer) {
                    const assigned = officers.find((o) => o && o.name === patrol.assignedOfficer && o.currentPatrol === patrolId);
                    if (assigned) {
                        setOfficers((prev) => StateUpdateService.updateItem(prev, assigned.id, { status: 'off-duty', currentPatrol: undefined }));
                    }
                }
                dismissLoadingAndShowSuccess(toastId, 'Patrol cancelled successfully');
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    dismissLoadingAndShowError(toastId, 'Conflict — patrol was updated elsewhere. Refreshing.');
                    await refresh();
                    return;
                }
                dismissLoadingAndShowError(toastId, 'Failed to cancel patrol');
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
        const toastId = showLoading('Sending emergency alert...');
        try {
            await PatrolEndpoint.createEmergencyAlert({
                property_id: selectedPropertyId || undefined,
                severity: 'critical',
                message: 'Emergency alert active'
            });
            setEmergencyStatus((prev) => ({
                ...prev,
                level: 'critical',
                message: 'Emergency alert active',
                lastUpdated: 'Just now',
                activeAlerts: (prev.activeAlerts || 0) + 1
            }));
            dismissLoadingAndShowSuccess(toastId, `Emergency alert sent to ${onDuty.length} officer(s)!`);
        } catch {
            dismissLoadingAndShowError(toastId, 'Failed to send emergency alert');
        }
    }, [officers, selectedPropertyId, setEmergencyStatus]);

    return {
        handleDeployOfficer,
        handleCompletePatrol,
        handleReassignOfficer,
        handleCancelPatrol,
        handleEmergencyAlert
    };
}
