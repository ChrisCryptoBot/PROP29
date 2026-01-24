import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { EmergencyEvacuationProvider, useEmergencyEvacuationContext } from './context/EmergencyEvacuationContext';
import OverviewTab from './components/tabs/OverviewTab';
import ActiveTab from './components/tabs/ActiveTab';
import CommunicationTab from './components/tabs/CommunicationTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import PredictiveTab from './components/tabs/PredictiveTab';
import SettingsTab from './components/tabs/SettingsTab';
import AnnouncementModal from './components/modals/AnnouncementModal';
import RouteDetailsModal from './components/modals/RouteDetailsModal';
import SafetyCheckInModal from './components/modals/SafetyCheckInModal';
import ModuleShell from '../../components/Layout/ModuleShell';


const OrchestratorContent: React.FC = () => {
  const [showSafetyModal, setShowSafetyModal] = React.useState(false);
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    isAuthenticated,
    loading,
    error,
    setError,
    evacuationActive,
    metrics,
    showAnnouncementModal,
    showRouteModal,
    hasManagementAccess,
    handleStartEvacuation,
    handleEndEvacuation,
  } = useEmergencyEvacuationContext();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center border-b border-white/5 pb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <i className="fas fa-shield-alt text-2xl text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 text-center">
            <p className="text-white/60 text-sm font-medium">Please authenticate to access the emergency evacuation controls.</p>
            <Button 
              onClick={() => navigate('/modules/evacuation-auth')}
              className="w-full font-black uppercase tracking-widest text-xs py-4"
            >
              GENERATE ACCESS TOKEN
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ModuleShell
      icon={<i className="fas fa-exclamation-triangle" />}
      title="Emergency Evacuation"
      subtitle="Real-time evacuation management and emergency response coordination"
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'active', label: 'Active Evacuation' },
        { id: 'communication', label: 'Communication' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'predictive', label: 'Predictive Intel' },
        { id: 'settings', label: 'Settings' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        !evacuationActive ? (
          <Button onClick={handleStartEvacuation} disabled={loading || !hasManagementAccess}>
            <i className="fas fa-play mr-2" />
              Start Evacuation
            </Button>
          ) : (
          <div className="flex space-x-2">
            <Button onClick={() => setShowSafetyModal(true)} variant="outline" disabled={loading} className="border-green-500/30 text-green-400 hover:bg-green-500/10">
              <i className="fas fa-user-check mr-2" />
              Manual Safety Entry
            </Button>
            <Button onClick={handleEndEvacuation} disabled={loading || !hasManagementAccess} variant="outline">
              <i className="fas fa-stop-circle mr-2" />
              End Evacuation
          </Button>
        </div>
        )
      }
    >
      <div className="p-6">

      {/* Error Display */}
      {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-xl backdrop-blur-sm">
          <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-400 mr-3" />
              <span className="text-red-200 font-medium">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
                className="ml-auto text-red-200 hover:text-red-100"
            >
                <i className="fas fa-times" />
            </Button>
          </div>
        </div>
      )}

      {/* GOLD STANDARD METRICS GRID - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Evacuated */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-white/10 bg-black/20 backdrop-blur-xl">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-check-circle text-green-500 text-xl" />
              </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-green-500/10 text-green-500 border border-green-500/20">Safe</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter">{metrics.evacuated}</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Evacuated</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-white/10 bg-black/20 backdrop-blur-xl">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-sync-alt text-yellow-500 text-xl animate-spin-slow" />
              </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Active</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter">{metrics.inProgress}</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">In Progress</p>
            </div>
          </CardContent>
        </Card>

        {/* Remaining */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-red-500/20 bg-red-500/5 backdrop-blur-xl shadow-[0_0_20px_rgba(239,68,68,0.05)]">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-users text-red-500 text-xl" />
              </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-red-500/20 text-red-500 border border-red-500/30">Priority</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter">{metrics.remaining}</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Remaining</p>
            </div>
          </CardContent>
        </Card>

        {/* Staff Deployed */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-white/10 bg-black/20 backdrop-blur-xl">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-shield-alt text-blue-500 text-xl" />
              </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Deployed</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter">{metrics.staffDeployed}</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Staff Members</p>
            </div>
          </CardContent>
        </Card>

        {/* Elapsed Time */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-white/10 bg-black/20 backdrop-blur-xl">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-clock text-blue-500 text-xl" />
              </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Live</span>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter">{metrics.elapsedTime}</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Elapsed Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
        {activeTab === 'overview' && (
          <ErrorBoundary moduleName="EmergencyEvacuationOverviewTab">
            <OverviewTab />
          </ErrorBoundary>
        )}
      {activeTab === 'active' && (
          <ErrorBoundary moduleName="EmergencyEvacuationActiveTab">
            <ActiveTab />
          </ErrorBoundary>
        )}
      {activeTab === 'communication' && (
          <ErrorBoundary moduleName="EmergencyEvacuationCommunicationTab">
            <CommunicationTab />
          </ErrorBoundary>
        )}
      {activeTab === 'analytics' && (
          <ErrorBoundary moduleName="EmergencyEvacuationAnalyticsTab">
            <AnalyticsTab />
          </ErrorBoundary>
        )}
      {activeTab === 'predictive' && (
          <ErrorBoundary moduleName="EmergencyEvacuationPredictiveTab">
            <PredictiveTab />
          </ErrorBoundary>
        )}
      {activeTab === 'settings' && (
          <ErrorBoundary moduleName="EmergencyEvacuationSettingsTab">
            <SettingsTab />
          </ErrorBoundary>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <ErrorBoundary moduleName="EmergencyEvacuationAnnouncementModal">
          <AnnouncementModal />
        </ErrorBoundary>
      )}

      {/* Safety Check-In Modal */}
      {showSafetyModal && (
        <ErrorBoundary moduleName="SafetyCheckInModal">
          <SafetyCheckInModal
            onClose={() => setShowSafetyModal(false)}
            onSubmit={(data) => {
              console.log('Safety Verified:', data);
              setShowSafetyModal(false);
              // In a real app, this would call verifySafety(data)
            }}
          />
        </ErrorBoundary>
      )}

      {/* Route Details Modal */}
      {showRouteModal && (
        <ErrorBoundary moduleName="EmergencyEvacuationRouteModal">
          <RouteDetailsModal />
        </ErrorBoundary>
      )}

    </ModuleShell>
  );
};

const EmergencyEvacuationOrchestrator: React.FC = () => (
  <EmergencyEvacuationProvider>
    <OrchestratorContent />
  </EmergencyEvacuationProvider>
);

export default EmergencyEvacuationOrchestrator;





