export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: 'active' | 'inactive';
    lastActive: string;
}

export interface SystemIntegration {
    id: string;
    name: string;
    type: string;
    endpoint: string;
    status: 'active' | 'inactive';
    lastSync: string;
}

export interface SystemMetrics {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeIntegrations: number;
    inactiveIntegrations: number;
    systemHealth: number;
    uptime: string;
    securityScore: number;
    complianceStatus: string;
    responseTime: string;
    networkLatency: string;
    lastBackup: string;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
}

export interface SystemActivity {
    id: string;
    user: string;
    action: string;
    type: 'user_management' | 'system' | 'security' | 'other';
    timestamp: string;
}

export interface SystemAlert {
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    eventType: string;
    user: string;
    action: string;
    status: string;
    ipAddress: string;
}

export interface SystemSettings {
    systemName: string;
    timezone: string;
    language: string;
    dateFormat: string;
    autoBackup: boolean;
    maintenanceMode: boolean;
    debugMode: boolean;
    autoUpdates: boolean;
    cacheTtl: number;
    maxConnections: number;
    sessionTimeout: number;
}

export interface SystemRole {
    id: string;
    icon: string;
    title: string;
    description: string;
    users: number;
    permissions: string;
    modules: string;
    badge: string;
    badgeVariant: 'destructive' | 'success' | 'secondary' | 'outline';
}

export interface SystemProperty {
    id: string;
    icon: string;
    title: string;
    description: string;
    rooms: number;
    occupancy: string;
    revenue: string;
    status: string;
}
