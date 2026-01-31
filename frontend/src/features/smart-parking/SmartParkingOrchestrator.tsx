import React, { useState } from 'react';
import { SmartParkingProvider, useSmartParkingContext } from './context/SmartParkingContext';
import { SearchBar } from '../../components/UI/SearchBar';
import { OverviewTab } from './components/tabs/OverviewTab';
import { SpacesTab } from './components/tabs/SpacesTab';
import { GuestsTab } from './components/tabs/GuestsTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { AddSpaceModal } from './components/modals/AddSpaceModal';
import { RegisterGuestModal } from './components/modals/RegisterGuestModal';
import ModuleShell from '../../components/Layout/ModuleShell';

const SmartParkingOrchestratorContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showSpaceModal, setShowSpaceModal] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);

    const {
        availableSpaces,
        searchQuery,
        setSearchQuery,
        handleAddSpace,
        handleAddGuest
    } = useSmartParkingContext();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <OverviewTab />;
            case 'spaces':
                return <SpacesTab onAddSpace={() => setShowSpaceModal(true)} />;
            case 'guests':
                return <GuestsTab onRegisterGuest={() => setShowGuestModal(true)} />;
            case 'analytics':
                return <AnalyticsTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return null;
        }
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-parking" />}
            title="Smart Parking"
            subtitle="Space Utilization & Guest Registry"
            tabs={[
                { id: 'dashboard', label: 'Overview' },
                { id: 'spaces', label: 'Spaces' },
                { id: 'guests', label: 'Guests' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'settings', label: 'Settings' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
                <div className="flex items-center space-x-4">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search spaces or plates..."
                        className="w-64"
                    />
                </div>
            }
        >
            {renderTabContent()}

            {/* Modals */}
            <AddSpaceModal
                isOpen={showSpaceModal}
                onClose={() => setShowSpaceModal(false)}
                onSubmit={handleAddSpace}
            />

            <RegisterGuestModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onSubmit={handleAddGuest}
                availableSpaces={availableSpaces}
            />
        </ModuleShell>
    );
};

const SmartParkingOrchestrator: React.FC = () => (
    <SmartParkingProvider>
        <SmartParkingOrchestratorContent />
    </SmartParkingProvider>
);

export default SmartParkingOrchestrator;


