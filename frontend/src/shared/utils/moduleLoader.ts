import type { ModuleDefinition } from '../../types/module';
import ModuleRegistryService from '../../core/moduleRegistry';

export class ModuleLoader {
  private static instance: ModuleLoader;
  private loadedModules: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ModuleLoader {
    if (!ModuleLoader.instance) {
      ModuleLoader.instance = new ModuleLoader();
    }
    return ModuleLoader.instance;
  }

  async loadModule(moduleId: string): Promise<any> {
    // Check if module is already loaded
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId);
    }

    // Get module definition
    const moduleRegistry = ModuleRegistryService.getInstance();
    const moduleDefinition = moduleRegistry.getModule(moduleId);

    if (!moduleDefinition) {
      throw new Error(`Module ${moduleId} not found in registry`);
    }

    try {
      // Dynamic import of the module
      const module = await import(`../../modules/${moduleId}/${moduleDefinition.ui.component}`);
      
      // Store the loaded module
      this.loadedModules.set(moduleId, module);
      
      console.log(`Module ${moduleId} loaded successfully`);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error);
      throw new Error(`Failed to load module ${moduleId}: ${error}`);
    }
  }

  async loadModuleComponent(moduleId: string): Promise<React.ComponentType<any>> {
    const module = await this.loadModule(moduleId);
    const moduleRegistry = ModuleRegistryService.getInstance();
    const moduleDefinition = moduleRegistry.getModule(moduleId);

    if (!moduleDefinition) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const componentName = moduleDefinition.ui.component;
    const Component = module.default || module[componentName];

    if (!Component) {
      throw new Error(`Component ${componentName} not found in module ${moduleId}`);
    }

    return Component;
  }

  async loadModuleTab(moduleId: string, tabId: string): Promise<React.ComponentType<any>> {
    const moduleRegistry = ModuleRegistryService.getInstance();
    const moduleDefinition = moduleRegistry.getModule(moduleId);

    if (!moduleDefinition) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const tab = moduleDefinition.ui.tabs.find(t => t.id === tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found in module ${moduleId}`);
    }

    try {
      const tabModule = await import(`../../modules/${moduleId}/tabs/${tab.component}`);
      const Component = tabModule.default || tabModule[tab.component];

      if (!Component) {
        throw new Error(`Tab component ${tab.component} not found`);
      }

      return Component;
    } catch (error) {
      console.error(`Failed to load tab ${tabId} for module ${moduleId}:`, error);
      throw new Error(`Failed to load tab ${tabId}: ${error}`);
    }
  }

  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  unloadModule(moduleId: string): boolean {
    return this.loadedModules.delete(moduleId);
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  clearLoadedModules(): void {
    this.loadedModules.clear();
  }
}

export default ModuleLoader; 