import type { ModuleRegistry, ModuleDefinition } from '../types/module';

// Register modules
const modules: ModuleRegistry = {
  'access-control': {
    id: 'access-control',
    name: 'Access Control',
    version: '1.0.0',
    description: 'Comprehensive access control management system for hotel security',
    category: 'Security',
    priority: 1,
    dependencies: [],
    permissions: ['access-control:read', 'access-control:write', 'access-control:admin'],
    features: ['device-management', 'access-logs', 'real-time-monitoring', 'analytics', 'user-management'],
    api: {
      baseUrl: '/api/access-control',
      endpoints: ['/devices', '/logs', '/analytics', '/users']
    },
    ui: {
      component: 'AccessControl',
      icon: 'lock',
      color: '#2563eb',
      tabs: [
        { id: 'overview', name: 'Overview', component: 'OverviewTab' },
        { id: 'devices', name: 'Devices', component: 'DevicesTab' },
        { id: 'logs', name: 'Logs', component: 'LogsTab' },
        { id: 'analytics', name: 'Analytics', component: 'AnalyticsTab' }
      ]
    },
    events: [
      'access-control:device-status-changed',
      'access-control:access-granted',
      'access-control:access-denied',
      'access-control:device-offline'
    ],
    settings: {
      autoRefresh: true,
      refreshInterval: 30000,
      enableNotifications: true,
      logRetention: 90
    }
  }
};

class ModuleRegistryService {
  private static instance: ModuleRegistryService;
  private registry: ModuleRegistry = modules;

  private constructor() {}

  static getInstance(): ModuleRegistryService {
    if (!ModuleRegistryService.instance) {
      ModuleRegistryService.instance = new ModuleRegistryService();
    }
    return ModuleRegistryService.instance;
  }

  registerModule(moduleId: string, module: ModuleDefinition): void {
    this.registry[moduleId] = module;
  }

  getModule(moduleId: string): ModuleDefinition | undefined {
    return this.registry[moduleId];
  }

  getAllModules(): ModuleRegistry {
    return { ...this.registry };
  }

  getModulesByCategory(category: string): ModuleDefinition[] {
    return Object.values(this.registry).filter((module: ModuleDefinition) => module.category === category);
  }

  getModulesByPermission(permission: string): ModuleDefinition[] {
    return Object.values(this.registry).filter((module: ModuleDefinition) => 
      module.permissions.includes(permission)
    );
  }

  unregisterModule(moduleId: string): boolean {
    if (this.registry[moduleId]) {
      delete this.registry[moduleId];
      return true;
    }
    return false;
  }

  validateModule(module: ModuleDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!module.id) errors.push('Module ID is required');
    if (!module.name) errors.push('Module name is required');
    if (!module.version) errors.push('Module version is required');
    if (!module.category) errors.push('Module category is required');
    if (!module.ui?.component) errors.push('Module UI component is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ModuleRegistryService; 