/**
 * Runtime data validation for Patrol Command Center API responses
 * Validates data structure and types to prevent runtime errors
 */

import { logger } from '../../../services/logger';
import type { PatrolOfficer, UpcomingPatrol, PatrolRoute, PatrolTemplate, Alert, PatrolMetrics } from '../types';

/**
 * Validate patrol officer data
 */
export function validatePatrolOfficer(data: unknown): data is PatrolOfficer {
    if (!data || typeof data !== 'object') return false;
    const officer = data as Record<string, unknown>;
    return (
        typeof officer.id === 'string' &&
        typeof officer.name === 'string' &&
        ['on-duty', 'off-duty', 'break', 'unavailable'].includes(officer.status as string)
    );
}

/**
 * Validate upcoming patrol data
 */
export function validateUpcomingPatrol(data: unknown): data is UpcomingPatrol {
    if (!data || typeof data !== 'object') return false;
    const patrol = data as Record<string, unknown>;
    return (
        typeof patrol.id === 'string' &&
        typeof patrol.name === 'string' &&
        ['scheduled', 'in-progress', 'completed', 'cancelled'].includes(patrol.status as string)
    );
}

/**
 * Validate patrol route data
 */
export function validatePatrolRoute(data: unknown): data is PatrolRoute {
    if (!data || typeof data !== 'object') return false;
    const route = data as Record<string, unknown>;
    return (
        typeof route.id === 'string' &&
        typeof route.name === 'string' &&
        Array.isArray(route.checkpoints)
    );
}

/**
 * Validate patrol template data
 */
export function validatePatrolTemplate(data: unknown): data is PatrolTemplate {
    if (!data || typeof data !== 'object') return false;
    const template = data as Record<string, unknown>;
    return (
        typeof template.id === 'string' &&
        typeof template.name === 'string' &&
        typeof template.routeId === 'string'
    );
}

/**
 * Validate alert data
 */
export function validateAlert(data: unknown): data is Alert {
    if (!data || typeof data !== 'object') return false;
    const alert = data as Record<string, unknown>;
    return (
        typeof alert.id === 'string' &&
        typeof alert.message === 'string' &&
        ['low', 'medium', 'high', 'critical'].includes(alert.severity as string)
    );
}

/**
 * Validate and sanitize array of patrol officers
 */
export function validatePatrolOfficersArray(data: unknown): PatrolOfficer[] {
    if (!Array.isArray(data)) {
        logger.warn('Invalid officers data: not an array', { module: 'validatePatrolData' });
        return [];
    }
    return data.filter(validatePatrolOfficer);
}

/**
 * Validate and sanitize array of upcoming patrols
 */
export function validateUpcomingPatrolsArray(data: unknown): UpcomingPatrol[] {
    if (!Array.isArray(data)) {
        logger.warn('Invalid patrols data: not an array', { module: 'validatePatrolData' });
        return [];
    }
    return data.filter(validateUpcomingPatrol);
}

/**
 * Validate and sanitize array of patrol routes
 */
export function validatePatrolRoutesArray(data: unknown): PatrolRoute[] {
    if (!Array.isArray(data)) {
        logger.warn('Invalid routes data: not an array', { module: 'validatePatrolData' });
        return [];
    }
    return data.filter(validatePatrolRoute);
}

/**
 * Validate and sanitize array of patrol templates
 */
export function validatePatrolTemplatesArray(data: unknown): PatrolTemplate[] {
    if (!Array.isArray(data)) {
        logger.warn('Invalid templates data: not an array', { module: 'validatePatrolData' });
        return [];
    }
    return data.filter(validatePatrolTemplate);
}

/**
 * Validate and sanitize array of alerts
 */
export function validateAlertsArray(data: unknown): Alert[] {
    if (!Array.isArray(data)) {
        logger.warn('Invalid alerts data: not an array', { module: 'validatePatrolData' });
        return [];
    }
    return data.filter(validateAlert);
}

/**
 * Validate patrol metrics
 */
export function validatePatrolMetrics(data: unknown): Partial<PatrolMetrics> {
    if (!data || typeof data !== 'object') {
        logger.warn('Invalid metrics data: not an object', { module: 'validatePatrolData' });
        return {};
    }
    const metrics = data as Record<string, unknown>;
    const validated: Partial<PatrolMetrics> = {};
    
    if (typeof metrics.total_patrols === 'number') validated.totalPatrols = metrics.total_patrols;
    if (typeof metrics.completed_patrols === 'number') validated.completedPatrols = metrics.completed_patrols;
    if (typeof metrics.average_efficiency_score === 'number') validated.averageEfficiencyScore = metrics.average_efficiency_score;
    if (typeof metrics.average_duration === 'number') validated.averagePatrolDurationMinutes = metrics.average_duration;
    if (typeof metrics.incidents_found === 'number') validated.incidentsFound = metrics.incidents_found;
    
    return validated;
}
