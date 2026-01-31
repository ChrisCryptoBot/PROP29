
import axios from 'axios';
import { env } from '../config/env';

const API_BASE_URL = env.API_BASE_URL || '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Define Types (matching Backend Schemas)
export interface Patrol {
    patrol_id: string;
    property_id: string;
    guard_id: string;
    template_id?: string;
    status: 'planned' | 'active' | 'completed' | 'interrupted';
    patrol_type: 'scheduled' | 'ai_optimized' | 'emergency' | 'custom';
    route: any;
    checkpoints: any[];
    created_at: string;
    guard_name?: string;
    ai_priority_score?: number;
    efficiency_score?: number;
}

export interface CreatePatrolParams {
    property_id?: string;
    guard_id?: string;
    template_id?: string;
    patrol_type: string;
    route: any;
    checkpoints: any[];
}

export interface CreateOfficerParams {
    name: string;
    badge_number: string;
    specializations: string[];
}

export interface CheckpointCheckInPayload {
    method?: string;
    device_id?: string;
    request_id?: string;
    location?: Record<string, any>;
    notes?: string;
    completed_at?: string;
    completed_by?: string;
    version?: number;
}

export interface EmergencyAlertPayload {
    patrol_id?: string;
    property_id?: string;
    severity?: string;
    message?: string;
    location?: Record<string, any>;
    device_id?: string;
}

export interface PatrolAuditLog {
    log_id: string;
    log_level: string;
    message: string;
    timestamp: string;
    service: string;
    log_metadata?: Record<string, any>;
    user_id?: string;
    property_id?: string;
}

export interface PatrolMetricsResponse {
    total_patrols: number;
    completed_patrols: number;
    average_efficiency_score: number;
    patrols_by_type: Record<string, number>;
    average_duration: number;
    incidents_found: number;
    efficiency_trend: Array<{ date: string; average_efficiency: number }>;
    guard_performance: Array<{
        guard_id: string;
        guard_name: string;
        completed_patrols: number;
        average_efficiency: number;
    }>;
}

export class PatrolEndpoint {

