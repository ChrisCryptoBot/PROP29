/**
 * useHandoverVerification Hook
 * 
 * Custom hook for dual-officer verification and signature workflows.
 * Strategic feature: Verification signatures
 */

import { useState, useEffect, useCallback } from 'react';
import { handoverVerificationService } from '../services/handoverVerificationService';
import { logger } from '../../../services/logger';
import type {
  VerificationRequest,
  VerificationStatusSummary,
  CreateVerificationRequest,
  SubmitVerificationSignatureRequest,
} from '../types';

export interface UseHandoverVerificationReturn {
  // Data
  verificationStatus: VerificationStatusSummary | null;
  verificationRequest: VerificationRequest | null;

  // Loading states
  loading: boolean;
  error: Error | null;
  submitting: boolean;

  // Operations
  loadVerificationStatus: (handoverId: string, propertyId?: string) => Promise<void>;
  requestVerification: (data: CreateVerificationRequest, propertyId?: string) => Promise<VerificationRequest>;
  submitSignature: (data: SubmitVerificationSignatureRequest, propertyId?: string) => Promise<VerificationRequest>;
  loadVerificationRequest: (requestId: string, propertyId?: string) => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;

  // Current handover ID
  handoverId: string | null;
  setHandoverId: (id: string | null) => void;
}

/**
 * Hook for managing handover verification workflows
 */
export function useHandoverVerification(initialHandoverId?: string): UseHandoverVerificationReturn {
  // State
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusSummary | null>(null);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [handoverId, setHandoverId] = useState<string | null>(initialHandoverId || null);

  /**
   * Load verification status
   */
  const loadVerificationStatus = useCallback(async (id: string, propId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propId || localStorage.getItem('propertyId') || '';
      const status = await handoverVerificationService.getVerificationStatus(id, activePropertyId);
      setVerificationStatus(status);
      setHandoverId(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load verification status', error, { module: 'useHandoverVerification', action: 'loadVerificationStatus', handoverId: id });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load verification status when handoverId changes
   */
  useEffect(() => {
    if (handoverId) {
      loadVerificationStatus(handoverId);
    }
  }, [handoverId, loadVerificationStatus]);

  /**
   * Request verification for a handover
   */
  const requestVerification = useCallback(async (data: CreateVerificationRequest, propId?: string): Promise<VerificationRequest> => {
    try {
      setSubmitting(true);
      setError(null);
      const activePropertyId = propId || localStorage.getItem('propertyId') || '';
      const request = await handoverVerificationService.requestVerification(data, activePropertyId);
      setVerificationRequest(request);

      // Reload verification status
      if (data.handoverId) {
        await loadVerificationStatus(data.handoverId, activePropertyId);
      }

      return request;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to request verification', error, { module: 'useHandoverVerification', action: 'requestVerification', data });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [loadVerificationStatus]);

  /**
   * Submit verification signature
   */
  const submitSignature = useCallback(async (data: SubmitVerificationSignatureRequest, propId?: string): Promise<VerificationRequest> => {
    try {
      setSubmitting(true);
      setError(null);
      const activePropertyId = propId || localStorage.getItem('propertyId') || '';
      const request = await handoverVerificationService.submitSignature(data, activePropertyId);
      setVerificationRequest(request);

      // Reload verification status if we have the handoverId
      if (data.handoverId || handoverId) {
        await loadVerificationStatus(data.handoverId || handoverId!, activePropertyId);
      }

      return request;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to submit signature', error, { module: 'useHandoverVerification', action: 'submitSignature', data });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [handoverId, loadVerificationStatus]);

  /**
   * Load verification request by ID
   */
  const loadVerificationRequest = useCallback(async (requestId: string, propId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propId || localStorage.getItem('propertyId') || '';
      const request = await handoverVerificationService.getVerificationRequest(requestId, activePropertyId);
      setVerificationRequest(request);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load verification request', error, { module: 'useHandoverVerification', action: 'loadVerificationRequest', requestId });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh verification status
   */
  const refreshVerificationStatus = useCallback(async (): Promise<void> => {
    if (handoverId) {
      await loadVerificationStatus(handoverId);
    }
  }, [handoverId, loadVerificationStatus]);

  return {
    // Data
    verificationStatus,
    verificationRequest,

    // Loading states
    loading,
    error,
    submitting,

    // Operations
    loadVerificationStatus,
    requestVerification,
    submitSignature,
    loadVerificationRequest,
    refreshVerificationStatus,

    // Current handover ID
    handoverId,
    setHandoverId,
  };
}
