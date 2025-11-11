/**
 * useModuleEvents Hook for PROPER 2.9
 * React-friendly interface to the Module Event Bus
 */

import { useCallback, useEffect, useRef } from 'react';
import { ModuleEventBus, ModuleEvent } from '../services/events';

interface UseModuleEventsReturn {
  emit: (type: string, data: any) => void;
  subscribe: (eventType: string, handler: (event: ModuleEvent) => void) => () => void;
  once: (eventType: string, handler: (event: ModuleEvent) => void) => void;
  unsubscribeAll: () => void;
}

export const useModuleEvents = (moduleName: string): UseModuleEventsReturn => {
  const eventBus = ModuleEventBus.getInstance();
  const subscriptionsRef = useRef<Array<() => void>>([]);

  // Emit events with the module name
  const emit = useCallback((type: string, data: any) => {
    eventBus.emit(type, data, moduleName);
  }, [moduleName, eventBus]);

  // Subscribe to events and track subscriptions for cleanup
  const subscribe = useCallback((eventType: string, handler: (event: ModuleEvent) => void) => {
    const unsubscribe = eventBus.subscribe(eventType, handler);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [eventBus]);

  // Subscribe to events once
  const once = useCallback((eventType: string, handler: (event: ModuleEvent) => void) => {
    eventBus.once(eventType, handler);
  }, [eventBus]);

  // Unsubscribe from all events
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    emit,
    subscribe,
    once,
    unsubscribeAll
  };
};

// Specialized hooks for common event patterns
export const useModuleLifecycle = (moduleName: string) => {
  const { emit, subscribe } = useModuleEvents(moduleName);

  const emitLoaded = useCallback((data?: any) => {
    emit('module.loaded', { ...data, timestamp: Date.now() });
  }, [emit]);

  const emitUnloaded = useCallback((data?: any) => {
    emit('module.unloaded', { ...data, timestamp: Date.now() });
  }, [emit]);

  const emitError = useCallback((error: string | Error, data?: any) => {
    const errorMessage = error instanceof Error ? error.message : error;
    emit('module.error', { error: errorMessage, ...data, timestamp: Date.now() });
  }, [emit]);

  const onModuleLoaded = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('module.loaded', handler);
  }, [subscribe]);

  const onModuleError = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('module.error', handler);
  }, [subscribe]);

  return {
    emitLoaded,
    emitUnloaded,
    emitError,
    onModuleLoaded,
    onModuleError
  };
};

export const useDataEvents = (moduleName: string) => {
  const { emit, subscribe } = useModuleEvents(moduleName);

  const emitDataLoaded = useCallback((count: number, data?: any) => {
    emit('data.loaded', { count, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitDataUpdated = useCallback((id: string, data?: any) => {
    emit('data.updated', { id, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitDataDeleted = useCallback((id: string, data?: any) => {
    emit('data.deleted', { id, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitDataError = useCallback((error: string | Error, data?: any) => {
    const errorMessage = error instanceof Error ? error.message : error;
    emit('data.error', { error: errorMessage, ...data, timestamp: Date.now() });
  }, [emit]);

  const onDataLoaded = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('data.loaded', handler);
  }, [subscribe]);

  const onDataUpdated = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('data.updated', handler);
  }, [subscribe]);

  const onDataDeleted = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('data.deleted', handler);
  }, [subscribe]);

  const onDataError = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('data.error', handler);
  }, [subscribe]);

  return {
    emitDataLoaded,
    emitDataUpdated,
    emitDataDeleted,
    emitDataError,
    onDataLoaded,
    onDataUpdated,
    onDataDeleted,
    onDataError
  };
};

export const useUIEvents = (moduleName: string) => {
  const { emit, subscribe } = useModuleEvents(moduleName);

  const emitModalOpened = useCallback((modalId: string, data?: any) => {
    emit('ui.modal.opened', { modalId, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitModalClosed = useCallback((modalId: string, data?: any) => {
    emit('ui.modal.closed', { modalId, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitTabChanged = useCallback((tabId: string, data?: any) => {
    emit('ui.tab.changed', { tabId, ...data, timestamp: Date.now() });
  }, [emit]);

  const emitFilterChanged = useCallback((filters: any, data?: any) => {
    emit('ui.filter.changed', { filters, ...data, timestamp: Date.now() });
  }, [emit]);

  const onModalOpened = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('ui.modal.opened', handler);
  }, [subscribe]);

  const onModalClosed = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('ui.modal.closed', handler);
  }, [subscribe]);

  const onTabChanged = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('ui.tab.changed', handler);
  }, [subscribe]);

  const onFilterChanged = useCallback((handler: (event: ModuleEvent) => void) => {
    return subscribe('ui.filter.changed', handler);
  }, [subscribe]);

  return {
    emitModalOpened,
    emitModalClosed,
    emitTabChanged,
    emitFilterChanged,
    onModalOpened,
    onModalClosed,
    onTabChanged,
    onFilterChanged
  };
};

// Cross-module communication hook
export const useCrossModuleEvents = () => {
  const eventBus = ModuleEventBus.getInstance();
  const subscriptionsRef = useRef<Array<() => void>>([]);

  const subscribeToModule = useCallback((moduleName: string, handler: (event: ModuleEvent) => void) => {
    const unsubscribe = eventBus.subscribeToModule(moduleName, handler);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [eventBus]);

  const subscribeToEvent = useCallback((eventType: string, handler: (event: ModuleEvent) => void) => {
    const unsubscribe = eventBus.subscribe(eventType, handler);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [eventBus]);

  const subscribeToAll = useCallback((handler: (event: ModuleEvent) => void) => {
    const unsubscribe = eventBus.subscribe('*', handler);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [eventBus]);

  const getEventHistory = useCallback((moduleName?: string, eventType?: string) => {
    return eventBus.getEventHistory(moduleName, eventType);
  }, [eventBus]);

  const getEventStats = useCallback(() => {
    return eventBus.getEventStats();
  }, [eventBus]);

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribeToModule,
    subscribeToEvent,
    subscribeToAll,
    getEventHistory,
    getEventStats,
    unsubscribeAll
  };
};

// Event debugging hook (development only)
export const useEventDebugger = (moduleName?: string) => {
  const eventBus = ModuleEventBus.getInstance();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handler = (event: ModuleEvent) => {
      if (!moduleName || event.module === moduleName) {
        console.group(`📡 Module Event: ${event.type}`);
        console.log('Module:', event.module);
        console.log('Data:', event.data);
        console.log('Timestamp:', new Date(event.timestamp).toISOString());
        console.log('Event ID:', event.id);
        console.groupEnd();
      }
    };

    const unsubscribe = eventBus.subscribe('*', handler);

    return () => {
      unsubscribe();
    };
  }, [eventBus, moduleName]);
};

export default useModuleEvents; 