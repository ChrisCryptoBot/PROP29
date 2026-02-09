/**
 * Banned Individuals Tab
 * Integrated into Visitor Security module
 * Wraps the Banned Individuals module content
 */

import React, { Suspense } from 'react';
import { BannedIndividualsProvider, useBannedIndividualsContext } from '../../../banned-individuals/context/BannedIndividualsContext';
import { OverviewTab } from '../../../banned-individuals/components/tabs/OverviewTab';
import { ManagementTab } from '../../../banned-individuals/components/tabs/ManagementTab';
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
  ];

  const renderSubtab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'management': return <ManagementTab />;
      case 'settings':
      case 'detections':
      case 'analytics':
      case 'ai-analytics': return <OverviewTab />; /* removed tabs; show Overview if stale */
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex space-x-1 bg-slate-900/50 rounded-md p-1 border border-white/5">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white border border-red-500/30'
                  : 'text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          className="font-black uppercase tracking-widest px-6"
        >
          <i className="fas fa-plus mr-2" />
          Add Individual
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={
        <div className="h-96 flex items-center justify-center" role="status" aria-label="Loading banned individuals">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
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
