import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LoadingSpinner from './components/UI/LoadingSpinner';
import SplashScreen from './components/UI/SplashScreen';

// Import new module pages
import EventLog from './pages/modules/EventLog';
import LostAndFound from './pages/modules/LostAndFound';
import Packages from './pages/modules/Packages';
import AccessControl from './pages/modules/AccessControl';
import Visitors from './pages/modules/Visitors';
import Patrol from './pages/modules/Patrol';
import Admin from './pages/modules/Admin';
import BannedIndividuals from './pages/modules/BannedIndividuals';
import SmartLockers from './pages/modules/SmartLockers';
import SmartParking from './pages/modules/SmartParking';
import DigitalHandover from './pages/modules/DigitalHandover';
import AdvancedReports from './pages/modules/AdvancedReports';
import CybersecurityHub from './pages/modules/CybersecurityHub';
import GuestSafety from './pages/modules/GuestSafety';
import IoTEnvironmental from './pages/modules/IoTEnvironmental';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="patrols" element={<Patrol />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Module Pages */}
        <Route path="modules/event-log" element={<EventLog />} />
        <Route path="modules/lost-and-found" element={<LostAndFound />} />
        <Route path="modules/packages" element={<Packages />} />
        <Route path="modules/access-control" element={<AccessControl />} />
        <Route path="modules/visitors" element={<Visitors />} />
        <Route path="modules/patrol" element={<Patrol />} />
        <Route path="modules/admin" element={<Admin />} />
        <Route path="modules/banned-individuals" element={<BannedIndividuals />} />
        <Route path="modules/smart-lockers" element={<SmartLockers />} />
        <Route path="modules/smart-parking" element={<SmartParking />} />
        <Route path="modules/digital-handover" element={<DigitalHandover />} />
        <Route path="modules/advanced-reports" element={<AdvancedReports />} />
        <Route path="modules/cybersecurity-hub" element={<CybersecurityHub />} />
        <Route path="modules/guest-safety" element={<GuestSafety />} />
        <Route path="modules/iot-environmental" element={<IoTEnvironmental />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Root App Component
const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen />}
      {!showSplash && <AppContent />}
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
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App; 