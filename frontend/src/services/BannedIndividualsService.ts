import ApiService from './ApiService';
import { BannedIndividual, DetectionAlert } from '../features/banned-individuals/types/banned-individuals.types';

export interface DetectionStatistics {
    total_banned_individuals: number;
    total_detections: number;
    recent_detections: number;
    detection_rate: number;
    period_days: number;
}

class BannedIndividualsService {
    private endpoint = '/banned-individuals';

    private mapToFrontend(data: any): BannedIndividual {
        return {
            id: data.banned_id,
            firstName: data.first_name,
            lastName: data.last_name,
            dateOfBirth: data.date_of_birth,
            nationality: data.nationality || 'UNKNOWN',
            reason: data.reason_for_ban || data.reason || '',
            banType: data.is_permanent ? 'PERMANENT' : 'TEMPORARY',
            banStartDate: data.ban_start_date,
            banEndDate: data.ban_end_date,
            identificationNumber: data.identification_number || '',
            identificationType: data.identification_type || 'Unknown',
            photoUrl: data.photo_url,
            notes: data.notes || '',
            status: data.is_active ? 'ACTIVE' : 'EXPIRED',
            riskLevel: data.is_permanent ? 'CRITICAL' : 'MEDIUM',
            bannedBy: data.added_by || 'System',
            createdAt: data.created_at || data.ban_start_date,
            updatedAt: data.updated_at || data.ban_start_date,
            detectionCount: data.detection_count || 0,
            lastDetection: data.last_detection,
            facialRecognitionData: data.facial_recognition_data,
            // Source tracking
            source: data.source || data.source_type || 'MANAGER',
            sourceMetadata: data.source_metadata || data.sourceMetadata || {}
        };
    }

    private mapToBackend(data: Partial<BannedIndividual>): any {
        const backend: any = {};
        if (data.firstName) backend.first_name = data.firstName;
        if (data.lastName) backend.last_name = data.lastName;
        if (data.dateOfBirth) backend.date_of_birth = data.dateOfBirth;
        if (data.reason) backend.reason_for_ban = data.reason;
        if (data.banType) backend.is_permanent = data.banType === 'PERMANENT';
        if (data.banEndDate) backend.ban_end_date = data.banEndDate;
        if (data.notes) backend.notes = data.notes;
        if (data.photoUrl) backend.photo_url = data.photoUrl;
        if (data.facialRecognitionData) backend.facial_recognition_data = data.facialRecognitionData;
        return backend;
    }

    async getIndividuals(propertyId?: string, isActive: boolean = true): Promise<BannedIndividual[]> {
        let url = this.endpoint;
        const params: any = {};
        if (propertyId) params.property_id = propertyId;
        params.is_active = isActive;

        const response = await ApiService.get<any[]>(url, { params });
        if (response.success && response.data) {
            return response.data.map((item: any) => this.mapToFrontend(item));
        }
        return [];
    }

    async getIndividualById(id: string): Promise<BannedIndividual | null> {
        const response = await ApiService.get<any>(`${this.endpoint}/${id}`);
        return response.success && response.data ? this.mapToFrontend(response.data) : null;
    }

    async createIndividual(data: Partial<BannedIndividual> & { propertyId?: string }): Promise<BannedIndividual | null> {
        const backendData = this.mapToBackend(data);
        if (data.propertyId) backendData.property_id = data.propertyId;

        const response = await ApiService.post<any>(this.endpoint, backendData);
        return response.success && response.data ? this.mapToFrontend(response.data) : null;
    }

    async updateIndividual(id: string, updates: Partial<BannedIndividual>): Promise<BannedIndividual | null> {
        const backendData = this.mapToBackend(updates);
        const response = await ApiService.put<any>(`${this.endpoint}/${id}`, backendData);
        return response.success && response.data ? this.mapToFrontend(response.data) : null;
    }

    async deleteIndividual(id: string): Promise<boolean> {
        const response = await ApiService.delete(`${this.endpoint}/${id}`);
        return !!response.success;
    }

