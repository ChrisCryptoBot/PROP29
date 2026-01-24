/**
 * Centralized patrol creation service
 * Unifies patrol creation logic from templates, routes, and manual creation
 */

import { ValidationService, ValidationResult } from './ValidationService';
import { IdGeneratorService } from './IdGeneratorService';
import { ConfigService } from './ConfigService';

export interface UpcomingPatrol {
  id: string;
  name: string;
  assignedOfficer: string;
  startTime: string;
  duration: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  description: string;
  routeId?: string; // Added for checkpoint tracking
}

export interface PatrolTemplate {
  id: string;
  name: string;
  description: string;
  routeId: string;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Checkpoint {
  id: string;
  name: string;
  location: string;
  isCritical?: boolean;
  estimatedTime?: number;
}

export interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  estimatedDuration: string;
  checkpoints: Checkpoint[];
}

export class PatrolCreationService {
  /**
   * Create patrol from template
   */
  static createFromTemplate(
    template: PatrolTemplate,
    route?: PatrolRoute
  ): UpcomingPatrol {
    return {
      id: IdGeneratorService.generate('patrol'),
      name: template.name || 'Untitled Patrol',
      assignedOfficer: 'Unassigned',
      startTime: template.schedule.startTime,
      duration: route?.estimatedDuration || ConfigService.DEFAULT_PATROL_DURATION,
      priority: template.priority || ConfigService.DEFAULT_PRIORITY,
      status: 'scheduled',
      location: route?.description || 'Various',
      description: template.description || '',
      routeId: route?.id || template.routeId
    };
  }

  /**
   * Create patrol from route
   */
  static createFromRoute(route: PatrolRoute): UpcomingPatrol {
    return {
      id: IdGeneratorService.generate('patrol'),
      name: `Patrol: ${route.name || 'Unnamed Route'}`,
      assignedOfficer: 'Unassigned',
      startTime: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: route.estimatedDuration || ConfigService.DEFAULT_PATROL_DURATION,
      priority: ConfigService.DEFAULT_PRIORITY,
      status: 'scheduled',
      location: 'Route',
      description: route.description || '',
      routeId: route.id
    };
  }

  /**
   * Create custom patrol
   */
  static createCustom(data: Partial<UpcomingPatrol>): UpcomingPatrol {
    return {
      id: IdGeneratorService.generate('patrol'),
      name: data.name || 'Custom Patrol',
      assignedOfficer: data.assignedOfficer || 'Unassigned',
      startTime: data.startTime || new Date().toISOString(),
      duration: data.duration || ConfigService.DEFAULT_PATROL_DURATION,
      priority: data.priority || ConfigService.DEFAULT_PRIORITY,
      status: data.status || 'scheduled',
      location: data.location || '',
      description: data.description || ''
    };
  }

  /**
   * Validate patrol before creation
   */
  static validatePatrol(patrol: Partial<UpcomingPatrol>): ValidationResult {
    const nameValidation = ValidationService.required(patrol.name || '', 'Patrol name');
    if (!nameValidation.valid) return nameValidation;

    if (patrol.startTime) {
      // Additional validation can be added here
    }

    return { valid: true };
  }
}
