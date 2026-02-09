/**
 * Profile Settings API service.
 * Calls /api/profile (GET/PUT profile, change-password, 2FA, sessions, certifications).
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  UserProfile,
  UpdateProfileRequest,
  AddCertificationRequest,
  UpdateCertificationRequest,
  TwoFAStatus,
  SessionInfo,
} from '../types/profile-settings.types';

const PREFIX = '/profile';

export const profileSettingsService = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiService.get<UserProfile>(PREFIX);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    return apiService.put<UserProfile>(PREFIX, data);
  },

  async uploadAvatar(file: File): Promise<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<UserProfile>(`${PREFIX}/avatar`, formData);
  },

  async changePassword(current_password: string, new_password: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(`${PREFIX}/change-password`, {
      current_password,
      new_password,
    });
  },

  async get2FAStatus(): Promise<ApiResponse<TwoFAStatus>> {
    return apiService.get<TwoFAStatus>(`${PREFIX}/2fa`);
  },

  async enable2FA(): Promise<ApiResponse<{ enabled: boolean; message?: string }>> {
    return apiService.post<{ enabled: boolean; message?: string }>(`${PREFIX}/2fa/enable`);
  },

  async disable2FA(): Promise<ApiResponse<{ enabled: boolean; message?: string }>> {
    return apiService.post<{ enabled: boolean; message?: string }>(`${PREFIX}/2fa/disable`);
  },

  async getSessions(): Promise<ApiResponse<SessionInfo[]>> {
    return apiService.get<SessionInfo[]>(`${PREFIX}/sessions`);
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<{ revoked: string }>> {
    return apiService.delete<{ revoked: string }>(`${PREFIX}/sessions/${sessionId}`);
  },

  async addCertification(data: AddCertificationRequest): Promise<ApiResponse<UserProfile>> {
    return apiService.post<UserProfile>(`${PREFIX}/certifications`, data);
  },

  async updateCertification(id: string, data: UpdateCertificationRequest): Promise<ApiResponse<UserProfile>> {
    return apiService.put<UserProfile>(`${PREFIX}/certifications/${id}`, data);
  },

  async removeCertification(id: string): Promise<ApiResponse<UserProfile>> {
    return apiService.delete<UserProfile>(`${PREFIX}/certifications/${id}`);
  },
};
