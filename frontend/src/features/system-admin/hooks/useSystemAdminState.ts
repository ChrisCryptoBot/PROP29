import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    AdminUser,
    SystemIntegration,
    SystemMetrics,
    SystemActivity,
    SystemAlert,
    AuditLogEntry,
    SystemSettings,
    SystemRole,
    SystemProperty
} from '../types/system-admin.types';

export const useSystemAdminState = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [integrations, setIntegrations] = useState<SystemIntegration[]>([]);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [properties, setProperties] = useState<SystemProperty[]>([]);

    // Modal states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);

    // Selection state
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<SystemProperty | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Constants
    const ERROR_TIMEOUT = 5000;
    const API_TIMEOUT = 1000;

    const showError = useCallback((message: string) => {
        setError(message);
        setTimeout(() => setError(null), ERROR_TIMEOUT);
    }, []);

    const showSuccess = useCallback((message: string) => {
        // In a real app, this would use a toast notification
        console.log('Success:', message);
        // For now keeping it compatible with the previous manual verify expectation if toast isn't ready
        alert(message);
    }, []);

    const handleAddUser = useCallback(() => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            showError('Name and email are required');
            return;
        }

        const user: AdminUser = {
            ...newUser,
            id: Math.random().toString(36).substr(2, 9),
            lastActive: 'Never'
        };

        setUsers(prev => [...prev, user]);
        setNewUser({ name: '', email: '', role: 'user', department: '', status: 'active' });
        setShowAddUserModal(false);
        showSuccess('User created successfully');
    }, [newUser, showError, showSuccess]);

    const handleUpdateUser = useCallback(() => {
        if (selectedUser) {
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
            setShowEditUserModal(false);
            setSelectedUser(null);
            showSuccess('User updated successfully');
        }
    }, [selectedUser, showSuccess]);

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
        showSuccess('Integration created successfully');
    }, [newIntegration, showError, showSuccess]);

    const handleUpdateRole = useCallback(() => {
        if (selectedRole) {
            setRoles(prev => prev.map(r => r.id === selectedRole.id ? selectedRole : r));
            setShowEditRoleModal(false);
            setSelectedRole(null);
            showSuccess('Role updated successfully');
        }
    }, [selectedRole, showSuccess]);

    const handleUpdateProperty = useCallback(() => {
        if (selectedProperty) {
            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? selectedProperty : p));
            setShowEditPropertyModal(false);
            setSelectedProperty(null);
            showSuccess('Property updated successfully');
        }
    }, [selectedProperty, showSuccess]);

    const handleSaveSettings = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            showSuccess('Settings saved successfully!');
        }, API_TIMEOUT);
    }, [showSuccess]);

    const handleExportAuditLog = useCallback(() => {
        const csvContent = "Timestamp,User,Action,Status,IP Address\n" +
            "2024-01-15 10:30:15,admin@system.com,User login successful,Success,192.168.1.100\n" +
            "2024-01-15 10:25:42,System,High memory usage detected,Warning,127.0.0.1\n" +
            "2024-01-15 10:20:18,System,Database connection timeout,Error,127.0.0.1\n" +
            "2024-01-15 10:15:33,System,Backup completed successfully,Success,127.0.0.1";

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const systemMetrics = useMemo((): SystemMetrics => {
        const activeUsersCount = users.filter(u => u.status === 'active').length;
        const activeIntegrationsCount = integrations.filter(i => i.status === 'active').length;

        return {
            totalUsers: users.length,
            activeUsers: activeUsersCount,
            inactiveUsers: users.length - activeUsersCount,
            activeIntegrations: activeIntegrationsCount,
            inactiveIntegrations: integrations.length - activeIntegrationsCount,
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
    }, [users, integrations]);

    const systemAlerts = useMemo((): SystemAlert[] => [], []);

    const recentActivity = useMemo((): SystemActivity[] => [], []);

    const auditLogs = useMemo((): AuditLogEntry[] => [], []);

    return {
        activeTab,
        setActiveTab,
        loading,
        error,
        setError,
        users,
        integrations,
        roles,
        properties,
        filteredUsers,
        searchQuery,
        setSearchQuery,
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
        selectedUser,
        setSelectedUser,
        selectedRole,
        setSelectedRole,
        selectedProperty,
        setSelectedProperty,
        newUser,
        setNewUser,
        newIntegration,
        setNewIntegration,
        settings,
        setSettings,
        systemMetrics,
        systemAlerts,
        recentActivity,
        auditLogs,
        handleAddUser,
        handleUpdateUser,
        handleUpdateRole,
        handleUpdateProperty,
        handleAddIntegration,
        handleSaveSettings,
        handleExportAuditLog,
        showSuccess,
        showError
    };
};
