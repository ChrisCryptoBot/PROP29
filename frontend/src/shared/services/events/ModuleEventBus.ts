/**
 * Module Event Bus for PROPER 2.9
 * Enables decoupled communication between modules
 */

export interface ModuleEvent<T = any> {
  type: string;
  module: string;
  data: T;
  timestamp: number;
  id: string;
}

export class ModuleEventBus {
  private static instance: ModuleEventBus;
  private listeners = new Map<string, Array<(event: ModuleEvent) => void>>();
  private onceListeners = new Map<string, Array<(event: ModuleEvent) => void>>();
  private eventHistory: ModuleEvent[] = [];
  private readonly maxHistorySize = 100;

  static getInstance(): ModuleEventBus {
    if (!ModuleEventBus.instance) {
      ModuleEventBus.instance = new ModuleEventBus();
    }
    return ModuleEventBus.instance;
  }

  emit(type: string, data: any, moduleName: string) {
    const event: ModuleEvent = {
      type,
      module: moduleName,
      data,
      timestamp: Date.now(),
      id: this.generateId()
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify regular listeners
    const eventListeners = this.listeners.get(type) || [];
    const globalListeners = this.listeners.get('*') || [];
    
    [...eventListeners, ...globalListeners].forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Event listener error for ${type}:`, error);
      }
    });

    // Notify once listeners and remove them
    const onceEventListeners = this.onceListeners.get(type) || [];
    onceEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Event once listener error for ${type}:`, error);
      }
    });
    if (onceEventListeners.length > 0) {
      this.onceListeners.delete(type);
    }

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 Module Event: ${type}`, { module: moduleName, data });
    }
  }

  subscribe(eventType: string, listener: (event: ModuleEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  once(eventType: string, listener: (event: ModuleEvent) => void): void {
    if (!this.onceListeners.has(eventType)) {
      this.onceListeners.set(eventType, []);
    }
    
    this.onceListeners.get(eventType)!.push(listener);
  }

  subscribeToModule(moduleName: string, handler: (event: ModuleEvent) => void): () => void {
    const moduleListener = (event: ModuleEvent) => {
      if (event.module === moduleName) {
        handler(event);
      }
    };

    return this.subscribe('*', moduleListener);
  }

  getEventHistory(moduleName?: string, eventType?: string): ModuleEvent[] {
    let filtered = [...this.eventHistory];

    if (moduleName) {
      filtered = filtered.filter(event => event.module === moduleName);
    }

    if (eventType) {
      filtered = filtered.filter(event => event.type === eventType);
    }

    return filtered;
  }

  getEventStats() {
    const eventsByModule = new Map<string, number>();
    const eventsByType = new Map<string, number>();

    this.eventHistory.forEach(event => {
      eventsByModule.set(event.module, (eventsByModule.get(event.module) || 0) + 1);
      eventsByType.set(event.type, (eventsByType.get(event.type) || 0) + 1);
    });

    return {
      totalEvents: this.eventHistory.length,
      activeListeners: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      onceListeners: Array.from(this.onceListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      eventTypes: Array.from(this.listeners.keys()),
      modules: Array.from(new Set(this.eventHistory.map(e => e.module))),
      eventsByModule: Object.fromEntries(eventsByModule),
      eventsByType: Object.fromEntries(eventsByType),
      oldestEvent: this.eventHistory[0]?.timestamp,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.timestamp
    };
  }

  clear() {
    this.eventHistory = [];
    this.listeners.clear();
    this.onceListeners.clear();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 