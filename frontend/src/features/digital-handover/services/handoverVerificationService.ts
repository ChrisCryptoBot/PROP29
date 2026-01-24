/**
 * Digital Handover Verification Service
 * 
 * Service layer for dual-officer verification and signature workflows.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type {
  VerificationRequest,
  VerificationStatusSummary,
  CreateVerificationRequest,
  SubmitVerificationSignatureRequest,
} from '../types';

/**
 * Handover Verification Service
 */
export const handoverVerificationService = {
  /**
   * Get verification status for a handover
   */
  async getVerificationStatus(handoverId: string, propertyId?: string): Promise<VerificationStatusSummary> {
    try {
      const params = propertyId ? { property_id: propertyId } : undefined;
      const response = await apiService.get<VerificationStatusSummary>(
        `/api/handovers/${handoverId}/verification`,
        { params }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to fetch verification status for handover ${handoverId}`);
      }
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to fetch verification status for handover ${handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverVerificationService', action: 'getVerificationStatus', handoverId, propertyId }
      );
      throw error;
    }
  },

  /**
   * Request verification for a handover
   */
  async requestVerification(data: CreateVerificationRequest, propertyId?: string): Promise<VerificationRequest> {
    try {
      const response = await apiService.post<VerificationRequest>(
        `/api/handovers/${data.handoverId}/verification/request`,
        { ...data, property_id: propertyId }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to request verification for handover ${data.handoverId}`);
      }
      logger.info('Verification requested successfully', {
        module: 'handoverVerificationService',
        action: 'requestVerification',
        handoverId: data.handoverId,
        requestId: response.data.id,
      });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to request verification for handover ${data.handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverVerificationService', action: 'requestVerification', data, propertyId }
      );
      throw error;
    }
  },

  /**
   * Submit verification signature
   */
  async submitSignature(data: SubmitVerificationSignatureRequest, propertyId?: string): Promise<VerificationRequest> {
    try {
      // Backend expects signature and role in body
      const response = await apiService.post<VerificationRequest>(
        `/api/handovers/${data.handoverId}/verification/signature`,
        {
          signature: data.signature,
          role: data.role,
          property_id: propertyId
        }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to submit verification signature for handover ${data.handoverId}`);
      }
      logger.info('Verification signature submitted successfully', {
        module: 'handoverVerificationService',
        action: 'submitSignature',
        handoverId: data.handoverId,
      });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to submit verification signature for handover ${data.handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverVerificationService', action: 'submitSignature', data, propertyId }
      );
      throw error;
    }
  },

  /**
   * Get verification request by ID (Optional/legacy fallback)
   */
  async getVerificationRequest(requestId: string, propertyId?: string): Promise<VerificationRequest> {
    try {
      const params = propertyId ? { property_id: propertyId } : undefined;
      const response = await apiService.get<VerificationRequest>(
        `/api/handovers/verification/${requestId}`,
        { params }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to fetch verification request ${requestId}`);
      }
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to fetch verification request ${requestId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverVerificationService', action: 'getVerificationRequest', requestId, propertyId }
      );
      throw error;
    }
  },
};
