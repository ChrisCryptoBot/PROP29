/**
 * Account Settings state and actions.
 * Fetches team members, team settings, integrations, role permissions; provides CRUD and refresh.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { showSuccess, showError } from '../../../utils/toast';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { getPropertyIdFromUser } from '../utils/getPropertyId';
import { accountSettingsService } from '../services/accountSettingsService';
import type {
  TeamMember,
  TeamSettings,
  Integration,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  AddIntegrationRequest,
  RolePermissionMap,
} from '../types/account-settings.types';

const defaultTeamSettings: TeamSettings = {
  teamName: 'Grand Hotel Security Team',
  hotelName: 'Grand Hotel & Resort',
  timezone: 'America/New_York',
  workingHours: { start: '06:00', end: '22:00' },
  breakPolicy: { duration: 15, frequency: 4 },
  overtimePolicy: { enabled: true, maxHours: 12, approvalRequired: true },
  notificationSettings: { emailNotifications: true, smsNotifications: true, pushNotifications: true, emergencyAlerts: true },
};

export interface UseAccountSettingsStateReturn {
  propertyId: string;
  teamMembers: TeamMember[];
  teamSettings: TeamSettings;
  integrations: Integration[];
  rolePermissions: RolePermissionMap;
  loading: { team: boolean; settings: boolean; integrations: boolean; permissions: boolean; save: boolean };
  error: string | null;
  setError: (v: string | null) => void;
  refreshData: () => Promise<void>;
  addTeamMember: (data: AddTeamMemberRequest) => Promise<TeamMember | null>;
  updateTeamMember: (id: string, data: UpdateTeamMemberRequest) => Promise<TeamMember | null>;
  removeTeamMember: (id: string) => Promise<boolean>;
  updateTeamSettings: (data: Partial<TeamSettings>) => Promise<boolean>;
  addIntegration: (data: AddIntegrationRequest) => Promise<Integration | null>;
  testIntegration: (id: string) => Promise<boolean>;
  updateRolePermissions: (data: RolePermissionMap) => Promise<boolean>;
  setTeamSettings: React.Dispatch<React.SetStateAction<TeamSettings>>;
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  setIntegrations: React.Dispatch<React.SetStateAction<Integration[]>>;
}

export function useAccountSettingsState(): UseAccountSettingsStateReturn {
  const { user } = useAuth();
  const propertyId = getPropertyIdFromUser(user);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamSettings, setTeamSettings] = useState<TeamSettings>(defaultTeamSettings);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    team: true,
    settings: true,
    integrations: true,
    permissions: false,
    save: false,
  });

  const loadTeam = useCallback(async () => {
    setLoading((p) => ({ ...p, team: true }));
    try {
      const res = await accountSettingsService.getTeamMembers(propertyId);
      if (res.data) setTeamMembers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.getTeamMembers');
      setTeamMembers([]);
    } finally {
      setLoading((p) => ({ ...p, team: false }));
    }
  }, [propertyId]);

  const loadSettings = useCallback(async () => {
    setLoading((p) => ({ ...p, settings: true }));
    try {
      const res = await accountSettingsService.getTeamSettings(propertyId);
      if (res.data) setTeamSettings(res.data as TeamSettings);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.getTeamSettings');
    } finally {
      setLoading((p) => ({ ...p, settings: false }));
    }
  }, [propertyId]);

  const loadIntegrations = useCallback(async () => {
    setLoading((p) => ({ ...p, integrations: true }));
    try {
      const res = await accountSettingsService.getIntegrations(propertyId);
      if (res.data) setIntegrations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.getIntegrations');
      setIntegrations([]);
    } finally {
      setLoading((p) => ({ ...p, integrations: false }));
    }
  }, [propertyId]);

  const loadPermissions = useCallback(async () => {
    setLoading((p) => ({ ...p, permissions: true }));
    try {
      const res = await accountSettingsService.getRolePermissions(propertyId);
      if (res.data && typeof res.data === 'object') setRolePermissions(res.data as RolePermissionMap);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.getRolePermissions');
    } finally {
      setLoading((p) => ({ ...p, permissions: false }));
    }
  }, [propertyId]);

  const refreshData = useCallback(async () => {
    setError(null);
    await Promise.all([loadTeam(), loadSettings(), loadIntegrations()]);
  }, [loadTeam, loadSettings, loadIntegrations]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addTeamMember = useCallback(
    async (data: AddTeamMemberRequest): Promise<TeamMember | null> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await retryWithBackoff(
          () => accountSettingsService.addTeamMember(data, propertyId),
          { maxRetries: 2, baseDelay: 500 }
        );
        if (res.data) {
          setTeamMembers((prev) => [res.data as TeamMember, ...prev]);
          showSuccess('Team member added successfully');
          return res.data as TeamMember;
        }
        showError(res.error || 'Failed to add team member');
        return null;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.addTeamMember');
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to add team member';
        setError(msg);
        showError(msg);
        return null;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  const updateTeamMember = useCallback(
    async (id: string, data: UpdateTeamMemberRequest): Promise<TeamMember | null> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await accountSettingsService.updateTeamMember(id, data, propertyId);
        if (res.data) {
          setTeamMembers((prev) => prev.map((m) => (m.id === id ? (res.data as TeamMember) : m)));
          showSuccess('Team member updated');
          return res.data as TeamMember;
        }
        showError(res.error || 'Failed to update');
        return null;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.updateTeamMember');
        showError('Failed to update team member');
        return null;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  const removeTeamMember = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await accountSettingsService.removeTeamMember(id, propertyId);
        if (res.data?.deleted) {
          setTeamMembers((prev) => prev.filter((m) => m.id !== id));
          showSuccess('Team member removed');
          return true;
        }
        showError(res.error || 'Failed to remove');
        return false;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.removeTeamMember');
        showError('Failed to remove team member');
        return false;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  const updateTeamSettings = useCallback(
    async (data: Partial<TeamSettings>): Promise<boolean> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await accountSettingsService.updateTeamSettings(data as Parameters<typeof accountSettingsService.updateTeamSettings>[0], propertyId);
        if (res.data) {
          setTeamSettings(res.data as TeamSettings);
          showSuccess('Team settings updated');
          return true;
        }
        showError(res.error || 'Failed to update settings');
        return false;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.updateTeamSettings');
        showError('Failed to update team settings');
        return false;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  const addIntegration = useCallback(
    async (data: AddIntegrationRequest): Promise<Integration | null> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await accountSettingsService.addIntegration(data, propertyId);
        if (res.data) {
          setIntegrations((prev) => [...prev, res.data as Integration]);
          showSuccess('Integration added');
          return res.data as Integration;
        }
        showError(res.error || 'Failed to add integration');
        return null;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.addIntegration');
        showError('Failed to add integration');
        return null;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  const testIntegration = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await accountSettingsService.testIntegration(id, propertyId);
        if (res.data?.ok) {
          showSuccess('Connection test successful');
          return true;
        }
        showError(res.data?.message || 'Test failed');
        return false;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.testIntegration');
        showError('Connection test failed');
        return false;
      }
    },
    [propertyId]
  );

  const updateRolePermissions = useCallback(
    async (data: RolePermissionMap): Promise<boolean> => {
      setLoading((p) => ({ ...p, save: true }));
      try {
        const res = await accountSettingsService.updateRolePermissions(data, propertyId);
        if (res.data) {
          setRolePermissions(res.data);
          showSuccess('Role permissions updated');
          return true;
        }
        return false;
      } catch (e) {
        ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'account-settings.updateRolePermissions');
        showError('Failed to update permissions');
        return false;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    [propertyId]
  );

  return {
    propertyId,
    teamMembers,
    teamSettings,
    integrations,
    rolePermissions,
    loading,
    error,
    setError,
    refreshData,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    updateTeamSettings,
    addIntegration,
    testIntegration,
    updateRolePermissions,
    setTeamSettings,
    setTeamMembers,
    setIntegrations,
  };
}
