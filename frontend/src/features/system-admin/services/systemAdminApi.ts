/**
 * System Administration API client.
 * Uses the shared ApiService; endpoints are defined in backend api/system_admin_endpoints.py.
 * Ready for persistence, mobile agents, hardware devices, and external data sources.
 */
import apiService from '../../../services/ApiService';
import type {
  AdminUser,
  SystemRole,
  SystemProperty,
  SystemIntegration,
  AuditLogEntry,
  SystemSettings,
  SecurityPolicy,
} from '../types/system-admin.types';

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await apiService.getSystemAdminUsers();
    return (res.data ?? []) as AdminUser[];
  } catch (error) {
    // Backend may not be available or endpoints may return 404; return empty array gracefully
    return [];
  }
}

export async function fetchAdminRoles(): Promise<SystemRole[]> {
  try {
    const res = await apiService.getSystemAdminRoles();
    return (res.data ?? []) as SystemRole[];
  } catch {
    return [];
  }
}

export async function fetchAdminProperties(): Promise<SystemProperty[]> {
  try {
    const res = await apiService.getSystemAdminProperties();
    return (res.data ?? []) as SystemProperty[];
  } catch {
    return [];
  }
}

export async function fetchAdminIntegrations(): Promise<SystemIntegration[]> {
  try {
    const res = await apiService.getSystemAdminIntegrations();
    return (res.data ?? []) as SystemIntegration[];
  } catch {
    return [];
  }
}

export async function fetchSystemSettings(): Promise<SystemSettings | null> {
  try {
    const res = await apiService.getSystemAdminSettings();
    return (res.data ?? null) as SystemSettings | null;
  } catch {
    return null;
  }
}

export async function fetchSecurityPolicies(): Promise<SecurityPolicy | null> {
  try {
    const res = await apiService.getSystemAdminSecurityPolicies();
    return (res.data ?? null) as SecurityPolicy | null;
  } catch {
    return null;
  }
}

export async function fetchAuditLog(params?: {
  date_range?: string;
  category?: string;
  search?: string;
}): Promise<AuditLogEntry[]> {
  const res = await apiService.getSystemAdminAudit(params);
  return (res.data ?? []) as AuditLogEntry[];
}

export async function checkIntegrationHealth(integrationId: string): Promise<{ status: string; message?: string }> {
  const res = await apiService.getIntegrationHealth(integrationId);
  const data = res.data as { id: string; status: string; message?: string } | undefined;
  return data ? { status: data.status, message: data.message } : { status: 'unknown' };
}

export async function triggerIntegrationSync(integrationId: string): Promise<{ synced: boolean; message?: string }> {
  const res = await apiService.syncIntegration(integrationId);
  const data = res.data as { id: string; synced: boolean; message?: string } | undefined;
  return data ? { synced: data.synced, message: data.message } : { synced: false };
}

// User mutations
export async function createAdminUser(user: AdminUser): Promise<AdminUser> {
  try {
    const res = await apiService.createSystemAdminUser(user as unknown as Record<string, unknown>);
    return (res.data ?? user) as AdminUser;
  } catch {
    return user;
  }
}

export async function updateAdminUser(userId: string, user: Partial<AdminUser>): Promise<AdminUser | null> {
  try {
    const res = await apiService.updateSystemAdminUser(userId, user as unknown as Record<string, unknown>);
    return (res.data as unknown) as AdminUser | null;
  } catch {
    return null;
  }
}

export async function deleteAdminUser(userId: string): Promise<boolean> {
  try {
    const res = await apiService.deleteSystemAdminUser(userId);
    return res.data?.deleted ?? false;
  } catch {
    return false;
  }
}

// Role mutations
export async function createAdminRole(role: SystemRole): Promise<SystemRole> {
  try {
    const res = await apiService.createSystemAdminRole(role as unknown as Record<string, unknown>);
    return (res.data ?? role) as SystemRole;
  } catch {
    return role;
  }
}

export async function updateAdminRole(roleId: string, role: Partial<SystemRole>): Promise<SystemRole | null> {
  try {
    const res = await apiService.updateSystemAdminRole(roleId, role as unknown as Record<string, unknown>);
    return (res.data as unknown) as SystemRole | null;
  } catch {
    return null;
  }
}

export async function deleteAdminRole(roleId: string): Promise<boolean> {
  try {
    const res = await apiService.deleteSystemAdminRole(roleId);
    return res.data?.deleted ?? false;
  } catch {
    return false;
  }
}

// Property mutations
export async function createAdminProperty(property: SystemProperty): Promise<SystemProperty> {
  try {
    const res = await apiService.createSystemAdminProperty(property as unknown as Record<string, unknown>);
    return (res.data ?? property) as SystemProperty;
  } catch {
    return property;
  }
}

export async function updateAdminProperty(propertyId: string, property: Partial<SystemProperty>): Promise<SystemProperty | null> {
  try {
    const res = await apiService.updateSystemAdminProperty(propertyId, property as unknown as Record<string, unknown>);
    return (res.data as unknown) as SystemProperty | null;
  } catch {
    return null;
  }
}

export async function deleteAdminProperty(propertyId: string): Promise<boolean> {
  try {
    const res = await apiService.deleteSystemAdminProperty(propertyId);
    return res.data?.deleted ?? false;
  } catch {
    return false;
  }
}

// Settings mutations
export async function updateSystemSettings(settings: SystemSettings): Promise<SystemSettings | null> {
  try {
    const res = await apiService.updateSystemAdminSettings(settings as unknown as Record<string, unknown>);
    return (res.data as unknown) as SystemSettings | null;
  } catch {
    return null;
  }
}

export async function updateSecurityPolicies(policies: SecurityPolicy): Promise<SecurityPolicy | null> {
  try {
    const res = await apiService.updateSystemAdminSecurityPolicies(policies as unknown as Record<string, unknown>);
    return (res.data as unknown) as SecurityPolicy | null;
  } catch {
    return null;
  }
}

export async function restartServices(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await apiService.postSystemAdminRestartServices();
    return (res.data as { ok: boolean; message?: string }) ?? { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function runDiagnostics(): Promise<{ status: string; checks?: { name: string; status: string; latency_ms?: number }[]; timestamp?: string }> {
  try {
    const res = await apiService.getSystemAdminDiagnostics();
    return (res.data as { status: string; checks?: { name: string; status: string; latency_ms?: number }[]; timestamp?: string }) ?? { status: 'error' };
  } catch {
    return { status: 'error', checks: [] };
  }
}

export async function runSecurityScan(): Promise<{ passed: boolean; issues?: unknown[]; summary?: string; timestamp?: string }> {
  try {
    const res = await apiService.postSystemAdminSecurityScan();
    return (res.data as { passed: boolean; issues?: unknown[]; summary?: string; timestamp?: string }) ?? { passed: false };
  } catch {
    return { passed: false, issues: [], summary: 'Scan failed.' };
  }
}
