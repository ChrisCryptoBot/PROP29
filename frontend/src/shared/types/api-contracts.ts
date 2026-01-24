/**
 * API Contract Types (DTOs)
 * These represent the actual structure of API requests/responses
 * Separate from entity types which represent the domain model
 * 
 * Why separate? Backend may return different structures than what the UI needs.
 * This prevents frontend brittleness when backend changes.
 */

import type { AccessPoint, AccessControlUser, AccessEvent, Credential } from './access-control.types';

// ============================================================================
// Access Control API Contracts
// ============================================================================

/**
 * API Response for fetching access points
 */
export interface GetAccessPointsResponse {
  data: AccessPoint[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

/**
 * API Response for creating/updating an access point
 */
export interface AccessPointResponse {
  data: AccessPoint;
  message?: string;
  success: boolean;
}

/**
 * API Response for fetching access events
 */
export interface GetAccessEventsResponse {
  data: AccessEvent[];
  filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    accessPointId?: string;
    action?: 'granted' | 'denied' | 'timeout';
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Request for creating an access event
 */
export interface CreateAccessEventRequest {
  userId: string;
  accessPointId: string;
  action: 'granted' | 'denied' | 'timeout';
  reason?: string;
  credential?: string;
}

/**
 * API Response for user operations
 */
export interface GetUsersResponse {
  data: AccessControlUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  data: AccessControlUser;
  message?: string;
  success: boolean;
}

/**
 * API Request for creating/updating a user
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  department: string;
  accessLevel: 'standard' | 'elevated' | 'restricted';
  permissions?: string[];
  phone?: string;
  employeeId?: string;
  accessSchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone?: string;
  };
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success: boolean;
  errors?: string[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

// ============================================================================
// Emergency/Lockdown API Contracts
// ============================================================================

export interface LockdownStatusResponse {
  isActive: boolean;
  initiatedAt?: string;
  initiatedBy?: string;
  reason?: string;
  affectedZones: string[];
  affectedHardware?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
}

export interface InitiateLockdownRequest {
  reason?: string;
  affectedZones?: string[];
  emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Audit Log API Contracts
// ============================================================================

export interface AuditLogResponse {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  details?: Record<string, unknown>;
}

export interface GetAuditLogsResponse extends PaginatedApiResponse<AuditLogResponse> {
  filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  };
}
