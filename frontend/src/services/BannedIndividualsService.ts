import ApiService from './ApiService';
import { BannedIndividual, FacialRecognitionStats } from '../features/banned-individuals/types/banned-individuals.types';

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
            facialRecognitionData: data.facial_recognition_data
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

    async getFacialRecognitionStatus(): Promise<FacialRecognitionStats | null> {
        const response = await ApiService.get<any>(`${this.endpoint}/facial-recognition-status`);
        if (response.success && response.data) {
            return {
                accuracy: response.data.accuracy,
                trainingStatus: response.data.training_status as any,
                totalFaces: response.data.total_faces,
                activeModels: 3,
                lastTraining: response.data.last_training
            };
        }
        return null;
    }
}

export const bannedIndividualsService = new BannedIndividualsService();
