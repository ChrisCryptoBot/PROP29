/**
 * Configuration service for Patrol Command Center
 * Centralizes default values and configuration
 */

export class ConfigService {
  // Default coordinates (New York City - can be configured)
  static readonly DEFAULT_COORDINATES = { lat: 40.7128, lng: -74.0060 };

  // Default checkpoint time (minutes)
  static readonly DEFAULT_CHECKPOINT_TIME = 5;

  // Default patrol duration
  static readonly DEFAULT_PATROL_DURATION = '45 min';

  // Default priorities
  static readonly DEFAULT_PRIORITY = 'medium' as const;
  static readonly DEFAULT_DIFFICULTY = 'medium' as const;
  static readonly DEFAULT_FREQUENCY = 'hourly' as const;

  // API timeout (ms)
  static readonly API_TIMEOUT = 1000;

  // Validation ranges
  static readonly MIN_CHECKPOINT_TIME = 1;
  static readonly MAX_CHECKPOINT_TIME = 60;
}
