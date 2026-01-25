import React, { Suspense } from 'react';
import { BannedIndividualsProvider, useBannedIndividualsContext } from './context/BannedIndividualsContext';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ManagementTab } from './components/tabs/ManagementTab';
import { FacialRecognitionTab } from './components/tabs/FacialRecognitionTab';
import { DetectionsTab } from './components/tabs/DetectionsTab';
import { AIAnalyticsTab } from './components/tabs/AIAnalyticsTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';

import { CreateIndividualModal } from './components/modals/CreateIndividualModal';
import { DetailsModal } from './components/modals/DetailsModal';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { AdvancedFiltersModal } from './components/modals/AdvancedFiltersModal';
import { PhotoUploadModal } from './components/modals/PhotoUploadModal';
import { VideoFootageModal } from './components/modals/VideoFootageModal';

import { cn } from '../../utils/cn';
import ModuleShell from '../../components/Layout/ModuleShell';
import { Button } from '../../components/UI/Button';

const OrchestratorContent: React.FC = () => {
    const { activeTab, setActiveTab, setShowCreateModal } = useBannedIndividualsContext();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fa-shield-alt' },
        { id: 'management', label: 'Records', icon: 'fa-users-cog' },
        { id: 'facial-recognition', label: 'Biometrics', icon: 'fa-eye' },
        { id: 'detections', label: 'Detections', icon: 'fa-history' },
        { id: 'ai-analytics', label: 'Risk Analysis', icon: 'fa-brain' },
        { id: 'analytics', label: 'Reports', icon: 'fa-chart-bar' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'management': return <ManagementTab />;
            case 'facial-recognition': return <FacialRecognitionTab />;
            case 'detections': return <DetectionsTab />;
            case 'ai-analytics': return <AIAnalyticsTab />;
            case 'analytics': return <AnalyticsTab />;
            case 'settings': return <SettingsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-user-slash" />}
            title="Banned Individuals"
            subtitle="Identity verification and threat management"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
                <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="destructive"
                    className="font-black uppercase tracking-widest px-8 shadow-lg"
                >
                    <i className="fas fa-plus mr-2" />
                    Add Individual
                </Button>
            }
        >
            <Suspense fallback={
                <div className="h-96 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white/5 border-t-red-600 rounded-full animate-spin" />
                </div>
            }>
                {renderTab()}
            </Suspense>

            {/* Modals */}
            <CreateIndividualModal />
            <DetailsModal />
            <BulkImportModal />
            <AdvancedFiltersModal />
            <PhotoUploadModal />
            <VideoFootageModal />

            {/* Quick Action FAB - Gold Standard */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all group"
                    title="Add Banned Individual"
                    aria-label="Add Banned Individual"
                >
                    <i className="fas fa-user-plus text-xl group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </ModuleShell >
    );
};

export const BannedIndividualsOrchestrator: React.FC = () => {
    return (
        <BannedIndividualsProvider>
            <OrchestratorContent />
        </BannedIndividualsProvider>
    );
};