    /**
     * Fetch all patrols with optional filters
     */
    static async getPatrols(status?: string, propertyId?: string): Promise<Patrol[]> {
        const params: any = {};
        if (status) params.status = status;
        if (propertyId) params.property_id = propertyId;

        const response = await axios.get(`${API_BASE_URL}/patrols/`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Create a new patrol
     */
    static async createPatrol(data: CreatePatrolParams): Promise<Patrol> {
        const response = await axios.post(`${API_BASE_URL}/patrols/`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Start a patrol
     */
    static async startPatrol(patrolId: string): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/${patrolId}/start`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Complete a patrol
     * @param patrolId - The patrol ID to complete
     * @param payload - Optional payload with version for optimistic locking
     */
    static async completePatrol(patrolId: string, payload?: { version?: number }): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/${patrolId}/complete`, payload || {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Update a patrol
     */
    static async updatePatrol(patrolId: string, data: any): Promise<any> {
        const response = await axios.put(`${API_BASE_URL}/patrols/${patrolId}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }


    /**
     * Get all officers
     */
    static async getOfficers(): Promise<any[]> {
        const response = await axios.get(`${API_BASE_URL}/patrols/officers`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Create a new officer
     */
    static async createOfficer(data: CreateOfficerParams): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/officers`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Update officer
     */
    static async updateOfficer(officerId: string, data: any): Promise<any> {
        const response = await axios.put(`${API_BASE_URL}/patrols/officers/${officerId}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Delete officer (soft delete)
     */
    static async deleteOfficer(officerId: string): Promise<any> {
        const response = await axios.delete(`${API_BASE_URL}/patrols/officers/${officerId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get officer health (last_heartbeat, connection_status) for patrol UI.
     * Pass propertyId to use heartbeat_offline_threshold_minutes from that property's settings.
     */
    static async getOfficersHealth(propertyId?: string): Promise<Record<string, { last_heartbeat?: string; connection_status?: string }>> {
        const params = propertyId ? { property_id: propertyId } : undefined;
        const response = await axios.get<{ officers: Record<string, { last_heartbeat?: string; connection_status?: string }> }>(
            `${API_BASE_URL}/patrols/officers/health`,
            { params, headers: getAuthHeaders() }
        );
        return response.data?.officers ?? {};
    }

    /**
     * Record officer heartbeat (device or manager). Optional body: { device_id }.
     */
    static async recordHeartbeat(officerId: string, body?: { device_id?: string }): Promise<void> {
        await axios.post(`${API_BASE_URL}/patrols/officers/${officerId}/heartbeat`, body ?? {}, {
            headers: getAuthHeaders()
        });
    }

    /**
     * Get optional weather for patrol dashboard.
     */
    static async getWeather(): Promise<{
        temperature: number;
        condition: string;
        windSpeed: number;
        visibility: string;
        patrolRecommendation: string;
    }> {
        const response = await axios.get<{
            temperature: number;
            condition: string;
            windSpeed: number;
            visibility: string;
            patrolRecommendation: string;
        }>(`${API_BASE_URL}/patrols/weather`, { headers: getAuthHeaders() });
        return response.data;
    }

    /**
     * Get all routes
     */
    static async getRoutes(propertyId?: string): Promise<any[]> {
        const response = await axios.get(`${API_BASE_URL}/patrols/routes`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Create route
     */
    static async createRoute(data: any): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/routes`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Update route
     */
    static async updateRoute(routeId: string, data: any): Promise<any> {
        const response = await axios.put(`${API_BASE_URL}/patrols/routes/${routeId}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Delete route
     */
    static async deleteRoute(routeId: string): Promise<any> {
        const response = await axios.delete(`${API_BASE_URL}/patrols/routes/${routeId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get all templates
     */
    static async getTemplates(propertyId?: string): Promise<any[]> {
        const response = await axios.get(`${API_BASE_URL}/patrols/templates`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Create template
     */
    static async createTemplate(data: any): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/templates`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Update template
     */
    static async updateTemplate(templateId: string, data: any): Promise<any> {
        const response = await axios.put(`${API_BASE_URL}/patrols/templates/${templateId}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Delete template
     */
    static async deleteTemplate(templateId: string): Promise<any> {
        const response = await axios.delete(`${API_BASE_URL}/patrols/templates/${templateId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get settings
     */
    static async getSettings(propertyId?: string): Promise<any> {
        const response = await axios.get(`${API_BASE_URL}/patrols/settings`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Update settings
     */
    static async updateSettings(data: any, propertyId?: string): Promise<any> {
        const response = await axios.put(`${API_BASE_URL}/patrols/settings`, data, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Check-in to a checkpoint (hardware or manual)
     */
    static async checkInCheckpoint(patrolId: string, checkpointId: string, data: CheckpointCheckInPayload): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/${patrolId}/checkpoints/${checkpointId}/check-in`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Create an emergency alert event
     */
    static async createEmergencyAlert(data: EmergencyAlertPayload): Promise<any> {
        const response = await axios.post(`${API_BASE_URL}/patrols/emergency-alert`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get recent patrol audit logs
     */
    static async getAuditLogs(propertyId?: string): Promise<PatrolAuditLog[]> {
        const response = await axios.get(`${API_BASE_URL}/patrols/audit-logs`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get patrol KPI metrics
     */
    static async getMetrics(propertyId?: string): Promise<PatrolMetricsResponse> {
        const response = await axios.get(`${API_BASE_URL}/patrols/metrics`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get patrol alerts
     */
    static async getAlerts(): Promise<any[]> {
        const response = await axios.get(`${API_BASE_URL}/patrols/alerts`, {
            headers: getAuthHeaders()
        });
        return response.data.alerts || [];
    }

    /**
     * Get dashboard data (alerts, weather, emergency status)
     */
    static async getDashboardData(propertyId?: string): Promise<any> {
        const response = await axios.get(`${API_BASE_URL}/patrols/dashboard-data`, {
            params: propertyId ? { property_id: propertyId } : undefined,
            headers: getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Get emergency status
     */
    static async getEmergencyStatus(): Promise<any> {
        const response = await axios.get(`${API_BASE_URL}/patrols/emergency-status`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }

}
