/**
 * Retry utility with exponential backoff
 * Shared utility for API call retries across all modules
 */

import { logger } from '../services/logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          module: 'retryWithBackoff',
          attempt: attempt + 1,
          maxRetries,
          delay
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Default retry logic: retry on network errors, don't retry on 4xx client errors
 */
function defaultShouldRetry(error: unknown): boolean {
  // Don't retry on 4xx errors (client errors)
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      // Retry on 5xx (server errors) and network errors (no response)
      // Don't retry on 4xx (client errors)
      return status >= 500 || !axiosError.response;
    }
  }

  // Retry on network errors (no response object)
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message?: string };
    if (err.message?.includes('Network Error') || err.message?.includes('timeout')) {
      return true;
    }
  }

  // Default: retry on unknown errors (likely network issues)
  return true;
}
