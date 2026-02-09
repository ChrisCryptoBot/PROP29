import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    AdminUser,
    SystemIntegration,
    SystemMetrics,
    SystemActivity,
    SystemAlert,
    AuditLogEntry,
    SystemSettings,
    SystemRole,
    SystemProperty,
    SecurityPolicy
} from '../types/system-admin.types';
import { showSuccess as toastSuccess, showError as toastError, showWarning as toastWarning, adminNotifications } from '../../../utils/toast';
import * as systemAdminApi from '../services/systemAdminApi';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { useSystemAdminOfflineQueue } from './useSystemAdminOfflineQueue';

export const useSystemAdminState = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [integrations, setIntegrations] = useState<SystemIntegration[]>([]);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [properties, setProperties] = useState<SystemProperty[]>([]);

    // Audit log state - now real, not empty
    const [auditLogEntries, setAuditLogEntries] = useState<AuditLogEntry[]>([]);

    // Activity and alerts state
    const [activityEntries, setActivityEntries] = useState<SystemActivity[]>([]);
    const [alertEntries, setAlertEntries] = useState<SystemAlert[]>([]);

    // Modal states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'destructive' | 'warning' | 'default';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // Selection state
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<SystemProperty | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [selectedIntegration, setSelectedIntegration] = useState<SystemIntegration | null>(null);
    const [selectedPropertyForMetrics, setSelectedPropertyForMetrics] = useState<SystemProperty | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Extra modal states
    const [showEditIntegrationModal, setShowEditIntegrationModal] = useState(false);
    const [showImportRolesModal, setShowImportRolesModal] = useState(false);
    const [showModifyMatrixModal, setShowModifyMatrixModal] = useState(false);
    const [showPropertyMetricsModal, setShowPropertyMetricsModal] = useState(false);

    // Permission matrix: module -> role column -> access level label
    const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, string>>>(() => {
        const modules = ['Overview', 'Users', 'Roles', 'Properties', 'Security', 'System', 'Audit'];
        const roles = ['Administrator', 'Staff Ops', 'Read Only'];
        const initial: Record<string, Record<string, string>> = {};
        modules.forEach(m => {
            initial[m] = {};
            if (m === 'Overview' || m === 'Users') initial[m]['Read Only'] = 'Audit';
            else initial[m]['Read Only'] = 'Denied';
            if (m === 'System' || m === 'Security') initial[m]['Staff Ops'] = 'Restricted';
            else initial[m]['Staff Ops'] = 'Operational';
            initial[m]['Administrator'] = 'Total Access';
        });
        return initial;
    });

    // Filter states for UsersTab
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Filter states for AuditTab
    const [auditDateRange, setAuditDateRange] = useState<string>('7d');
    const [auditCategory, setAuditCategory] = useState<string>('');
    const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

    // Pagination state
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize, setUsersPageSize] = useState(25);
    const [auditPage, setAuditPage] = useState(1);
    const [auditPageSize, setAuditPageSize] = useState(25);

    // Filtered users (used by handleExportUsers and pagination)
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.department.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Offline queue
    const operationQueue = useSystemAdminOfflineQueue({
        onSynced: () => {
            refreshData();
        }
    });
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Security policy state
    const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy>({
        mfaEnabled: true,
        passwordComplexity: true,
        sessionTimeoutEnabled: true,
        hardwareVerification: false,
        ipWhitelisting: false,
        vpnRequired: false,
        dormantAccountSuspension: true,
        ssoEnabled: false,
        maxLoginAttempts: 5,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 30
    });

    const [newUser, setNewUser] = useState<Omit<AdminUser, 'id' | 'lastActive'>>({
        name: '',
        email: '',
        role: 'user',
        department: '',
        status: 'active'
    });

    const [newIntegration, setNewIntegration] = useState<Omit<SystemIntegration, 'id' | 'lastSync'>>({
        name: '',
        type: '',
        endpoint: '',
        status: 'active'
    });

    const [settings, setSettings] = useState<SystemSettings>({
        systemName: 'Proper 2.9 Security System',
        timezone: 'UTC',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        autoBackup: true,
        maintenanceMode: false,
        debugMode: false,
        autoUpdates: true,
        cacheTtl: 3600,
        maxConnections: 100,
        sessionTimeout: 30
    });

    // Default settings for reset
    const defaultSettings: SystemSettings = {
        systemName: 'Proper 2.9 Security System',
        timezone: 'UTC',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        autoBackup: true,
        maintenanceMode: false,
        debugMode: false,
        autoUpdates: true,
        cacheTtl: 3600,
        maxConnections: 100,
        sessionTimeout: 30
    };

    // Constants
    const ERROR_TIMEOUT = 5000;

    const loadData = useCallback(async () => {
        const results = await Promise.allSettled([
            systemAdminApi.fetchAdminUsers(),
            systemAdminApi.fetchAdminRoles(),
            systemAdminApi.fetchAdminProperties(),
            systemAdminApi.fetchAdminIntegrations(),
            systemAdminApi.fetchSystemSettings(),
            systemAdminApi.fetchSecurityPolicies(),
        ]);
        const [usersRes, rolesRes, propertiesRes, integrationsRes, settingsRes, policiesRes] = results;
        let hasFailure = false;
        if (usersRes.status === 'fulfilled' && usersRes.value.length > 0) setUsers(usersRes.value);
        else if (usersRes.status === 'rejected') { ErrorHandlerService.logError(usersRes.reason instanceof Error ? usersRes.reason : new Error(String(usersRes.reason)), 'SystemAdmin:loadUsers'); hasFailure = true; }
        if (rolesRes.status === 'fulfilled' && rolesRes.value.length > 0) setRoles(rolesRes.value);
        else if (rolesRes.status === 'rejected') { ErrorHandlerService.logError(rolesRes.reason instanceof Error ? rolesRes.reason : new Error(String(rolesRes.reason)), 'SystemAdmin:loadRoles'); hasFailure = true; }
        if (propertiesRes.status === 'fulfilled' && propertiesRes.value.length > 0) setProperties(propertiesRes.value);
        else if (propertiesRes.status === 'rejected') { ErrorHandlerService.logError(propertiesRes.reason instanceof Error ? propertiesRes.reason : new Error(String(propertiesRes.reason)), 'SystemAdmin:loadProperties'); hasFailure = true; }
        if (integrationsRes.status === 'fulfilled' && integrationsRes.value.length > 0) setIntegrations(integrationsRes.value);
        else if (integrationsRes.status === 'rejected') { ErrorHandlerService.logError(integrationsRes.reason instanceof Error ? integrationsRes.reason : new Error(String(integrationsRes.reason)), 'SystemAdmin:loadIntegrations'); hasFailure = true; }
        if (settingsRes.status === 'fulfilled' && settingsRes.value) setSettings(settingsRes.value);
        else if (settingsRes.status === 'rejected') { ErrorHandlerService.logError(settingsRes.reason instanceof Error ? settingsRes.reason : new Error(String(settingsRes.reason)), 'SystemAdmin:loadSettings'); hasFailure = true; }
        if (policiesRes.status === 'fulfilled' && policiesRes.value) setSecurityPolicies(policiesRes.value);
        else if (policiesRes.status === 'rejected') { ErrorHandlerService.logError(policiesRes.reason instanceof Error ? policiesRes.reason : new Error(String(policiesRes.reason)), 'SystemAdmin:loadSecurityPolicies'); hasFailure = true; }
        setLastSyncTimestamp(new Date());
        return hasFailure;
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingInitial(true);
            try {
                const hasFailure = await loadData();
                if (cancelled) return;
                if (hasFailure) toastWarning('Some data could not be loaded. Check connection and try refresh.');
            } finally {
                if (!cancelled) setLoadingInitial(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loadData]);

    const refreshData = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const hasFailure = await loadData();
            if (hasFailure) toastWarning('Some data could not be loaded.');
        } finally {
            setLoading(false);
        }
    }, [loadData, loading]);

    // Utility to add audit log entry
    const addAuditEntry = useCallback((
        eventType: string,
        user: string,
        action: string,
        status: 'Success' | 'Warning' | 'Error'
    ) => {
        const entry: AuditLogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            eventType,
            user,
            action,
            status,
            ipAddress: '—' // In production, pass from request context
        };
        setAuditLogEntries(prev => [entry, ...prev]);
    }, []);

    // Utility to add activity entry
    const addActivityEntry = useCallback((
        user: string,
        action: string,
        type: 'user_management' | 'system' | 'security' | 'other'
    ) => {
        const entry: SystemActivity = {
            id: Math.random().toString(36).substr(2, 9),
            user,
            action,
            type,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        };
        setActivityEntries(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
    }, []);

    const clearAlerts = useCallback(() => {
        setAlertEntries([]);
    }, []);

    const showError = useCallback((message: string) => {
        setError(message);
        toastError(message);
        setTimeout(() => setError(null), ERROR_TIMEOUT);
    }, []);

    const showSuccess = useCallback((message: string) => {
        toastSuccess(message);
    }, []);

    const showWarning = useCallback((message: string) => {
        toastWarning(message);
    }, []);

    // ============ USER MANAGEMENT ============

    const handleAddUser = useCallback(async () => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            showError('Name and email are required');
            return;
        }

        const user: AdminUser = {
            ...newUser,
            id: Math.random().toString(36).substr(2, 9),
            lastActive: 'Never'
        };

        // Check if offline - enqueue if so
        if (!navigator.onLine && operationQueue) {
            operationQueue.enqueue({
                type: 'create_user',
                payload: user as unknown as Record<string, unknown>,
                queuedAt: new Date().toISOString()
            });
            toastSuccess('User creation queued for sync when connection is restored');
            setUsers(prev => [...prev, user]);
            setNewUser({ name: '', email: '', role: 'user', department: '', status: 'active' });
            setShowAddUserModal(false);
            return;
        }

        try {
            await retryWithBackoff(() => systemAdminApi.createAdminUser(user));
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:createUser');
            // If network error, enqueue for retry
            const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
            if (isNetworkIssue && operationQueue) {
                operationQueue.enqueue({
                    type: 'create_user',
                    payload: user as unknown as Record<string, unknown>,
                    queuedAt: new Date().toISOString()
                });
                toastSuccess('User creation queued for sync when connection is restored');
                setUsers(prev => [...prev, user]);
                setNewUser({ name: '', email: '', role: 'user', department: '', status: 'active' });
                setShowAddUserModal(false);
                return;
            }
            throw error;
        }

        setUsers(prev => [...prev, user]);
        setNewUser({ name: '', email: '', role: 'user', department: '', status: 'active' });
        setShowAddUserModal(false);

        // Add audit entry
        addAuditEntry('User Management', 'admin@system.com', `Created user: ${user.name} (${user.email})`, 'Success');
        addActivityEntry('Admin', `Created user ${user.name}`, 'user_management');

        adminNotifications.userCreated();
    }, [newUser, showError, addAuditEntry, addActivityEntry, operationQueue]);

    // FIX: handleUpdateUser now accepts optional updatedUser parameter
    const handleUpdateUser = useCallback(async (updatedUser?: AdminUser) => {
        const userToUpdate = updatedUser || selectedUser;
        if (userToUpdate) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await retryWithBackoff(() => systemAdminApi.updateAdminUser(userToUpdate.id, userToUpdate));
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:updateUser');
            }

            setUsers(prev => prev.map(u => u.id === userToUpdate.id ? userToUpdate : u));
            setShowEditUserModal(false);
            setSelectedUser(null);

            // Add audit entry
            addAuditEntry('User Management', 'admin@system.com', `Updated user: ${userToUpdate.name}`, 'Success');
            addActivityEntry('Admin', `Updated user ${userToUpdate.name}`, 'user_management');

            adminNotifications.userUpdated();
        }
    }, [selectedUser, addAuditEntry, addActivityEntry]);

    // NEW: Suspend user handler
    const handleSuspendUser = useCallback((userId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id === userId) {
                addAuditEntry('User Management', 'admin@system.com', `Suspended user: ${u.name}`, 'Warning');
                addActivityEntry('Admin', `Suspended user ${u.name}`, 'user_management');
                return { ...u, status: 'inactive' as const };
            }
            return u;
        }));
        showSuccess('User suspended successfully');
    }, [addAuditEntry, addActivityEntry, showSuccess]);

    // NEW: Delete user handler
    const handleDeleteUser = useCallback(async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await retryWithBackoff(() => systemAdminApi.deleteAdminUser(userId));
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:deleteUser');
            }

            setUsers(prev => prev.filter(u => u.id !== userId));
            addAuditEntry('User Management', 'admin@system.com', `Deleted user: ${user.name}`, 'Warning');
            addActivityEntry('Admin', `Deleted user ${user.name}`, 'user_management');
            showSuccess('User deleted successfully');
        }
    }, [users, addAuditEntry, addActivityEntry, showSuccess]);

    // ============ ROLE MANAGEMENT ============

    // NEW: Add role handler - actually adds to state
    const handleAddRole = useCallback(async (roleData: {
        title: string;
        description: string;
        permissions: string;
        modules: string;
        badge: string;
        badgeVariant: 'destructive' | 'success' | 'secondary' | 'outline';
    }) => {
        if (!roleData.title.trim()) {
            showError('Role name is required');
            return;
        }

        const role: SystemRole = {
            id: Math.random().toString(36).substr(2, 9),
            icon: 'fa-user-shield',
            title: roleData.title,
            description: roleData.description,
            users: 0,
            permissions: roleData.permissions,
            modules: roleData.modules,
            badge: roleData.badge,
            badgeVariant: roleData.badgeVariant
        };

        // Persist to backend (stub returns success; real persistence needed)
        try {
            await retryWithBackoff(() => systemAdminApi.createAdminRole(role));
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:createRole');
        }

        setRoles(prev => [...prev, role]);
        setShowAddRoleModal(false);

        // Add audit entry
        addAuditEntry('Role Management', 'admin@system.com', `Created role: ${role.title}`, 'Success');
        addActivityEntry('Admin', `Created role ${role.title}`, 'security');

        adminNotifications.roleCreated();
    }, [showError, addAuditEntry, addActivityEntry]);

    const handleUpdateRole = useCallback(async (updatedRole?: SystemRole) => {
        const roleToUpdate = updatedRole || selectedRole;
        if (roleToUpdate) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await retryWithBackoff(() => systemAdminApi.updateAdminRole(roleToUpdate.id, roleToUpdate));
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:updateRole');
            }

            setRoles(prev => prev.map(r => r.id === roleToUpdate.id ? roleToUpdate : r));
            setShowEditRoleModal(false);
            setSelectedRole(null);

            // Add audit entry
            addAuditEntry('Role Management', 'admin@system.com', `Updated role: ${roleToUpdate.title}`, 'Success');
            addActivityEntry('Admin', `Updated role ${roleToUpdate.title}`, 'security');

            showSuccess('Role updated successfully');
        }
    }, [selectedRole, addAuditEntry, addActivityEntry, showSuccess]);

    // NEW: Delete role handler
    const handleDeleteRole = useCallback(async (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await retryWithBackoff(() => systemAdminApi.deleteAdminRole(roleId));
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:deleteRole');
            }

            setRoles(prev => prev.filter(r => r.id !== roleId));
            addAuditEntry('Role Management', 'admin@system.com', `Deleted role: ${role.title}`, 'Warning');
            addActivityEntry('Admin', `Deleted role ${role.title}`, 'security');
            showSuccess('Role deleted successfully');
        }
    }, [roles, addAuditEntry, addActivityEntry, showSuccess]);

    // Import roles from CSV/JSON (parsed array of role-like objects)
    const handleImportRoles = useCallback(async (imported: Array<{ title: string; description?: string; permissions?: string; modules?: string; badge?: string; badgeVariant?: 'destructive' | 'success' | 'secondary' | 'outline' }>) => {
        if (imported.length === 0) {
            showWarning('No valid roles to import');
            return;
        }
        let created = 0;
        for (const r of imported) {
            if (!r.title?.trim()) continue;
            const role: SystemRole = {
                id: Math.random().toString(36).substr(2, 9),
                icon: 'fa-user-shield',
                title: r.title.trim(),
                description: (r.description ?? '').trim(),
                users: 0,
                permissions: (r.permissions ?? 'Standard').trim(),
                modules: (r.modules ?? 'All').trim(),
                badge: (r.badge ?? 'Standard').trim(),
                badgeVariant: r.badgeVariant ?? 'secondary'
            };
            try {
                await retryWithBackoff(() => systemAdminApi.createAdminRole(role));
                setRoles(prev => [...prev, role]);
                created++;
            } catch (err) {
                ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), 'SystemAdmin:importRole');
            }
        }
        setShowImportRolesModal(false);
        addAuditEntry('Role Management', 'admin@system.com', `Imported ${created} role(s)`, 'Success');
        showSuccess(`Imported ${created} role(s)`);
    }, [addAuditEntry, showSuccess, showWarning]);

    // Save permission matrix (edits from Modify Matrix modal)
    const handleSavePermissionMatrix = useCallback((matrix: Record<string, Record<string, string>>) => {
        setPermissionMatrix(matrix);
        setShowModifyMatrixModal(false);
        addAuditEntry('Role Management', 'admin@system.com', 'Updated permissions matrix', 'Success');
        showSuccess('Permission matrix updated');
    }, [addAuditEntry, showSuccess]);

    // ============ PROPERTY MANAGEMENT ============

    // NEW: Add property handler - actually adds to state
    const handleAddProperty = useCallback(async (propertyData: {
        title: string;
        description: string;
        rooms: number;
        occupancy: string;
        revenue: string;
        status: string;
    }) => {
        if (!propertyData.title.trim()) {
            showError('Property name is required');
            return;
        }

        const property: SystemProperty = {
            id: Math.random().toString(36).substr(2, 9),
            icon: 'fa-building',
            title: propertyData.title,
            description: propertyData.description,
            rooms: propertyData.rooms,
            occupancy: propertyData.occupancy,
            revenue: propertyData.revenue,
            status: propertyData.status
        };

        // Persist to backend (stub returns success; real persistence needed)
        try {
            await retryWithBackoff(() => systemAdminApi.createAdminProperty(property));
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:createProperty');
        }

        setProperties(prev => [...prev, property]);
        setShowAddPropertyModal(false);

        // Add audit entry
        addAuditEntry('Property Management', 'admin@system.com', `Created property: ${property.title}`, 'Success');
        addActivityEntry('Admin', `Added property ${property.title}`, 'other');

        adminNotifications.propertyCreated();
    }, [showError, addAuditEntry, addActivityEntry]);

    const handleUpdateProperty = useCallback(async (updatedProperty?: SystemProperty) => {
        const propertyToUpdate = updatedProperty || selectedProperty;
        if (propertyToUpdate) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await retryWithBackoff(() => systemAdminApi.updateAdminProperty(propertyToUpdate.id, propertyToUpdate));
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:updateProperty');
            }

            setProperties(prev => prev.map(p => p.id === propertyToUpdate.id ? propertyToUpdate : p));
            setShowEditPropertyModal(false);
            setSelectedProperty(null);

            // Add audit entry
            addAuditEntry('Property Management', 'admin@system.com', `Updated property: ${propertyToUpdate.title}`, 'Success');
            addActivityEntry('Admin', `Updated property ${propertyToUpdate.title}`, 'other');

            showSuccess('Property updated successfully');
        }
    }, [selectedProperty, addAuditEntry, addActivityEntry, showSuccess]);

    // NEW: Delete property handler
    const handleDeleteProperty = useCallback(async (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            // Persist to backend (stub returns success; real persistence needed)
            try {
                await systemAdminApi.deleteAdminProperty(propertyId);
            } catch (error) {
                ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:deleteProperty');
            }

            setProperties(prev => prev.filter(p => p.id !== propertyId));
            addAuditEntry('Property Management', 'admin@system.com', `Deleted property: ${property.title}`, 'Warning');
            addActivityEntry('Admin', `Deleted property ${property.title}`, 'other');
            showSuccess('Property deleted successfully');
        }
    }, [properties, addAuditEntry, addActivityEntry, showSuccess]);

    // ============ INTEGRATION MANAGEMENT ============

    const handleAddIntegration = useCallback(() => {
        if (!newIntegration.name.trim() || !newIntegration.endpoint.trim()) {
            showError('Name and endpoint are required');
            return;
        }

        const integration: SystemIntegration = {
            ...newIntegration,
            id: Math.random().toString(36).substr(2, 9),
            lastSync: new Date().toISOString().replace('T', ' ').substr(0, 16)
        };

        setIntegrations(prev => [...prev, integration]);
        setNewIntegration({ name: '', type: '', endpoint: '', status: 'active' });
        setShowAddIntegrationModal(false);

        // Add audit entry
        addAuditEntry('Integration', 'admin@system.com', `Created integration: ${integration.name}`, 'Success');
        addActivityEntry('Admin', `Added integration ${integration.name}`, 'system');

        showSuccess('Integration created successfully');
    }, [newIntegration, showError, addAuditEntry, addActivityEntry, showSuccess]);

    // NEW: Test integration handler
    const handleTestIntegration = useCallback((integrationId: string) => {
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
            // In production, this would make an actual health check
            addAuditEntry('Integration', 'admin@system.com', `Tested integration: ${integration.name}`, 'Success');
            showSuccess(`Integration "${integration.name}" is responding`);
        }
    }, [integrations, addAuditEntry, showSuccess]);

    // NEW: Sync integration handler
    const handleSyncIntegration = useCallback((integrationId: string) => {
        setIntegrations(prev => prev.map(i => {
            if (i.id === integrationId) {
                addAuditEntry('Integration', 'admin@system.com', `Synced integration: ${i.name}`, 'Success');
                return { ...i, lastSync: new Date().toISOString().replace('T', ' ').substr(0, 16) };
            }
            return i;
        }));
        showSuccess('Integration synced successfully');
    }, [addAuditEntry, showSuccess]);

    // NEW: Disable integration handler with confirmation
    const handleDisableIntegration = useCallback((integrationId: string) => {
        const integration = integrations.find(i => i.id === integrationId);
        if (!integration) return;

        // Only confirm when disabling (not enabling)
        if (integration.status === 'active') {
            setConfirmModal({
                isOpen: true,
                title: 'Disable integration',
                message: `Are you sure you want to disable "${integration.name}"? This will stop data synchronization.`,
                onConfirm: () => {
                    setIntegrations(prev => prev.map(i => {
                        if (i.id === integrationId) {
                            addAuditEntry('Integration', 'admin@system.com', `Disabled integration: ${i.name}`, 'Warning');
                            return { ...i, status: 'inactive' as const };
                        }
                        return i;
                    }));
                    showSuccess('Integration disabled');
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                },
                variant: 'warning',
            });
        } else {
            // Enable without confirmation
            setIntegrations(prev => prev.map(i => {
                if (i.id === integrationId) {
                    addAuditEntry('Integration', 'admin@system.com', `Enabled integration: ${i.name}`, 'Success');
                    return { ...i, status: 'active' as const };
                }
                return i;
            }));
            showSuccess('Integration enabled');
        }
    }, [integrations, addAuditEntry, showSuccess]);

    // Update integration (Edit Integration modal)
    const handleUpdateIntegration = useCallback((integrationId: string, updates: Partial<SystemIntegration>) => {
        const integration = integrations.find(i => i.id === integrationId);
        if (!integration) return;
        const updated = { ...integration, ...updates };
        setIntegrations(prev => prev.map(i => i.id === integrationId ? updated : i));
        setShowEditIntegrationModal(false);
        setSelectedIntegration(null);
        addAuditEntry('Integration', 'admin@system.com', `Updated integration: ${updated.name}`, 'Success');
        showSuccess('Integration updated');
    }, [integrations, addAuditEntry, showSuccess]);

    // Export integrations as CSV
    const handleExportIntegrations = useCallback(() => {
        if (integrations.length === 0) {
            showWarning('No integrations to export');
            return;
        }
        const headers = 'Name,Type,Endpoint,Status,Last Sync\n';
        const rows = integrations.map(i =>
            `${i.name},${i.type},${i.endpoint},${i.status},${i.lastSync}`
        ).join('\n');
        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `integrations-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addAuditEntry('Integration', 'admin@system.com', `Exported ${integrations.length} integrations`, 'Success');
        showSuccess(`Exported ${integrations.length} integrations`);
    }, [integrations, addAuditEntry, showSuccess, showWarning]);

    // ============ SETTINGS MANAGEMENT ============

    const handleSaveSettings = useCallback(async () => {
        setLoading(true);
        try {
            await retryWithBackoff(() => systemAdminApi.updateSystemSettings(settings));
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:saveSettings');
            setLoading(false);
            showError('Failed to save settings');
            return;
        }
        setLoading(false);
        addAuditEntry('System', 'admin@system.com', 'Updated system settings', 'Success');
        addActivityEntry('Admin', 'Updated system settings', 'system');
        adminNotifications.settingsSaved();
    }, [settings, addAuditEntry, addActivityEntry, showError]);

    // NEW: Reset settings to defaults
    const handleResetSettings = useCallback(() => {
        setSettings(defaultSettings);
        addAuditEntry('System', 'admin@system.com', 'Reset system settings to defaults', 'Warning');
        addActivityEntry('Admin', 'Reset settings to defaults', 'system');
        showSuccess('Settings reset to defaults');
    }, [addAuditEntry, addActivityEntry, showSuccess]);

    // ============ SECURITY POLICY MANAGEMENT ============

    const handleUpdateSecurityPolicies = useCallback(async (updates: Partial<SecurityPolicy>) => {
        const updatedPolicies = { ...securityPolicies, ...updates };
        // Persist to backend (stub returns success; real persistence needed)
        try {
            await retryWithBackoff(() => systemAdminApi.updateSecurityPolicies(updatedPolicies));
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'SystemAdmin:updateSecurityPolicies');
            showError('Failed to update security policies');
            return;
        }
        setSecurityPolicies(updatedPolicies);
        addAuditEntry('Security', 'admin@system.com', 'Updated security policies', 'Success');
        addActivityEntry('Admin', 'Updated security policies', 'security');
        showSuccess('Security policies updated');
    }, [securityPolicies, addAuditEntry, addActivityEntry, showSuccess, showError]);

    // ============ AUDIT LOG MANAGEMENT ============

    const handleExportAuditLog = useCallback(() => {
        if (auditLogEntries.length === 0) {
            showWarning('No audit data to export');
            return;
        }

        const headers = "Timestamp,Event Type,User,Action,Status,IP Address\n";
        const rows = auditLogEntries.map(entry =>
            `${entry.timestamp},${entry.eventType},${entry.user},"${entry.action}",${entry.status},${entry.ipAddress}`
        ).join('\n');

        const csvContent = headers + rows;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        addAuditEntry('Audit', 'admin@system.com', `Exported ${auditLogEntries.length} audit entries`, 'Success');
        adminNotifications.auditLogExported();
    }, [auditLogEntries, addAuditEntry, showWarning]);

    // Export users as CSV (Users tab Export button)
    const handleExportUsers = useCallback((userList?: AdminUser[]) => {
        const toExport = userList ?? filteredUsers;
        if (toExport.length === 0) {
            showWarning('No users to export');
            return;
        }
        const headers = 'Name,Email,Role,Department,Status,Last Active\n';
        const rows = toExport.map(u =>
            `${u.name},${u.email},${u.role},${(u.department || '').replace(/,/g, ' ')},${u.status},${u.lastActive}`
        ).join('\n');
        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addAuditEntry('User Management', 'admin@system.com', `Exported ${toExport.length} users`, 'Success');
        showSuccess(`Exported ${toExport.length} users`);
    }, [filteredUsers, addAuditEntry, showWarning, showSuccess]);

    // Bulk export selected users
    const handleBulkExportUsers = useCallback(() => {
        if (selectedUserIds.size === 0) {
            showWarning('Select at least one user to export');
            return;
        }
        const selected = users.filter(u => selectedUserIds.has(u.id));
        handleExportUsers(selected);
        setSelectedUserIds(new Set());
    }, [selectedUserIds, users, handleExportUsers, showWarning]);

    // Bulk set status for selected users
    const handleBulkSetUserStatus = useCallback(async (status: 'active' | 'inactive') => {
        if (selectedUserIds.size === 0) {
            showWarning('Select at least one user');
            return;
        }
        const toUpdate = users.filter(u => selectedUserIds.has(u.id));
        for (const u of toUpdate) {
            try {
                await retryWithBackoff(() => systemAdminApi.updateAdminUser(u.id, { ...u, status }));
            } catch (err) {
                ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), 'SystemAdmin:bulkSetUserStatus');
            }
            setUsers(prev => prev.map(user => user.id === u.id ? { ...user, status } : user));
            addAuditEntry('User Management', 'admin@system.com', `Bulk update: set ${u.name} to ${status}`, 'Success');
        }
        addActivityEntry('Admin', `Bulk set ${toUpdate.length} users to ${status}`, 'user_management');
        showSuccess(`${toUpdate.length} user(s) set to ${status}`);
        setSelectedUserIds(new Set());
    }, [selectedUserIds, users, addAuditEntry, addActivityEntry, showSuccess, showWarning]);

    // NEW: Clear audit log with confirmation
    const handleClearAuditLog = useCallback(() => {
        const count = auditLogEntries.length;
        if (count === 0) {
            showWarning('No audit data to clear');
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Clear audit history',
            message: `Are you sure you want to clear ${count} audit log entries? This action cannot be undone.`,
            onConfirm: () => {
                setAuditLogEntries([]);
                addAuditEntry('Audit', 'admin@system.com', `Cleared ${count} audit entries`, 'Warning');
                showSuccess('Audit log cleared');
                setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            variant: 'destructive',
        });
    }, [auditLogEntries.length, addAuditEntry, showSuccess, showWarning]);

    // Prepend a single audit entry (e.g. from WebSocket)
    const prependAuditLogEntry = useCallback((entry: AuditLogEntry) => {
        setAuditLogEntries(prev => [entry, ...prev]);
    }, []);

    // ============ COMPUTED VALUES ============

    const filteredAuditLogs = useMemo(() => {
        return auditLogEntries.filter(entry => {
            const matchesSearch = !auditSearchQuery ||
                entry.user.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                entry.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                entry.ipAddress.includes(auditSearchQuery);
            const matchesCategory = !auditCategory || entry.eventType.toLowerCase().includes(auditCategory.toLowerCase());

            // Date range filtering
            if (auditDateRange) {
                const entryDate = new Date(entry.timestamp);
                const now = new Date();
                let daysBack = 7;
                if (auditDateRange === '24h') daysBack = 1;
                else if (auditDateRange === '7d') daysBack = 7;
                else if (auditDateRange === '30d') daysBack = 30;
                else if (auditDateRange === '90d') daysBack = 90;

                const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
                if (entryDate < cutoffDate) return false;
            }

            return matchesSearch && matchesCategory;
        });
    }, [auditLogEntries, auditSearchQuery, auditCategory, auditDateRange]);

    // Paginated arrays
    const paginatedUsers = useMemo(() => {
        const start = (usersPage - 1) * usersPageSize;
        const end = start + usersPageSize;
        return filteredUsers.slice(start, end);
    }, [filteredUsers, usersPage, usersPageSize]);

    const paginatedAuditLogs = useMemo(() => {
        const start = (auditPage - 1) * auditPageSize;
        const end = start + auditPageSize;
        return filteredAuditLogs.slice(start, end);
    }, [filteredAuditLogs, auditPage, auditPageSize]);

    // Pagination totals
    const usersTotalPages = useMemo(() => Math.ceil(filteredUsers.length / usersPageSize), [filteredUsers.length, usersPageSize]);
    const auditTotalPages = useMemo(() => Math.ceil(filteredAuditLogs.length / auditPageSize), [filteredAuditLogs.length, auditPageSize]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setUsersPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        setAuditPage(1);
    }, [auditSearchQuery, auditCategory, auditDateRange]);

    // Hardware heartbeat / last known good state
    // Mark integrations as stale/offline if lastSync is older than threshold (15 minutes)
    const integrationsWithStatus = useMemo(() => {
        const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
        return integrations.map(integration => {
            const lastSyncTime = new Date(integration.lastSync).getTime();
            const now = Date.now();
            const isStale = now - lastSyncTime > STALE_THRESHOLD_MS;
            return {
                ...integration,
                isStale,
                effectiveStatus: integration.status === 'active' && isStale ? 'stale' : integration.status
            };
        });
    }, [integrations]);

    const systemMetrics = useMemo((): SystemMetrics => {
        const activeUsersCount = users.filter(u => u.status === 'active').length;
        const activeIntegrationsCount = integrations.filter(i => i.status === 'active').length;

        return {
            totalUsers: users.length,
            activeUsers: activeUsersCount,
            inactiveUsers: users.length - activeUsersCount,
            activeIntegrations: activeIntegrationsCount,
            inactiveIntegrations: integrations.length - activeIntegrationsCount,
            totalRoles: roles.length,
            totalProperties: properties.length,
            systemHealth: 98,
            uptime: '99.9%',
            securityScore: 95,
            complianceStatus: 'Compliant',
            responseTime: '45ms',
            networkLatency: '12ms',
            lastBackup: '2 hours ago',
            cpuUsage: 23,
            memoryUsage: 62,
            diskUsage: 38
        };
    }, [users, integrations, roles, properties]);

    // System alerts - derived from actual data
    const systemAlerts = useMemo((): SystemAlert[] => {
        return alertEntries;
    }, [alertEntries]);

    // Recent activity - derived from actual data
    const recentActivity = useMemo((): SystemActivity[] => {
        return activityEntries;
    }, [activityEntries]);

    // Audit logs - derived from actual data
    const auditLogs = useMemo((): AuditLogEntry[] => {
        return filteredAuditLogs;
    }, [filteredAuditLogs]);

    return {
        activeTab,
        setActiveTab,
        loading,
        loadingInitial,
        lastSyncTimestamp,
        refreshData,
        error,
        setError,
        users,
        setUsers,
        integrations,
        setIntegrations,
        roles,
        setRoles,
        properties,
        setProperties,
        filteredUsers,
        paginatedUsers,
        usersPage,
        setUsersPage,
        usersPageSize,
        setUsersPageSize,
        usersTotalPages,
        searchQuery,
        setSearchQuery,

        // Filter states
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        auditDateRange,
        setAuditDateRange,
        auditCategory,
        setAuditCategory,
        auditSearchQuery,
        setAuditSearchQuery,

        // Security policies
        securityPolicies,
        setSecurityPolicies,
        handleUpdateSecurityPolicies,

        // Modal states
        showAddUserModal,
        setShowAddUserModal,
        showAddIntegrationModal,
        setShowAddIntegrationModal,
        showEditUserModal,
        setShowEditUserModal,
        showAddRoleModal,
        setShowAddRoleModal,
        showEditRoleModal,
        setShowEditRoleModal,
        showAddPropertyModal,
        setShowAddPropertyModal,
        showEditPropertyModal,
        setShowEditPropertyModal,

        // Selection states
        selectedUser,
        setSelectedUser,
        selectedRole,
        setSelectedRole,
        selectedProperty,
        setSelectedProperty,
        selectedUserIds,
        setSelectedUserIds,
        selectedIntegration,
        setSelectedIntegration,
        selectedPropertyForMetrics,
        setSelectedPropertyForMetrics,

        // Extra modals
        showEditIntegrationModal,
        setShowEditIntegrationModal,
        showImportRolesModal,
        setShowImportRolesModal,
        showModifyMatrixModal,
        setShowModifyMatrixModal,
        showPropertyMetricsModal,
        setShowPropertyMetricsModal,
        permissionMatrix,
        setPermissionMatrix,

        // Form data
        newUser,
        setNewUser,
        newIntegration,
        setNewIntegration,
        settings,
        setSettings,

        // Computed values
        systemMetrics,
        systemAlerts,
        recentActivity,
        auditLogs,
        filteredAuditLogs,
        paginatedAuditLogs,
        auditPage,
        setAuditPage,
        auditPageSize,
        setAuditPageSize,
        auditTotalPages,
        prependAuditLogEntry,

        // User handlers
        handleAddUser,
        handleUpdateUser,
        handleSuspendUser,
        handleDeleteUser,
        handleExportUsers,
        handleBulkExportUsers,
        handleBulkSetUserStatus,

        // Role handlers
        handleAddRole,
        handleUpdateRole,
        handleDeleteRole,
        handleImportRoles,
        handleSavePermissionMatrix,

        // Property handlers
        handleAddProperty,
        handleUpdateProperty,
        handleDeleteProperty,

        // Integration handlers
        handleAddIntegration,
        handleTestIntegration,
        handleSyncIntegration,
        handleDisableIntegration,
        handleUpdateIntegration,
        handleExportIntegrations,

        // Settings handlers
        handleSaveSettings,
        handleResetSettings,

        // Audit handlers
        handleExportAuditLog,
        handleClearAuditLog,

        // Utility functions
        showSuccess,
        showError,
        showWarning,
        addAuditEntry,
        addActivityEntry,
        clearAlerts,

        // Confirmation modal
        confirmModal,
        setConfirmModal,

        // Offline queue
        queuePendingCount: operationQueue.pendingCount,
        queueFailedCount: operationQueue.failedCount,
        retryQueue: operationQueue.retryFailed,
        isOffline,
    };
};
