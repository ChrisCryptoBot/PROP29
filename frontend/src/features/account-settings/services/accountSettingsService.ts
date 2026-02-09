/**
 * Account Settings API service.
 * Calls /api/account-settings/* (team-members, team-settings, integrations, role-permissions).
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  TeamMember,
  TeamSettings,
  Integration,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamSettingsUpdate,
  AddIntegrationRequest,
  RolePermissionMap,
} from '../types/account-settings.types';

function params(propertyId?: string | null): { params?: { property_id: string } } {
  if (!propertyId) return {};
  return { params: { property_id: propertyId } };
}

export const accountSettingsService = {
  async getTeamMembers(propertyId?: string | null): Promise<ApiResponse<TeamMember[]>> {
    return apiService.get<TeamMember[]>('/account-settings/team-members', params(propertyId));
  },

  async addTeamMember(data: AddTeamMemberRequest, propertyId?: string | null): Promise<ApiResponse<TeamMember>> {
    return apiService.post<TeamMember>('/account-settings/team-members', data, params(propertyId));
  },

  async updateTeamMember(id: string, data: UpdateTeamMemberRequest, propertyId?: string | null): Promise<ApiResponse<TeamMember>> {
    return apiService.put<TeamMember>(`/account-settings/team-members/${id}`, data, params(propertyId));
  },

  async removeTeamMember(id: string, propertyId?: string | null): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return apiService.delete<{ deleted: boolean; id: string }>(`/account-settings/team-members/${id}`, params(propertyId));
  },

  async getTeamSettings(propertyId?: string | null): Promise<ApiResponse<TeamSettings>> {
    return apiService.get<TeamSettings>('/account-settings/team-settings', params(propertyId));
  },

  async updateTeamSettings(data: TeamSettingsUpdate, propertyId?: string | null): Promise<ApiResponse<TeamSettings>> {
    return apiService.put<TeamSettings>('/account-settings/team-settings', data, params(propertyId));
  },

  async getIntegrations(propertyId?: string | null): Promise<ApiResponse<Integration[]>> {
    return apiService.get<Integration[]>('/account-settings/integrations', params(propertyId));
  },

  async addIntegration(data: AddIntegrationRequest, propertyId?: string | null): Promise<ApiResponse<Integration>> {
    return apiService.post<Integration>('/account-settings/integrations', data, params(propertyId));
  },

  async testIntegration(integrationId: string, propertyId?: string | null): Promise<ApiResponse<{ id: string; ok: boolean; message?: string }>> {
    return apiService.get<{ id: string; ok: boolean; message?: string }>(
      `/account-settings/integrations/${integrationId}/test`,
      params(propertyId)
    );
  },

  async getRolePermissions(propertyId?: string | null): Promise<ApiResponse<RolePermissionMap>> {
    return apiService.get<RolePermissionMap>('/account-settings/role-permissions', params(propertyId));
  },

  async updateRolePermissions(data: RolePermissionMap, propertyId?: string | null): Promise<ApiResponse<RolePermissionMap>> {
    return apiService.put<RolePermissionMap>('/account-settings/role-permissions', data, params(propertyId));
  },
};
