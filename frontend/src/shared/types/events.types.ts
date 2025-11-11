import { ModuleEvent } from '../services/events/ModuleEventBus';

export interface EventSubscription {
  id: string;
  eventType: string;
  listener: (event: ModuleEvent) => void;
  created: number;
}

export type EventHandler<T = any> = (event: ModuleEvent<T>) => void | Promise<void>;

export interface EventEmitter {
  emit<T = any>(type: string, data: T): void;
  subscribe<T = any>(type: string, handler: EventHandler<T>): () => void;
  unsubscribe(type: string, handler: EventHandler): void;
}

export interface EventMetrics {
  totalEvents: number;
  activeSubscriptions: number;
  eventTypes: string[];
  averageProcessingTime: number;
}

// Core module events
export interface ModuleLifecycleEvents {
  'module.loaded': { moduleName: string; loadTime: number };
  'module.unloaded': { moduleName: string };
  'module.error': { moduleName: string; error: string };
  'module.updated': { moduleName: string; version: string };
}

export interface ModuleDataEvents {
  'data.loaded': { moduleName: string; count: number };
  'data.updated': { moduleName: string; id: string };
  'data.deleted': { moduleName: string; id: string };
  'data.error': { moduleName: string; error: string };
}

export interface ModuleUIEvents {
  'ui.modal.opened': { moduleName: string; modalId: string };
  'ui.modal.closed': { moduleName: string; modalId: string };
  'ui.tab.changed': { moduleName: string; tabId: string };
  'ui.filter.changed': { moduleName: string; filters: any };
} 