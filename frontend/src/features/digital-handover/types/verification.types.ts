/**
 * Digital Handover Module - Verification Types
 * 
 * Type definitions for dual-officer verification and signature workflows.
 */

import type { Handover } from './handover.types';

/**
 * Digital signature for verification
 */
export interface VerificationSignature {
  id: string;
  handoverId: string;
  officerId: string;
  officerName: string;
  signatureData: string; // Base64 encoded signature image or signature data
  signedAt: string; // ISO datetime string
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verification request/workflow state
 */
export interface VerificationRequest {
  id: string;
  handoverId: string;
  requestedBy: string; // Officer ID who requested verification
  requestedAt: string; // ISO datetime string
  status: VerificationRequestStatus;
  signatures: VerificationSignature[];
  completedAt?: string; // ISO datetime string
  notes?: string;
}

export type VerificationRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

/**
 * Request to initiate verification
 */
export interface CreateVerificationRequest {
  handoverId: string;
  requestingOfficerId: string;
  notes?: string;
}

/**
 * Submit signature for verification
 */
export interface SubmitVerificationSignatureRequest {
  handoverId: string;
  verificationRequestId?: string;
  officerId: string;
  signature: string;
  role: 'from' | 'to';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verification status summary
 */
export interface VerificationStatusSummary {
  handoverId: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'disputed';
  signaturesRequired: number;
  signaturesReceived: number;
  signatures: VerificationSignature[];
  canVerify: boolean; // Whether current user can verify
  lastUpdated: string;
}
