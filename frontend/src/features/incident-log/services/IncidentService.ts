/**
 * Incident Service
 * API service layer for Incident Log feature
 * Provides all API methods for incident management
 */

import apiService from '../../../services/ApiService';
import { env } from '../../../config/env';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  Incident,
  IncidentCreate,
  IncidentUpdate,
  AIClassificationRequest,
  AIClassificationResponse,
  EmergencyAlertCreate,
  EmergencyAlertResponse,
  IncidentFilters,
  IncidentSettings,
  IncidentSettingsResponse,
  PatternRecognitionRequest,
  PatternRecognitionResponse,
  ReportExportRequest,
  UserActivity
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
   * POST /api/incidents?use_ai=true (optional)
   */
  async createIncident(
    incident: IncidentCreate,
    useAI: boolean = false
  ): Promise<ApiResponse<Incident>> {
    // For query params, we need to append them to the URL
    const url = useAI ? '/incidents?use_ai=true' : '/incidents';
    return apiService.post<Incident>(url, incident);
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
   * Get AI classification suggestion
   * POST /api/incidents/ai-classify
   */
  async getAIClassification(
    request: AIClassificationRequest
  ): Promise<ApiResponse<AIClassificationResponse>> {
    return apiService.post<AIClassificationResponse>('/incidents/ai-classify', request);
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
}

// Export singleton instance
export const incidentService = new IncidentService();
export default incidentService;
