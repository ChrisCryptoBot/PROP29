import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

interface NetworkStatusContextValue {
  status: NetworkStatus;
  setStatus: (status: NetworkStatus) => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue | undefined>(undefined);

interface NetworkStatusProviderProps {
  children: React.ReactNode;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<NetworkStatus>(() => (navigator.onLine ? 'online' : 'offline'));

  const handleOnline = useCallback(() => setStatus('online'), []);
  const handleOffline = useCallback(() => setStatus('offline'), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOffline, handleOnline]);

  useEffect(() => {
    const handleNetworkError = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }
      setStatus('reconnecting');
    };
    const handleNetworkOk = () => setStatus('online');
    window.addEventListener('api:network-error', handleNetworkError as EventListener);
    window.addEventListener('api:network-ok', handleNetworkOk as EventListener);
    return () => {
      window.removeEventListener('api:network-error', handleNetworkError as EventListener);
      window.removeEventListener('api:network-ok', handleNetworkOk as EventListener);
    };
  }, []);

  const value = useMemo(() => ({ status, setStatus }), [status]);

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = (): NetworkStatusContextValue => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  }
  return context;
};
