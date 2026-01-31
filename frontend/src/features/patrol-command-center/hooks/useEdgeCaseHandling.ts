/**
 * Edge Case Handling Hook
 * Handles edge cases like property deletion, officer deletion during patrol, etc.
 * Critical for production reliability
 */

import { useEffect, useCallback } from 'react';
import { showError, showWarning } from '../../../utils/toast';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { StateUpdateService } from '../../../services/StateUpdateService';
import type { PatrolProperty, PatrolOfficer, UpcomingPatrol } from '../types';

export interface UseEdgeCaseHandlingOptions {
    properties: PatrolProperty[];
    selectedPropertyId: string | null;
    setSelectedPropertyId: (id: string | null) => void;
    officers: PatrolOfficer[];
    upcomingPatrols: UpcomingPatrol[];
    setOfficers: React.Dispatch<React.SetStateAction<PatrolOfficer[]>>;
    setUpcomingPatrols: React.Dispatch<React.SetStateAction<UpcomingPatrol[]>>;
}

export function useEdgeCaseHandling(options: UseEdgeCaseHandlingOptions) {
    const {
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        officers,
        upcomingPatrols,
        setOfficers,
        setUpcomingPatrols
    } = options;

    // Handle property deletion while selected
    useEffect(() => {
        if (selectedPropertyId && !properties.find(p => p.id === selectedPropertyId)) {
            // Selected property was deleted
            if (properties.length > 0) {
                setSelectedPropertyId(properties[0].id);
                showWarning('Selected property was removed. Switched to first available property.');
            } else {
                setSelectedPropertyId(null);
                showWarning('Selected property was removed. No properties available.');
            }
        }
    }, [properties, selectedPropertyId, setSelectedPropertyId]);

    // Handle officer deletion while assigned to active patrol
    const validateOfficerDeletion = useCallback((officerId: string): boolean => {
        const officer = officers.find(o => o.id === officerId);
        if (!officer) return true; // Officer doesn't exist, allow deletion

        if (officer.status === 'on-duty' && officer.currentPatrol) {
            const activePatrol = upcomingPatrols.find(
                p => p.id === officer.currentPatrol && p.status === 'in-progress'
            );
            if (activePatrol) {
                showError(
                    `Cannot delete officer assigned to active patrol "${activePatrol.name}". ` +
                    'Reassign or complete the patrol first.'
                );
                return false;
            }
        }
        return true;
    }, [officers, upcomingPatrols]);

    // Handle route modification during active patrol
    const validateRouteModification = useCallback((routeId: string): boolean => {
        const activeOnRoute = upcomingPatrols.filter(
            p => p?.status === 'in-progress' && (p.routeId === routeId || p.location === routeId)
        );
        if (activeOnRoute.length > 0) {
            showError(
                `Cannot modify route: ${activeOnRoute.length} active patrol(s) are using it. ` +
                'Complete or cancel the patrol(s) first.'
            );
            return false;
        }
        return true;
    }, [upcomingPatrols]);

    // Handle checkpoint deletion during active patrol
    const validateCheckpointDeletion = useCallback((routeId: string): boolean => {
        return validateRouteModification(routeId);
    }, [validateRouteModification]);

    // Reconcile officer/patrol state mismatches
    useEffect(() => {
        const reconcileState = () => {
            // Find officers marked on-duty but not assigned to any active patrol
            const onDutyOfficers = officers.filter(o => o.status === 'on-duty');
            const activePatrols = upcomingPatrols.filter(p => p.status === 'in-progress');

            onDutyOfficers.forEach(officer => {
                const hasActivePatrol = activePatrols.some(p =>
                    p.assignedOfficer === officer.name && p.id === officer.currentPatrol
                );

                    if (!hasActivePatrol && officer.currentPatrol) {
                        // Officer marked on-duty but patrol is not active - reconcile
                        const patrol = upcomingPatrols.find(p => p.id === officer.currentPatrol);
                        if (patrol && patrol.status !== 'in-progress') {
                            setOfficers(prev => StateUpdateService.updateItem(prev, officer.id, {
                                status: 'off-duty',
                                currentPatrol: undefined
                            }));
                            ErrorHandlerService.handle(
                                new Error(`Reconciled officer ${officer.name} status: patrol ${patrol.id} is not in-progress`),
                                'reconcileOfficerState'
                            );
                        }
                    }
            });

            // Find active patrols without assigned officers or with officers marked off-duty
            activePatrols.forEach(patrol => {
                if (patrol.assignedOfficer) {
                    const assignedOfficer = officers.find(o => o.name === patrol.assignedOfficer);
                    if (assignedOfficer && assignedOfficer.status !== 'on-duty') {
                        // Patrol is active but officer is not on-duty - reconcile
                        setOfficers(prev => StateUpdateService.updateItem(prev, assignedOfficer.id, {
                            status: 'on-duty',
                            currentPatrol: patrol.id
                        }));
                        ErrorHandlerService.handle(
                            new Error(`Reconciled patrol ${patrol.id}: officer ${assignedOfficer.name} should be on-duty`),
                            'reconcilePatrolState'
                        );
                    }
                }
            });
        };

        // Reconcile on data changes (debounced)
        if (officers.length > 0 && upcomingPatrols.length > 0) {
            const timeoutId = setTimeout(reconcileState, 1000); // Debounce 1 second
            return () => clearTimeout(timeoutId);
        }
    }, [officers, upcomingPatrols, setOfficers]);

    return {
        validateOfficerDeletion,
        validateRouteModification,
        validateCheckpointDeletion
    };
}