    async getStats(propertyId?: string, days: number = 30): Promise<DetectionStatistics | null> {
        const params: any = {};
        if (propertyId) params.property_id = propertyId;
        params.days = days;

        const response = await ApiService.get<DetectionStatistics>(`${this.endpoint}/stats`, { params });
        return response.success && response.data ? response.data : null;
    }

    async getDetectionAlerts(propertyId?: string, limit: number = 100): Promise<DetectionAlert[]> {
        const params: any = { limit };
        if (propertyId) params.property_id = propertyId;

        const response = await ApiService.get<any[]>(`${this.endpoint}/detections`, { params });
        if (response.success && response.data) {
            return response.data.map((item: any) => {
                const loc = item.location;
                let locationStr: string;
                if (loc == null) locationStr = 'Unknown';
                else if (typeof loc === 'string') locationStr = loc;
                else if (typeof loc === 'object' && 'lat' in loc && 'lng' in loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                    locationStr = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
                } else locationStr = 'Unknown';
                return {
                id: item.detection_id || item.id,
                individualId: item.banned_id || item.individual_id,
                individualName: item.individual_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
                location: locationStr,
                timestamp: item.timestamp || item.detected_at || new Date().toISOString(),
                confidence: item.confidence || 0,
                status: item.status || 'ACTIVE',
                responseTime: item.response_time || 0,
                actionTaken: item.action_taken || 'Detection logged',
                notes: item.notes
                };
            });
        }
        return [];
    }

    async markDetectionAsFalsePositive(detectionId: string, notes?: string): Promise<boolean> {
        const response = await ApiService.put(`${this.endpoint}/detections/${detectionId}/false-positive`, { notes });
        return !!response.success;
    }

    async acknowledgeDetection(detectionId: string, actionTaken: string, notes?: string): Promise<boolean> {
        const response = await ApiService.put(`${this.endpoint}/detections/${detectionId}/acknowledge`, {
            action_taken: actionTaken,
            notes
        });
        return !!response.success;
    }

    async getDetectionFootage(detectionId: string): Promise<string | null> {
        const response = await ApiService.get<{ video_url: string }>(`${this.endpoint}/detections/${detectionId}/footage`);
        return response.success && response.data ? response.data.video_url : null;
    }

    async uploadPhoto(individualId: string, file: File): Promise<{ photoUrl: string } | null> {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('individual_id', individualId);

        const response = await ApiService.post<{ photo_url: string }>(
            `${this.endpoint}/${individualId}/photo`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.success && response.data) {
            return { photoUrl: response.data.photo_url };
        }
        return null;
    }

    async bulkImport(csvData: string): Promise<{ success: number; failed: number; errors: Array<{ row: number; error: string }> }> {
        interface BulkImportResponse {
            success: number;
            failed: number;
            errors: Array<{ row: number; error: string }>;
        }
        const response = await ApiService.post<BulkImportResponse>(
            `${this.endpoint}/bulk-import`,
            { csv_data: csvData }
        );

        if (response.success && response.data) {
            return response.data;
        }
        return { success: 0, failed: 0, errors: [] };
    }

    async getSettings(propertyId?: string): Promise<any> {
        const params: any = {};
        if (propertyId) params.property_id = propertyId;

        const response = await ApiService.get<any>(`${this.endpoint}/settings`, { params });
        return response.success && response.data ? response.data : null;
    }

    async logAuditEntry(data: {
        actor: string;
        action: string;
        status: 'success' | 'failure' | 'info';
        target?: string;
        reason?: string;
        source?: string;
        metadata?: Record<string, any>;
    }): Promise<boolean> {
        try {
            const response = await ApiService.post(`${this.endpoint}/audit`, data);
            return response.success === true;
        } catch {
            return false;
        }
    }

    async updateSettings(settings: any, propertyId?: string): Promise<boolean> {
        const data: any = { ...settings };
        if (propertyId) data.property_id = propertyId;

        const response = await ApiService.put(`${this.endpoint}/settings`, data);
        return !!response.success;
    }

    async getAnalytics(params: { startDate?: string; endDate?: string; propertyId?: string }): Promise<any> {
        const response = await ApiService.get<any>(`${this.endpoint}/analytics`, { params });
        return response.success && response.data ? response.data : null;
    }
}

export const bannedIndividualsService = new BannedIndividualsService();
