import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type RefreshHandler = () => Promise<void>;

interface GlobalRefreshContextValue {
  register: (key: string, handler: RefreshHandler) => void;
  unregister: (key: string) => void;
  triggerGlobalRefresh: (reason?: string) => Promise<void>;
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
}

const GlobalRefreshContext = createContext<GlobalRefreshContextValue | undefined>(undefined);

interface GlobalRefreshProviderProps {
  children: React.ReactNode;
}

export const GlobalRefreshProvider: React.FC<GlobalRefreshProviderProps> = ({ children }) => {
  const handlersRef = useRef<Map<string, RefreshHandler>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const register = useCallback((key: string, handler: RefreshHandler) => {
    handlersRef.current.set(key, handler);
  }, []);

  const unregister = useCallback((key: string) => {
    handlersRef.current.delete(key);
  }, []);

  const triggerGlobalRefresh = useCallback(async () => {
    if (handlersRef.current.size === 0) {
      return;
    }
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    const handlers = Array.from(handlersRef.current.values());
    await Promise.allSettled(handlers.map((handler) => handler()));
    setLastRefreshedAt(new Date());
    setIsRefreshing(false);
  }, [isRefreshing]);

  useEffect(() => {
    const isStale = () => {
      if (!lastRefreshedAt) return true;
      return Date.now() - lastRefreshedAt.getTime() > 30000;
    };

    const handleFocus = () => {
      if (!document.hasFocus()) {
        return;
      }
      if (isStale() && !isRefreshing) {
        triggerGlobalRefresh();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isStale() && !isRefreshing) {
        triggerGlobalRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRefreshing, lastRefreshedAt, triggerGlobalRefresh]);

  const value = useMemo(
    () => ({
      register,
      unregister,
      triggerGlobalRefresh,
      isRefreshing,
      lastRefreshedAt
    }),
    [isRefreshing, lastRefreshedAt, register, triggerGlobalRefresh, unregister]
  );

  return (
    <GlobalRefreshContext.Provider value={value}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export const useGlobalRefresh = (): GlobalRefreshContextValue => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error('useGlobalRefresh must be used within GlobalRefreshProvider');
  }
  return context;
};
