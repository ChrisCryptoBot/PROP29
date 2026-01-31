import React, { Suspense } from 'react';
import { BannedIndividualsProvider, useBannedIndividualsContext } from './context/BannedIndividualsContext';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ManagementTab } from './components/tabs/ManagementTab';
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
        { id: 'detections', label: 'Detections', icon: 'fa-history' },
        { id: 'ai-analytics', label: 'Risk Analysis', icon: 'fa-chart-line' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-bar' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'management': return <ManagementTab />;
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
                <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="destructive"
                    size="icon"
                    className="w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform"
                    title="Add Banned Individual"
                    aria-label="Add Banned Individual"
                >
                    <i className="fas fa-user-plus text-xl" />
                </Button>
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


