/**
 * Incident Service
 * API service layer for Incident Log feature
 * Provides all API methods for incident management
 */

import apiService from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import { env } from '../../../config/env';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  Incident,
  IncidentCreate,
  IncidentUpdate,
  EmergencyAlertCreate,
  EmergencyAlertResponse,
  IncidentFilters,
  IncidentSettings,
  IncidentSettingsResponse,
  PatternRecognitionRequest,
  PatternRecognitionResponse,
  ReportExportRequest,
  UserActivity,
  // Production Readiness Enhancement Types
  AgentPerformanceMetrics,
  HardwareIncidentMetadata,
  BulkOperationResult,
  EnhancedIncidentSettings,
  DeviceHealthStatus,
  AgentTrustLevel,
  IncidentStatus
} from '../types/incident-log.types';

class IncidentService {
  /**
   * Get all incidents with optional filters
   * GET /api/incidents?property_id=xxx&status=xxx&severity=xxx
   */
  async getIncidents(filters?: IncidentFilters): Promise<ApiResponse<Incident[]>> {
    // Build query parameters for backend
    const params: Record<string, unknown> = {};
    if (filters?.property_id) params.property_id = filters.property_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.severity) params.severity = filters.severity;

    return apiService.get<Incident[]>('/incidents', { params });
  }

  /**
   * Get a single incident by ID
   * GET /api/incidents/{incident_id}
   */
  async getIncident(incidentId: string): Promise<ApiResponse<Incident>> {
    return apiService.get<Incident>(`/incidents/${incidentId}`);
  }

  /**
   * Create a new incident
   * POST /api/incidents
   */
  async createIncident(
    incident: IncidentCreate
  ): Promise<ApiResponse<Incident>> {
    return apiService.post<Incident>('/incidents', incident);
  }

  /**
   * Update an existing incident
   * PUT /api/incidents/{incident_id}
   */
  async updateIncident(
    incidentId: string,
    updates: IncidentUpdate
  ): Promise<ApiResponse<Incident>> {
    return apiService.put<Incident>(`/incidents/${incidentId}`, updates);
  }

  /**
   * Delete an incident (admin only)
   * DELETE /api/incidents/{incident_id}
   */
  async deleteIncident(incidentId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/incidents/${incidentId}`);
  }


  /**
   * Create emergency alert
   * POST /api/incidents/emergency-alert
   */
  async createEmergencyAlert(
    alert: EmergencyAlertCreate
  ): Promise<ApiResponse<EmergencyAlertResponse>> {
    return apiService.post<EmergencyAlertResponse>('/incidents/emergency-alert', alert);
  }

  /**
   * Get incident settings
   * GET /api/incidents/settings?property_id=xxx
   */
  async getSettings(propertyId?: string): Promise<ApiResponse<IncidentSettingsResponse>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    return apiService.get<IncidentSettingsResponse>('/incidents/settings', { params });
  }

  /**
   * Update incident settings
   * PUT /api/incidents/settings?property_id=xxx
   */
  async updateSettings(
    settings: IncidentSettings,
    propertyId?: string
  ): Promise<ApiResponse<IncidentSettingsResponse>> {
    // Append query params to URL since apiService.put only accepts (url, data)
    const url = propertyId
      ? `/incidents/settings?property_id=${encodeURIComponent(propertyId)}`
      : '/incidents/settings';
    return apiService.put<IncidentSettingsResponse>(url, settings);
  }

  /**
   * Get pattern recognition analysis
   * POST /api/incidents/analytics/pattern-recognition
   */
  async getPatternRecognition(
    request: PatternRecognitionRequest
  ): Promise<ApiResponse<PatternRecognitionResponse>> {
    return apiService.post<PatternRecognitionResponse>('/incidents/analytics/pattern-recognition', request);
  }

  /**
   * Get incident activity timeline
   * GET /api/incidents/{incident_id}/activity
   */
  async getIncidentActivity(incidentId: string): Promise<ApiResponse<UserActivity[]>> {
    return apiService.get<UserActivity[]>(`/incidents/${incidentId}/activity`);
  }

  /**
   * Get users for assignment dropdown
   * GET /api/users or /api/admin/users
   */
  async getUsers(): Promise<ApiResponse<Array<{ user_id: string; name: string; email?: string }>>> {
    try {
      // Try admin endpoint first, fallback to regular users endpoint
      const response = await apiService.get<Array<{ user_id: string; name: string; email?: string }>>('/admin/users');
      return response;
    } catch {
      // Fallback to regular users endpoint
      return apiService.get<Array<{ user_id: string; name: string; email?: string }>>('/users');
    }
  }

  /**
   * Export report as PDF or CSV
   * GET /api/incidents/reports/export?format=pdf&start_date=xxx&end_date=xxx
   */
  async exportReport(request: ReportExportRequest): Promise<Blob> {
    // Build query parameters
    const params: Record<string, unknown> = {
      format: request.format
    };
    if (request.start_date) params.start_date = request.start_date;
    if (request.end_date) params.end_date = request.end_date;
    if (request.filters?.property_id) params.property_id = request.filters.property_id;
    if (request.filters?.status) params.status = request.filters.status;
    if (request.filters?.severity) params.severity = request.filters.severity;

    // Use fetch for blob response (simpler than axios for this use case)
    const token = localStorage.getItem('access_token');
    const baseUrl = env.API_BASE_URL;

    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const response = await fetch(`${baseUrl}/incidents/reports/export?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // =======================================================
  // PRODUCTION READINESS ENHANCEMENTS
  // Mobile Agent Integration & Hardware Device Support
  // =======================================================

  /**
   * MOBILE AGENT PERFORMANCE METHODS
   */

  /**
   * Get agent performance metrics
   * GET /api/incidents/agents/performance?agent_id=xxx&property_id=xxx
   */
  async getAgentPerformanceMetrics(
    agentId?: string,
    propertyId?: string
  ): Promise<ApiResponse<AgentPerformanceMetrics[]>> {
    const params: Record<string, unknown> = {};
    if (agentId) params.agent_id = agentId;
    if (propertyId) params.property_id = propertyId;

    return apiService.get<AgentPerformanceMetrics[]>('/incidents/agents/performance', { params });
  }

  /**
   * Calculate agent trust score
   * GET /api/incidents/agents/{agent_id}/trust-score
   */
  async getAgentTrustScore(agentId: string): Promise<ApiResponse<{ trust_score: number; level: AgentTrustLevel }>> {
    return apiService.get<{ trust_score: number; level: AgentTrustLevel }>(`/incidents/agents/${agentId}/trust-score`);
  }

  /**
   * Update agent performance (internal use - usually auto-updated)
   * PUT /api/incidents/agents/{agent_id}/performance
   */
  async updateAgentPerformance(
    agentId: string,
    metrics: Partial<AgentPerformanceMetrics>
  ): Promise<ApiResponse<AgentPerformanceMetrics>> {
    return apiService.put<AgentPerformanceMetrics>(`/incidents/agents/${agentId}/performance`, metrics);
  }

  /**
   * BULK OPERATIONS METHODS
   */

  /**
   * Bulk approve incidents with enhanced feedback
   * POST /api/incidents/bulk/approve
   */
  async bulkApproveIncidents(
    incidentIds: string[],
    reason?: string,
    propertyId?: string
  ): Promise<ApiResponse<BulkOperationResult>> {
    const payload = {
      incident_ids: incidentIds,
      reason: reason || 'Bulk approval',
      property_id: propertyId
    };

    return apiService.post<BulkOperationResult>('/incidents/bulk/approve', payload);
  }

  /**
   * Bulk reject incidents with enhanced feedback
   * POST /api/incidents/bulk/reject
   */
  async bulkRejectIncidents(
    incidentIds: string[],
    reason: string,
    propertyId?: string
  ): Promise<ApiResponse<BulkOperationResult>> {
    const payload = {
      incident_ids: incidentIds,
      reason: reason,
      property_id: propertyId
    };

    return apiService.post<BulkOperationResult>('/incidents/bulk/reject', payload);
  }

  /**
   * Bulk delete incidents with enhanced feedback
   * DELETE /api/incidents/bulk/delete
   */
  async bulkDeleteIncidents(
    incidentIds: string[],
    propertyId?: string
  ): Promise<ApiResponse<BulkOperationResult>> {
    const payload = {
      incident_ids: incidentIds,
      property_id: propertyId
    };

    return apiService.post<BulkOperationResult>('/incidents/bulk/delete', payload);
  }

  /**
   * Bulk status change with enhanced feedback
   * POST /api/incidents/bulk/status
   */
  async bulkStatusChange(
    incidentIds: string[],
    status: IncidentStatus,
    reason?: string,
    propertyId?: string
  ): Promise<ApiResponse<BulkOperationResult>> {
    const payload = {
      incident_ids: incidentIds,
      status: status,
      reason: reason || `Bulk status change to ${status}`,
      property_id: propertyId
    };

    return apiService.post<BulkOperationResult>('/incidents/bulk/status', payload);
  }

  /**
   * HARDWARE DEVICE INTEGRATION METHODS
   */

  /**
   * Get hardware device status for incident context
   * GET /api/incidents/hardware/{device_id}/status
   */
  async getHardwareDeviceStatus(deviceId: string): Promise<ApiResponse<DeviceHealthStatus | null>> {
    try {
      return await apiService.get<DeviceHealthStatus>(`/incidents/hardware/${deviceId}/status`);
    } catch (error) {
      // Return null if device not found or service unavailable
      logger.warn('Hardware device status unavailable', error instanceof Error ? error : new Error(String(error)), {
        module: 'IncidentService',
        action: 'getHardwareDeviceStatus',
        deviceId
      });
      return { data: null, error: 'Device not found', success: false };
    }
  }

  /**
   * Get all hardware device health statuses
   * GET /api/incidents/hardware/health?property_id=xxx
   */
  async getAllDeviceHealth(propertyId?: string): Promise<ApiResponse<DeviceHealthStatus[]>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    return apiService.get<DeviceHealthStatus[]>('/incidents/hardware/health', { params });
  }

  /**
   * Get hardware-sourced incidents summary
   * GET /api/incidents/hardware/summary?property_id=xxx&days=7
   */
  async getHardwareIncidentSummary(
    propertyId?: string,
    days: number = 7
  ): Promise<ApiResponse<{
    total_incidents: number;
    by_device_type: Record<string, number>;
    by_status: Record<string, number>;
    critical_devices: string[];
  }>> {
    const params: Record<string, unknown> = { days };
    if (propertyId) params.property_id = propertyId;
    
    return apiService.get('/incidents/hardware/summary', { params });
  }

  /**
   * EMERGENCY ALERT CONVERSION METHODS
   */

  /**
   * Convert emergency alert to incident
   * POST /api/incidents/emergency-alert/{alert_id}/convert
   */
  async convertEmergencyAlertToIncident(
    alertId: string,
    overrides?: Partial<IncidentCreate>
  ): Promise<ApiResponse<Incident>> {
    const payload = {
      alert_id: alertId,
      overrides: overrides || {}
    };

    return apiService.post<Incident>(`/incidents/emergency-alert/${alertId}/convert`, payload);
  }

  /**
   * ENHANCED SETTINGS METHODS
   */

  /**
   * Get enhanced incident settings (includes agent & hardware settings)
   * GET /api/incidents/settings/enhanced?property_id=xxx
   */
  async getEnhancedSettings(propertyId?: string): Promise<ApiResponse<EnhancedIncidentSettings>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    return apiService.get<EnhancedIncidentSettings>('/incidents/settings/enhanced', { params });
  }

  /**
   * Update enhanced incident settings
   * PUT /api/incidents/settings/enhanced?property_id=xxx
   */
  async updateEnhancedSettings(
    settings: EnhancedIncidentSettings,
    propertyId?: string
  ): Promise<ApiResponse<EnhancedIncidentSettings>> {
    const url = propertyId
      ? `/incidents/settings/enhanced?property_id=${encodeURIComponent(propertyId)}`
      : '/incidents/settings/enhanced';
    
    return apiService.put<EnhancedIncidentSettings>(url, settings);
  }

  /**
   * ANALYTICS & REPORTING ENHANCEMENTS
   */

  /**
   * Get mobile agent analytics for dashboard
   * GET /api/incidents/analytics/agents?property_id=xxx&days=30
   */
  async getAgentAnalytics(
    propertyId?: string,
    days: number = 30
  ): Promise<ApiResponse<{
    total_agents: number;
    active_agents: number;
    avg_trust_score: number;
    submissions_trend: Array<{ date: string; count: number; approval_rate: number }>;
    top_performers: AgentPerformanceMetrics[];
    flagged_agents: AgentPerformanceMetrics[];
  }>> {
    const params: Record<string, unknown> = { days };
    if (propertyId) params.property_id = propertyId;
    
    return apiService.get('/incidents/analytics/agents', { params });
  }

  /**
   * Get source-based incident analytics
   * GET /api/incidents/analytics/sources?property_id=xxx&days=30
   */
  async getSourceAnalytics(
    propertyId?: string,
    days: number = 30
  ): Promise<ApiResponse<{
    by_source: Record<'manager' | 'agent' | 'device' | 'sensor', number>;
    source_trends: Array<{ date: string; manager: number; agent: number; device: number; sensor: number }>;
    agent_contribution: number; // Percentage
    hardware_contribution: number; // Percentage
  }>> {
    const params: Record<string, unknown> = { days };
    if (propertyId) params.property_id = propertyId;
    
    return apiService.get('/incidents/analytics/sources', { params });
  }

  /**
   * OFFLINE/ERROR HANDLING ENHANCEMENTS
   * For MSO desktop deployment reliability
   */

  /**
   * Ping backend to check connectivity
   * GET /api/incidents/health
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await apiService.get('/incidents/health');
      return response.success !== false;
    } catch {
      return false;
    }
  }

  /**
   * Get cached data summary (for offline scenarios)
   * Returns what data is available locally
   */
  getCachedDataSummary(): {
    incidents_count: number;
    last_sync: string | null;
    offline_mode: boolean;
  } {
    try {
      const cached = localStorage.getItem('incident-log-cache');
      if (!cached) return { incidents_count: 0, last_sync: null, offline_mode: false };
      
      const data = JSON.parse(cached);
      return {
        incidents_count: data.incidents?.length || 0,
        last_sync: data.last_sync || null,
        offline_mode: !navigator.onLine
      };
    } catch {
      return { incidents_count: 0, last_sync: null, offline_mode: !navigator.onLine };
    }
  }
}

// Export singleton instance
export const incidentService = new IncidentService();
export default incidentService;
