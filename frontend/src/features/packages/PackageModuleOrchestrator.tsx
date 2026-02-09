/**
 * Package Module Orchestrator
 * Main orchestrator component for Package module
 * Manages tabs, modals, and provides context
 * 
 * Gold Standard Checklist:
 * ✅ Uses ModuleShell for consistent branding
 * ✅ High-contrast "Security Console" theme
 * ✅ Professional technical terminology
 * ✅ Accessibility (a11y)
 */

import React, { useState, useEffect } from 'react';
import { PackageProvider, usePackageContext } from './context/PackageContext';
import { OverviewTab, OperationsTab, AnalyticsTab, SettingsTab } from './components/tabs';
import {
    RegisterPackageModal,
    ScanPackageModal,
    PackageDetailsModal
} from './components/modals';
import { Button } from '../../components/UI/Button';
import ModuleShell from '../../components/Layout/ModuleShell';

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
];

const PackageModuleContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const { selectedPackage, setSelectedPackage } = usePackageContext();

    // Auto-open details modal when package is selected
    useEffect(() => {
        if (selectedPackage && !showDetailsModal) {
            setShowDetailsModal(true);
        }
    }, [selectedPackage, showDetailsModal]);

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setSelectedPackage(null);
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-box" />}
            title="Packages"
            subtitle="Comprehensive package tracking and delivery management system"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
                <div className="flex space-x-3">
                    <Button
                        onClick={() => setShowScanModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                        aria-label="Scan Package"
                    >
                        <i className="fas fa-qrcode mr-2" />
                        Scan
                    </Button>
                    <Button
                        onClick={() => setShowRegisterModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        aria-label="Register New Package"
                    >
                        <i className="fas fa-plus mr-2" />
                        New Package
                    </Button>
                </div>
            }
        >
            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'operations' && <OperationsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab />}

            {/* Modals */}
            <RegisterPackageModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
            />

            <ScanPackageModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
            />

            <PackageDetailsModal
                isOpen={showDetailsModal}
                onClose={handleCloseDetails}
            />

            {/* Quick Action FABs - Gold Standard: solid blue, circular */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4">
                <Button
                    onClick={() => setShowScanModal(true)}
                    variant="primary"
                    size="icon"
                    className="w-14 h-14 rounded-full border-0"
                    title="Scan Package"
                    aria-label="Scan Package"
                >
                    <i className="fas fa-qrcode text-xl" />
                </Button>
                <Button
                    onClick={() => setShowRegisterModal(true)}
                    variant="primary"
                    size="icon"
                    className="w-14 h-14 rounded-full border-0"
                    title="Register New Package"
                    aria-label="Register New Package"
                >
                    <i className="fas fa-plus text-xl" />
                </Button>
            </div>
        </ModuleShell>
    );
};

export const PackageModuleOrchestrator: React.FC = () => {
    return (
        <PackageProvider>
            <PackageModuleContent />
        </PackageProvider>
    );
};

export default PackageModuleOrchestrator;
