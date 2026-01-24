/**
 * Visitor Service
 * API service layer for Visitor Security management
 * Abstracts all backend API interactions
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  Visitor,
  VisitorCreate,
  VisitorUpdate,
  VisitorFilters,
  Event,
  EventCreate,
  EventUpdate,
  EventFilters,
  SecurityRequest,
  SecurityRequestCreate,
  SecurityRequestFilters,
  QRCodeResponse
} from '../types/visitor-security.types';

class VisitorService {
  /**
   * Get all visitors with optional filtering
   * GET /api/visitors?property_id=xxx&status=xxx&event_id=xxx&security_clearance=xxx
   */
  async getVisitors(filters?: VisitorFilters): Promise<ApiResponse<Visitor[]>> {
    const params: Record<string, string> = {};

    if (filters?.property_id) {
      params.property_id = filters.property_id;
    }
    if (filters?.status) {
      params.status = typeof filters.status === 'string' ? filters.status : filters.status;
    }
    if (filters?.event_id) {
      params.event_id = filters.event_id;
    }
    if (filters?.security_clearance) {
      params.security_clearance = typeof filters.security_clearance === 'string'
        ? filters.security_clearance
        : filters.security_clearance;
    }

    return apiService.get<Visitor[]>('/visitors', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Get a single visitor by ID
   * GET /api/visitors/{visitor_id}
   */
  async getVisitor(visitorId: string): Promise<ApiResponse<Visitor>> {
    return apiService.get<Visitor>(`/visitors/${visitorId}`);
  }

  /**
   * Create a new visitor
   * POST /api/visitors
   */
  async createVisitor(visitorData: VisitorCreate): Promise<ApiResponse<Visitor>> {
    return apiService.post<Visitor>('/visitors', visitorData);
  }

  /**
   * Update an existing visitor (for future use)
   * PUT /api/visitors/{visitor_id}
   */
  async updateVisitor(
    visitorId: string,
    updates: VisitorUpdate
  ): Promise<ApiResponse<Visitor>> {
    return apiService.put<Visitor>(`/visitors/${visitorId}`, updates);
  }

  /**
   * Delete a visitor (admin only)
   * DELETE /api/visitors/{visitor_id}
   */
  async deleteVisitor(visitorId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/visitors/${visitorId}`);
  }

  /**
   * Check in a visitor
   * POST /api/visitors/{visitor_id}/check-in
   */
  async checkInVisitor(visitorId: string): Promise<ApiResponse<Visitor>> {
    return apiService.post<Visitor>(`/visitors/${visitorId}/check-in`, undefined);
  }

  /**
   * Check out a visitor
   * POST /api/visitors/{visitor_id}/check-out
   */
  async checkOutVisitor(visitorId: string): Promise<ApiResponse<Visitor>> {
    return apiService.post<Visitor>(`/visitors/${visitorId}/check-out`, undefined);
  }

  /**
   * Get QR code for a visitor badge
   * GET /api/visitors/{visitor_id}/qr-code
   */
  async getVisitorQRCode(visitorId: string): Promise<ApiResponse<QRCodeResponse>> {
    return apiService.get<QRCodeResponse>(`/visitors/${visitorId}/qr-code`);
  }

  /**
   * Get all events with optional filtering
   * GET /api/visitors/events?property_id=xxx
   */
  async getEvents(filters?: EventFilters): Promise<ApiResponse<Event[]>> {
    const params: Record<string, string> = {};

    if (filters?.property_id) {
      params.property_id = filters.property_id;
    }

    return apiService.get<Event[]>('/visitors/events', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Create a new event
   * POST /api/visitors/events
   */
  async createEvent(eventData: EventCreate): Promise<ApiResponse<Event>> {
    return apiService.post<Event>('/visitors/events', eventData);
  }

  /**
   * Delete an event (admin only)
   * DELETE /api/visitors/events/{event_id}
   */
  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/visitors/events/${eventId}`);
  }

  /**
   * Register an attendee for an event (creates visitor with event badge)
   * POST /api/visitors/events/{event_id}/register
   */
  async registerEventAttendee(
    eventId: string,
    visitorData: VisitorCreate
  ): Promise<ApiResponse<Visitor>> {
    return apiService.post<Visitor>(`/visitors/events/${eventId}/register`, visitorData);
  }

  /**
   * Get all security requests with optional filtering
   * GET /api/visitors/security-requests?property_id=xxx&status=xxx&priority=xxx
   */
  async getSecurityRequests(
    filters?: SecurityRequestFilters
  ): Promise<ApiResponse<SecurityRequest[]>> {
    const params: Record<string, string> = {};

    if (filters?.property_id) {
      params.property_id = filters.property_id;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.priority) {
      params.priority = filters.priority;
    }

    return apiService.get<SecurityRequest[]>('/visitors/security-requests', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Create a security request
   * POST /api/visitors/security-requests
   */
  async createSecurityRequest(
    requestData: SecurityRequestCreate
  ): Promise<ApiResponse<SecurityRequest>> {
    return apiService.post<SecurityRequest>('/visitors/security-requests', requestData);
  }
}

// Export singleton instance
export default new VisitorService();
