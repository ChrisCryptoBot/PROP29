/**
 * Profile Settings state and actions.
 * Loads profile, 2FA, sessions; provides updateProfile, changePassword, 2FA, sessions, certifications CRUD.
 * Uses ErrorHandlerService and retry for critical operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { showSuccess, showError } from '../../../utils/toast';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { profileSettingsService } from '../services/profileSettingsService';
import type {
  UserProfile,
  UpdateProfileRequest,
  AddCertificationRequest,
  UpdateCertificationRequest,
  SessionInfo,
} from '../types/profile-settings.types';

const defaultProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: 'viewer',
  department: '',
  phone: '',
  employeeId: '',
  hireDate: '',
  companyEmail: '',
  emergencyContact: { name: '', phone: '', relationship: '' },
  preferences: { language: 'en', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', theme: 'dark' },
  certifications: [],
  workSchedule: { shift: 'morning', daysOff: [], overtimeEligible: false },
};

export interface UseProfileSettingsStateReturn {
  profile: UserProfile;
  sessions: SessionInfo[];
  twoFAEnabled: boolean;
  loading: { profile: boolean; sessions: boolean; twoFa: boolean; save: boolean };
  error: string | null;
  setError: (v: string | null) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile | null>;
  uploadAvatar: (file: File) => Promise<UserProfile | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  load2FAStatus: () => Promise<void>;
  enable2FA: () => Promise<boolean>;
  disable2FA: () => Promise<boolean>;
  loadSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  addCertification: (data: AddCertificationRequest) => Promise<UserProfile | null>;
  updateCertification: (id: string, data: UpdateCertificationRequest) => Promise<UserProfile | null>;
  removeCertification: (id: string) => Promise<UserProfile | null>;
}

export function useProfileSettingsState(): UseProfileSettingsStateReturn {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    profile: true,
    sessions: false,
    twoFa: false,
    save: false,
  });

  const loadProfile = useCallback(async () => {
    setLoading((p) => ({ ...p, profile: true }));
    try {
      const res = await profileSettingsService.getProfile();
      if (res.data) {
        setProfile(res.data as UserProfile);
      }
    } catch (e) {
      ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.getProfile');
      setError('Failed to load profile');
    } finally {
      setLoading((p) => ({ ...p, profile: false }));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const uploadAvatar = useCallback(async (file: File): Promise<UserProfile | null> => {
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (JPEG or PNG).');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Image must be 2MB or smaller.');
      return null;
    }
    setLoading((p) => ({ ...p, save: true }));
    setError(null);
    try {
      const res = await profileSettingsService.uploadAvatar(file);
      if (res.data) {
        setProfile(res.data as UserProfile);
        showSuccess('Profile picture updated');
        return res.data as UserProfile;
      }
      showError(res.error || 'Failed to upload picture');
      return null;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.uploadAvatar');
      showError(msg);
      setError(msg);
      return null;
    } finally {
      setLoading((p) => ({ ...p, save: false }));
    }
  }, []);

  const updateProfile = useCallback(
    async (data: UpdateProfileRequest): Promise<UserProfile | null> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await retryWithBackoff(
          () => profileSettingsService.updateProfile(data),
          { maxRetries: 2, shouldRetry: (err) => (err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response?.status !== 400 : true) }
        );
        if (res.data) {
          setProfile(res.data as UserProfile);
          showSuccess('Profile updated successfully');
          return res.data as UserProfile;
        }
        showError(res.error || 'Failed to update profile');
        return null;
      } catch (e) {
        const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.updateProfile');
        showError(msg);
        setError(msg);
        return null;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      setLoading((p) => ({ ...p, save: true }));
      setError(null);
      try {
        const res = await retryWithBackoff(
          () => profileSettingsService.changePassword(currentPassword, newPassword),
          { maxRetries: 2 }
        );
        if (res.data || res.success) {
          showSuccess('Password updated successfully');
          return true;
        }
        showError((res as { error?: string }).error || 'Failed to update password');
        return false;
      } catch (e) {
        const err = e as { response?: { data?: { detail?: string } } };
        const detail = err?.response?.data?.detail;
        const msg = detail || ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.changePassword');
        showError(msg);
        setError(msg);
        return false;
      } finally {
        setLoading((p) => ({ ...p, save: false }));
      }
    },
    []
  );

  const load2FAStatus = useCallback(async () => {
    setLoading((p) => ({ ...p, twoFa: true }));
    try {
      const res = await profileSettingsService.get2FAStatus();
      if (res.data) setTwoFAEnabled(res.data.enabled);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'profile-settings.get2FAStatus');
    } finally {
      setLoading((p) => ({ ...p, twoFa: false }));
    }
  }, []);

  const enable2FA = useCallback(async (): Promise<boolean> => {
    try {
      const res = await profileSettingsService.enable2FA();
      if (res.data?.enabled) {
        setTwoFAEnabled(true);
        showSuccess('2FA enabled');
        return true;
      }
      showError(res.error || 'Failed to enable 2FA');
      return false;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.enable2FA');
      showError(msg);
      return false;
    }
  }, []);

  const disable2FA = useCallback(async (): Promise<boolean> => {
    try {
      const res = await profileSettingsService.disable2FA();
      if (res.data && !res.data.enabled) {
        setTwoFAEnabled(false);
        showSuccess('2FA disabled');
        return true;
      }
      showError(res.error || 'Failed to disable 2FA');
      return false;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.disable2FA');
      showError(msg);
      return false;
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading((p) => ({ ...p, sessions: true }));
    try {
      const res = await profileSettingsService.getSessions();
      if (res.data) setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      ErrorHandlerService.logError(e instanceof Error ? e : new Error(String(e)), 'profile-settings.getSessions');
    } finally {
      setLoading((p) => ({ ...p, sessions: false }));
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const res = await profileSettingsService.revokeSession(sessionId);
      if (res.data || res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showSuccess('Session revoked');
        return true;
      }
      showError(res.error || 'Failed to revoke session');
      return false;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.revokeSession');
      showError(msg);
      return false;
    }
  }, []);

  const addCertification = useCallback(async (data: AddCertificationRequest): Promise<UserProfile | null> => {
    setLoading((p) => ({ ...p, save: true }));
    try {
      const res = await profileSettingsService.addCertification(data);
      if (res.data) {
        setProfile(res.data as UserProfile);
        showSuccess('Certification added');
        return res.data as UserProfile;
      }
      showError(res.error || 'Failed to add certification');
      return null;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.addCertification');
      showError(msg);
      return null;
    } finally {
      setLoading((p) => ({ ...p, save: false }));
    }
  }, []);

  const updateCertification = useCallback(async (id: string, data: UpdateCertificationRequest): Promise<UserProfile | null> => {
    setLoading((p) => ({ ...p, save: true }));
    try {
      const res = await profileSettingsService.updateCertification(id, data);
      if (res.data) {
        setProfile(res.data as UserProfile);
        showSuccess('Certification updated');
        return res.data as UserProfile;
      }
      showError(res.error || 'Failed to update certification');
      return null;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.updateCertification');
      showError(msg);
      return null;
    } finally {
      setLoading((p) => ({ ...p, save: false }));
    }
  }, []);

  const removeCertification = useCallback(async (id: string): Promise<UserProfile | null> => {
    setLoading((p) => ({ ...p, save: true }));
    try {
      const res = await profileSettingsService.removeCertification(id);
      if (res.data) {
        setProfile(res.data as UserProfile);
        showSuccess('Certification removed');
        return res.data as UserProfile;
      }
      showError(res.error || 'Failed to remove certification');
      return null;
    } catch (e) {
      const msg = ErrorHandlerService.handle(e instanceof Error ? e : new Error(String(e)), 'profile-settings.removeCertification');
      showError(msg);
      return null;
    } finally {
      setLoading((p) => ({ ...p, save: false }));
    }
  }, []);

  return {
    profile,
    sessions,
    twoFAEnabled,
    loading,
    error,
    setError,
    refreshProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    load2FAStatus,
    enable2FA,
    disable2FA,
    loadSessions,
    revokeSession,
    addCertification,
    updateCertification,
    removeCertification,
  };
}
