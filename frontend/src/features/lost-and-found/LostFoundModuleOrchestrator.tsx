/**
 * Lost & Found Module Orchestrator
 * Main orchestrator component following Gold Standard pattern
 * Handles layout, tab navigation, and modal management
 * 
 * Gold Standard Checklist:
 * ✅ Uses ModuleShell for consistent branding
 * ✅ High-contrast "Security Console" theme
 * ✅ Professional technical terminology
 * ✅ Accessibility (a11y)
 */

import React, { useState, useEffect } from 'react';
import { LostFoundProvider, useLostFoundContext } from './context/LostFoundContext';
import {
    OverviewTab,
    StorageTab,
    AnalyticsTab,
    SettingsTab
} from './components/tabs';
import {
    ItemDetailsModal,
    RegisterItemModal,
    ReportModal
} from './components/modals';
import { Button } from '../../components/UI/Button';
import ModuleShell from '../../components/Layout/ModuleShell';

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'storage', label: 'Storage Management' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'settings', label: 'Settings' }
];

const LostFoundContent: React.FC<{
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    showRegisterModal: boolean;
    setShowRegisterModal: (show: boolean) => void;
    showDetailsModal: boolean;
    setShowDetailsModal: (show: boolean) => void;
    showReportModal: boolean;
    setShowReportModal: (show: boolean) => void;
}> = ({
    currentTab,
    setCurrentTab,
    showRegisterModal,
    setShowRegisterModal,
    showDetailsModal,
    setShowDetailsModal,
    showReportModal,
    setShowReportModal
}) => {
        const {
            selectedItem,
            setSelectedItem
        } = useLostFoundContext();

        useEffect(() => {
            if (selectedItem && !showDetailsModal) {
                setShowDetailsModal(true);
            }
        }, [selectedItem, showDetailsModal, setShowDetailsModal]);

        const handleCloseDetails = () => {
            setShowDetailsModal(false);
            setSelectedItem(null);
        };

        return (
            <ModuleShell
                icon={<i className="fas fa-search" />}
                title="Lost & Found"
                subtitle="Comprehensive lost item management and guest recovery system"
                tabs={tabs}
                activeTab={currentTab}
                onTabChange={setCurrentTab}
                actions={
                    <Button
                        onClick={() => setShowRegisterModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                        aria-label="Register New Item"
                    >
                        <i className="fas fa-plus mr-2" />
                        New Item
                    </Button>
                }
            >
                {currentTab === 'overview' && <OverviewTab />}
                {currentTab === 'storage' && <StorageTab />}
                {currentTab === 'analytics' && <AnalyticsTab />}
                {currentTab === 'settings' && <SettingsTab />}

                {/* Modals */}
                <ItemDetailsModal
                    isOpen={showDetailsModal}
                    onClose={handleCloseDetails}
                />

                <RegisterItemModal
                    isOpen={showRegisterModal}
                    onClose={() => setShowRegisterModal(false)}
                />

                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                />
            </ModuleShell>
        );
    };

export const LostFoundModuleOrchestrator: React.FC = () => {
    const [currentTab, setCurrentTab] = useState('overview');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    return (
        <LostFoundProvider
            modalControls={{
                setShowRegisterModal,
                setShowEditModal: () => { }, // Not used in Lost & Found
                setShowDetailsModal,
                setShowReportModal
            }}
        >
            <LostFoundContent
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                showRegisterModal={showRegisterModal}
                setShowRegisterModal={setShowRegisterModal}
                showDetailsModal={showDetailsModal}
                setShowDetailsModal={setShowDetailsModal}
                showReportModal={showReportModal}
                setShowReportModal={setShowReportModal}
            />
        </LostFoundProvider>
    );
};

export default LostFoundModuleOrchestrator;
