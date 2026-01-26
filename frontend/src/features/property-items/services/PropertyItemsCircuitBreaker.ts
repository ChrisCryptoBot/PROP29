/**
 * Property Items Circuit Breaker
 * Implements circuit breaker pattern for API calls to prevent cascading failures
 */

import { logger } from '../../../services/logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  halfOpenMaxAttempts: number; // Max attempts in half-open state
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenMaxAttempts: 3
};

class PropertyItemsCircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenAttempts: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
        logger.info('Circuit breaker transitioning to half-open', {
          module: 'PropertyItemsCircuitBreaker'
        });
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await fn();
      
      // Success - reset failure count
      if (this.state === 'half-open') {
        this.halfOpenAttempts++;
        if (this.halfOpenAttempts >= this.options.halfOpenMaxAttempts) {
          this.state = 'closed';
          this.failureCount = 0;
          this.halfOpenAttempts = 0;
          logger.info('Circuit breaker closed after successful half-open attempts', {
            module: 'PropertyItemsCircuitBreaker'
          });
        }
      } else {
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.state === 'half-open') {
        // Failed in half-open - go back to open
        this.state = 'open';
        this.halfOpenAttempts = 0;
        logger.warn('Circuit breaker opened after half-open failure', {
          module: 'PropertyItemsCircuitBreaker',
          failureCount: this.failureCount
        });
      } else if (this.failureCount >= this.options.failureThreshold) {
        // Too many failures - open circuit
        this.state = 'open';
        logger.error('Circuit breaker opened due to failure threshold', new Error('Circuit breaker opened'), {
          module: 'PropertyItemsCircuitBreaker',
          failureCount: this.failureCount,
          threshold: this.options.failureThreshold
        });
      }

      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset', {
      module: 'PropertyItemsCircuitBreaker'
    });
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
}

// Export singleton instances for different services
export const lostFoundCircuitBreaker = new PropertyItemsCircuitBreaker();
export const packageCircuitBreaker = new PropertyItemsCircuitBreaker();
export default PropertyItemsCircuitBreaker;
