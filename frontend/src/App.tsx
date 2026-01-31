import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import HelpSupport from './pages/HelpSupport';
import Notifications from './pages/Notifications';
import AccountSettings from './pages/AccountSettings';
import ProfileSettings from './pages/ProfileSettings';
import LoadingSpinner from './components/UI/LoadingSpinner';
import SplashScreen from './components/UI/SplashScreen';
import { WebSocketProvider } from './components/UI/WebSocketProvider';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ModalManager } from './components/modals/ModalManager';
import Layout from './components/Layout/Layout';
import { GlobalRefreshProvider } from './contexts/GlobalRefreshContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Import new module pages
import IncidentLogModule from './features/incident-log/IncidentLogModule';
import PropertyItems from './pages/modules/PropertyItems';
import AccessControlModule from './pages/modules/AccessControlModule';
import Visitors from './pages/modules/Visitors';
import Patrols from './pages/modules/Patrols/index';
import SmartLockers from './pages/modules/SmartLockers/index';
import SmartParking from './pages/modules/SmartParking';
import DigitalHandoverModule from './features/digital-handover';
import GuestSafety from './features/guest-safety';
import IoTMonitoring from './pages/modules/IoTMonitoring';

// Import additional pages for dashboard navigation
import SecurityOperationsCenter from './pages/modules/SecurityOperationsCenter';
import SystemAdministration from './pages/modules/SystemAdministration';
import TeamChat from './pages/modules/TeamChat';

// Fixed Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only redirect after loading is complete and user is definitely not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { closeAllModals } = useModal();
  const location = useLocation();

  // CRITICAL: Clear all modal state on route changes
  React.useEffect(() => {
    closeAllModals();
  }, [location.pathname, closeAllModals]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        } 
      />
      <Route path="/" element={<Navigate to="/modules/patrol" replace />} />
      <Route path="/dashboard" element={<Navigate to="/modules/patrol" replace />} />
      <Route path="/incidents" element={
        <ProtectedRoute>
          <Incidents />
        </ProtectedRoute>
      } />
      <Route path="/patrols" element={
        <ProtectedRoute>
          <Patrols />
        </ProtectedRoute>
      } />
      <Route path="/help" element={
        <ProtectedRoute>
          <Layout>
            <HelpSupport />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <ProfileSettings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <AccountSettings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      {/* Module Pages - All wrapped with Layout for persistent sidebar */}
      <Route path="/modules/event-log" element={
        <ProtectedRoute>
          <Layout>
            <IncidentLogModule />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/property-items" element={
        <ProtectedRoute>
          <Layout>
            <PropertyItems />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/access-control" element={
        <ProtectedRoute>
          <Layout>
            <AccessControlModule key="access-control" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/visitors" element={
        <ProtectedRoute>
          <Layout>
            <Visitors />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/patrol" element={
        <ProtectedRoute>
          <Layout>
            <Patrols />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/admin" element={
        <ProtectedRoute>
          <Layout>
            <SystemAdministration />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/smart-lockers" element={
        <ProtectedRoute>
          <Layout>
            <SmartLockers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/smart-parking" element={
        <ProtectedRoute>
          <Layout>
            <SmartParking />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/system-administration" element={
        <ProtectedRoute>
          <Layout>
            <SystemAdministration />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/digital-handover" element={
        <ProtectedRoute>
          <Layout>
            <DigitalHandoverModule />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/guest-safety" element={
        <ProtectedRoute>
          <Layout>
            <GuestSafety />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/iot-monitoring" element={
        <ProtectedRoute>
          <Layout>
            <IoTMonitoring />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/notifications" element={
        <ProtectedRoute>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/modules/security-operations-center" element={
        <ProtectedRoute>
          <Layout>
            <SecurityOperationsCenter />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/view-cameras" element={
        <ProtectedRoute>
          <Layout>
            <SecurityOperationsCenter />
          </Layout>
        </ProtectedRoute>
      } />
      {/* <Route path="/modules/SystemAdministrationAuth" element={<SystemAdministrationAuth />} /> */}
      {/* <Route path="/modules/admin-auth" element={<SystemAdministrationAuth />} /> */}
      <Route path="/modules/team-chat" element={
        <Layout>
          <TeamChat />
        </Layout>
      } />
      <Route path="/modules/profile-settings" element={
        <ProtectedRoute>
          <Layout>
            <ProfileSettings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/modules/patrol" replace />} />
    </Routes>
  );
};


const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <AuthProvider>
      <ModalProvider>
        <WebSocketProvider>
          <NetworkStatusProvider>
            <NotificationsProvider>
              <GlobalRefreshProvider>
          {showSplash && <SplashScreen />}
          {!showSplash && <MainAppContent />}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ModalManager />
              </GlobalRefreshProvider>
            </NotificationsProvider>
          </NetworkStatusProvider>
        </WebSocketProvider>
      </ModalProvider>
    </AuthProvider>
  );
};

export default App; 
