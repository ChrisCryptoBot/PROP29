/**
 * Visitor Service
 * API service layer for Visitor Security management
 * Abstracts all backend API interactions
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
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
  QRCodeResponse,
  // Mobile Agent & Hardware Integration Types
  MobileAgentDevice,
  MobileAgentSubmission,
  HardwareDevice,
  CardReaderEvent,
  CameraEvent,
  SystemConnectivity,
  EnhancedVisitorSettings,
  VisitorRealtimeEvent,
  BulkVisitorOperation
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
   * Check if visitor matches banned individuals
   * POST /api/banned-individuals/check
   */
  async checkBannedIndividual(name: string): Promise<{ is_banned: boolean; matches: any[]; individuals?: any[] }> {
    try {
      const response = await apiService.post<{ is_banned: boolean; matches: number; individuals: any[] }>('/banned-individuals/check', { name });
      if (response.success && response.data) {
        return {
          is_banned: response.data.is_banned || false,
          matches: response.data.individuals || [],
          individuals: response.data.individuals || []
        };
      }
      return { is_banned: false, matches: [], individuals: [] };
    } catch (error) {
      // If check fails, allow registration but log error
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'checkBannedIndividual');
      return { is_banned: false, matches: [], individuals: [] };
    }
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

  /**
   * Assign a security request to an officer
   * PATCH /api/visitors/security-requests/:id
   */
  async assignSecurityRequest(
    requestId: string,
    assignedTo: string,
    status: 'in_progress' | 'completed' | 'cancelled' = 'in_progress'
  ): Promise<ApiResponse<SecurityRequest>> {
    return apiService.patch<SecurityRequest>(`/visitors/security-requests/${requestId}`, {
      assigned_to: assignedTo,
      status
    });
  }

  // =======================================================
  // MOBILE AGENT & HARDWARE INTEGRATION - MSO PRODUCTION READINESS
  // =======================================================

  /**
   * MOBILE AGENT MANAGEMENT METHODS
   */

  /**
   * Get all registered mobile agent devices
   * GET /api/visitors/mobile-agents?property_id=xxx
   */
  async getMobileAgentDevices(propertyId?: string): Promise<ApiResponse<MobileAgentDevice[]>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    return apiService.get<MobileAgentDevice[]>('/visitors/mobile-agents', { params });
  }

  /**
   * Register a new mobile agent device
   * POST /api/visitors/mobile-agents/register
   */
  async registerMobileAgent(agentData: {
    agent_name: string;
    device_id: string;
    device_model?: string;
    app_version: string;
    assigned_properties: string[];
  }): Promise<ApiResponse<MobileAgentDevice>> {
    return apiService.post<MobileAgentDevice>('/visitors/mobile-agents/register', agentData);
  }

  /**
   * Get mobile agent submissions (pending sync)
   * GET /api/visitors/mobile-agents/submissions?status=pending&agent_id=xxx
   */
  async getMobileAgentSubmissions(
    agentId?: string,
    status?: 'pending' | 'processed' | 'rejected'
  ): Promise<ApiResponse<MobileAgentSubmission[]>> {
    const params: Record<string, string> = {};
    if (agentId) params.agent_id = agentId;
    if (status) params.status = status;
    
    return apiService.get<MobileAgentSubmission[]>('/visitors/mobile-agents/submissions', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Process mobile agent submission
   * POST /api/visitors/mobile-agents/submissions/{submission_id}/process
   */
  async processMobileAgentSubmission(
    submissionId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ApiResponse<Visitor | null>> {
    return apiService.post<Visitor | null>(`/visitors/mobile-agents/submissions/${submissionId}/process`, {
      action,
      reason
    });
  }

  /**
   * Sync mobile agent data
   * POST /api/visitors/mobile-agents/{agent_id}/sync
   */
  async syncMobileAgentData(agentId: string): Promise<ApiResponse<{
    synced_items: number;
    pending_items: number;
    errors: string[];
  }>> {
    return apiService.post(`/visitors/mobile-agents/${agentId}/sync`);
  }

  /**
   * HARDWARE DEVICE INTEGRATION METHODS
   */

  /**
   * Get all hardware devices
   * GET /api/visitors/hardware/devices?property_id=xxx&type=xxx
   */
  async getHardwareDevices(
    propertyId?: string,
    deviceType?: string
  ): Promise<ApiResponse<HardwareDevice[]>> {
    const params: Record<string, string> = {};
    if (propertyId) params.property_id = propertyId;
    if (deviceType) params.type = deviceType;
    
    return apiService.get<HardwareDevice[]>('/visitors/hardware/devices', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Get hardware device status
   * GET /api/visitors/hardware/devices/{device_id}/status
   */
  async getHardwareDeviceStatus(deviceId: string): Promise<ApiResponse<HardwareDevice>> {
    return apiService.get<HardwareDevice>(`/visitors/hardware/devices/${deviceId}/status`);
  }

  /**
   * Get card reader events
   * GET /api/visitors/hardware/card-reader/events?device_id=xxx&limit=50
   */
  async getCardReaderEvents(
    deviceId?: string,
    limit: number = 50
  ): Promise<ApiResponse<CardReaderEvent[]>> {
    const params: Record<string, string> = { limit: limit.toString() };
    if (deviceId) params.device_id = deviceId;
    
    return apiService.get<CardReaderEvent[]>('/visitors/hardware/card-reader/events', { params });
  }

  /**
   * Get camera events
   * GET /api/visitors/hardware/camera/events?device_id=xxx&limit=50
   */
  async getCameraEvents(
    deviceId?: string,
    limit: number = 50
  ): Promise<ApiResponse<CameraEvent[]>> {
    const params: Record<string, string> = { limit: limit.toString() };
    if (deviceId) params.device_id = deviceId;
    
    return apiService.get<CameraEvent[]>('/visitors/hardware/camera/events', { params });
  }

  /**
   * Trigger badge printing
   * POST /api/visitors/hardware/printer/print-badge
   */
  async printVisitorBadge(visitorId: string, printerId?: string): Promise<ApiResponse<{
    print_job_id: string;
    status: 'queued' | 'printing' | 'completed' | 'error';
    estimated_completion?: string;
  }>> {
    return apiService.post('/visitors/hardware/printer/print-badge', {
      visitor_id: visitorId,
      printer_id: printerId
    });
  }

  /**
   * SYSTEM CONNECTIVITY & HEALTH METHODS
   */

  /**
   * Get system connectivity status
   * GET /api/visitors/system/connectivity
   */
  async getSystemConnectivity(): Promise<ApiResponse<SystemConnectivity>> {
    return apiService.get<SystemConnectivity>('/visitors/system/connectivity');
  }

  /**
   * Ping backend health
   * GET /api/visitors/system/health
   */
  async checkSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, 'up' | 'down' | 'unknown'>;
    timestamp: string;
  }>> {
    return apiService.get('/visitors/system/health');
  }

  /**
   * ENHANCED SETTINGS MANAGEMENT
   */

  /**
   * Get enhanced visitor settings (includes mobile agent & hardware)
   * GET /api/visitors/settings/enhanced?property_id=xxx
   */
  async getEnhancedSettings(propertyId?: string): Promise<ApiResponse<EnhancedVisitorSettings>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    return apiService.get<EnhancedVisitorSettings>('/visitors/settings/enhanced', { params });
  }

  /**
   * Update enhanced visitor settings
   * PUT /api/visitors/settings/enhanced?property_id=xxx
   */
  async updateEnhancedSettings(
    settings: EnhancedVisitorSettings,
    propertyId?: string
  ): Promise<ApiResponse<EnhancedVisitorSettings>> {
    const url = propertyId 
      ? `/visitors/settings/enhanced?property_id=${encodeURIComponent(propertyId)}`
      : '/visitors/settings/enhanced';
    
    return apiService.put<EnhancedVisitorSettings>(url, settings);
  }

  /**
   * BULK OPERATIONS FOR MOBILE AGENT DATA
   */

  /**
   * Process bulk visitor operations
   * POST /api/visitors/bulk/{operation_type}
   */
  async bulkProcessVisitors(
    operationType: 'bulk_checkin' | 'bulk_checkout' | 'bulk_update',
    visitorIds: string[],
    sourceAgentId?: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<BulkVisitorOperation>> {
    return apiService.post<BulkVisitorOperation>(`/visitors/bulk/${operationType}`, {
      visitor_ids: visitorIds,
      source_agent_id: sourceAgentId,
      data
    });
  }

  /**
   * Get bulk operation status
   * GET /api/visitors/bulk/operations/{operation_id}
   */
  async getBulkOperationStatus(operationId: string): Promise<ApiResponse<BulkVisitorOperation>> {
    return apiService.get<BulkVisitorOperation>(`/visitors/bulk/operations/${operationId}`);
  }

  /**
   * MSO DESKTOP SPECIFIC METHODS
   */

  /**
   * Get cached data summary for offline mode
   */
  getCachedDataSummary(): {
    visitors_count: number;
    events_count: number;
    last_sync: string | null;
    offline_mode: boolean;
  } {
    try {
      const cached = localStorage.getItem('visitor-security-cache');
      if (!cached) return { 
        visitors_count: 0, 
        events_count: 0, 
        last_sync: null, 
        offline_mode: false 
      };
      
      const data = JSON.parse(cached);
      return {
        visitors_count: data.visitors?.length || 0,
        events_count: data.events?.length || 0,
        last_sync: data.last_sync || null,
        offline_mode: !navigator.onLine
      };
    } catch {
      return { 
        visitors_count: 0, 
        events_count: 0, 
        last_sync: null, 
        offline_mode: !navigator.onLine 
      };
    }
  }

  /**
   * Cache data locally for offline mode
   */
  cacheDataLocally(data: {
    visitors: Visitor[];
    events: Event[];
    securityRequests: SecurityRequest[];
  }): void {
    try {
      const cacheData = {
        ...data,
        last_sync: new Date().toISOString(),
        cached_at: new Date().toISOString()
      };
      localStorage.setItem('visitor-security-cache', JSON.stringify(cacheData));
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'cacheDataLocally');
    }
  }

  /**
   * Get cached data for offline mode
   */
  getCachedData(): {
    visitors: Visitor[];
    events: Event[];
    securityRequests: SecurityRequest[];
  } | null {
    try {
      const cached = localStorage.getItem('visitor-security-cache');
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      return {
        visitors: data.visitors || [],
        events: data.events || [],
        securityRequests: data.securityRequests || []
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export default new VisitorService();
