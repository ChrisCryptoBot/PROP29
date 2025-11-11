import type { ModuleEvent } from '../types/module';

type EventHandler = (data: any) => void;
type EventHandlers = { [eventType: string]: EventHandler[] };

class EventBus {
  private static instance: EventBus;
  private handlers: EventHandlers = {};
  private eventHistory: ModuleEvent[] = [];
  private maxHistorySize = 1000;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit(eventType: string, data: any, moduleId?: string): void {
    const event: ModuleEvent = {
      type: eventType,
      moduleId: moduleId || 'system',
      data,
      timestamp: Date.now()
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify handlers
    const handlers = this.handlers[eventType] || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });

    // Log for debugging
    console.log(`Event emitted: ${eventType}`, { moduleId, data });
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers[eventType];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  once(eventType: string, handler: EventHandler): void {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(eventType, onceHandler);
    };
    this.on(eventType, onceHandler);
  }

  getEventHistory(moduleId?: string): ModuleEvent[] {
    if (moduleId) {
      return this.eventHistory.filter(event => event.moduleId === moduleId);
    }
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getHandlersCount(eventType: string): number {
    return (this.handlers[eventType] || []).length;
  }

  // Module-specific event helpers
  emitModuleEvent(moduleId: string, eventType: string, data: any): void {
    this.emit(`${moduleId}:${eventType}`, data, moduleId);
  }

  onModuleEvent(moduleId: string, eventType: string, handler: EventHandler): void {
    this.on(`${moduleId}:${eventType}`, handler);
  }

  offModuleEvent(moduleId: string, eventType: string, handler: EventHandler): void {
    this.off(`${moduleId}:${eventType}`, handler);
  }
}

export default EventBus; 