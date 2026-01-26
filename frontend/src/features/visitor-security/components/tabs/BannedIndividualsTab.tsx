/**
 * Banned Individuals Tab
 * Integrated into Visitor Security module
 * Wraps the Banned Individuals module content
 */

import React, { Suspense } from 'react';
import { BannedIndividualsProvider, useBannedIndividualsContext } from '../../../banned-individuals/context/BannedIndividualsContext';
import { OverviewTab } from '../../../banned-individuals/components/tabs/OverviewTab';
import { ManagementTab } from '../../../banned-individuals/components/tabs/ManagementTab';
import { FacialRecognitionTab } from '../../../banned-individuals/components/tabs/FacialRecognitionTab';
import { DetectionsTab } from '../../../banned-individuals/components/tabs/DetectionsTab';
import { AIAnalyticsTab } from '../../../banned-individuals/components/tabs/AIAnalyticsTab';
import { AnalyticsTab } from '../../../banned-individuals/components/tabs/AnalyticsTab';
import { SettingsTab } from '../../../banned-individuals/components/tabs/SettingsTab';
import { CreateIndividualModal } from '../../../banned-individuals/components/modals/CreateIndividualModal';
import { DetailsModal } from '../../../banned-individuals/components/modals/DetailsModal';
import { BulkImportModal } from '../../../banned-individuals/components/modals/BulkImportModal';
import { AdvancedFiltersModal } from '../../../banned-individuals/components/modals/AdvancedFiltersModal';
import { PhotoUploadModal } from '../../../banned-individuals/components/modals/PhotoUploadModal';
import { VideoFootageModal } from '../../../banned-individuals/components/modals/VideoFootageModal';
import { Button } from '../../../../components/UI/Button';

const BannedIndividualsTabContent: React.FC = () => {
  const { activeTab, setActiveTab, setShowCreateModal } = useBannedIndividualsContext();

  const subtabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'management', label: 'Records' },
    { id: 'facial-recognition', label: 'Biometrics' },
    { id: 'detections', label: 'Detections' },
    { id: 'ai-analytics', label: 'Risk Analysis' },
    { id: 'analytics', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderSubtab = () => {
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
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1 border border-white/5">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="destructive"
          className="font-black uppercase tracking-widest px-6 shadow-lg"
        >
          <i className="fas fa-plus mr-2" />
          Add Individual
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/5 border-t-red-600 rounded-full animate-spin" />
        </div>
      }>
        {renderSubtab()}
      </Suspense>

      {/* Modals */}
      <CreateIndividualModal />
      <DetailsModal />
      <BulkImportModal />
      <AdvancedFiltersModal />
      <PhotoUploadModal />
      <VideoFootageModal />
    </div>
  );
};

export const BannedIndividualsTab: React.FC = () => {
  return (
    <BannedIndividualsProvider>
      <BannedIndividualsTabContent />
    </BannedIndividualsProvider>
  );
};
