/**
 * Centralized validation service for Patrol Command Center
 * Eliminates duplicate validation logic across handlers
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class ValidationService {
  /**
   * Validate required field
   */
  static required(value: string, fieldName: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        valid: false,
        error: `${fieldName} is required`
      };
    }
    return { valid: true };
  }

  /**
   * Validate unique name (case-insensitive)
   */
  static uniqueName<T extends { id: string; name: string }>(
    name: string,
    items: T[],
    itemType: string,
    excludeId?: string
  ): ValidationResult {
    const trimmedName = name.trim().toLowerCase();
    const duplicate = items.find(item =>
      item.name.toLowerCase() === trimmedName &&
      (!excludeId || item.id !== excludeId)
    );

    if (duplicate) {
      return {
        valid: false,
        error: `A ${itemType} with this name already exists`
      };
    }
    return { valid: true };
  }

  /**
   * Validate route exists
   */
  static routeExists<T extends { id: string }>(
    routeId: string,
    routes: T[]
  ): ValidationResult {
    const exists = routes.some(r => r.id === routeId);
    if (!exists) {
      return {
        valid: false,
        error: 'Selected route does not exist'
      };
    }
    return { valid: true };
  }

  /**
   * Validate time range
   */
  static timeRange(startTime: string, endTime: string): ValidationResult {
    if (!startTime || !endTime) {
      return {
        valid: false,
        error: 'Start and end times are required'
      };
    }

    if (startTime >= endTime) {
      return {
        valid: false,
        error: 'End time must be after start time'
      };
    }

    return { valid: true };
  }

  /**
   * Validate coordinates
   */
  static coordinates(lat: number, lng: number): ValidationResult {
    if (lat < -90 || lat > 90) {
      return {
        valid: false,
        error: 'Invalid latitude. Must be between -90 and 90'
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        valid: false,
        error: 'Invalid longitude. Must be between -180 and 180'
      };
    }

    return { valid: true };
  }

  /**
   * Validate estimated time (minutes)
   */
  static estimatedTime(minutes: number, min: number = 1, max: number = 60): ValidationResult {
    if (minutes < min || minutes > max) {
      return {
        valid: false,
        error: `Estimated time must be between ${min} and ${max} minutes`
      };
    }
    return { valid: true };
  }

  /**
   * Validate duration format
   */
  static durationFormat(duration: string): ValidationResult {
    const match = duration.match(/(\d+)\s*(min|hour|hr)/i);
    if (!match) {
      return {
        valid: false,
        error: 'Invalid duration format. Use format like "45 min" or "1 hour"'
      };
    }
    return { valid: true };
  }

  /**
   * Validate recurring template days
   */
  static recurringDays(days: string[], isRecurring: boolean): ValidationResult {
    if (isRecurring && (!days || days.length === 0)) {
      return {
        valid: false,
        error: 'Please select at least one day for recurring templates'
      };
    }
    return { valid: true };
  }
}
