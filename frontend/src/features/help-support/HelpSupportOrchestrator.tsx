/**
 * Help & Support module orchestrator.
 * Gold standard: ModuleShell with icon, ErrorBoundary per tab, global modals, real workflows.
 */
import React, { useState, useCallback } from 'react';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { useHelpChat } from '../../contexts/HelpChatContext';
import { useHelpSupportState } from './hooks/useHelpSupportState';
import { OverviewTab, HelpCenterTab, SupportTicketsTab, ContactSupportTab, ResourcesTab } from './components/tabs';
import { NewTicketModal, TicketDetailModal, ArticleDetailModal } from './components/modals';
import { RESOURCE_URLS } from './constants/resourceUrls';
import { EMERGENCY_PHONE } from './constants/seedData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
  { id: 'help', label: 'Help Center', icon: 'fas fa-question-circle' },
  { id: 'tickets', label: 'Support Tickets', icon: 'fas fa-ticket-alt' },
  { id: 'contact', label: 'Contact Support', icon: 'fas fa-headset' },
  { id: 'resources', label: 'Resources', icon: 'fas fa-book' }
] as const;

export const HelpSupportOrchestrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { openChat } = useHelpChat();

  const {
    loading,
    error,
    success,
    helpArticles,
    supportTickets,
    contactInfo,
    newTicketForm,
    setNewTicketForm,
    showNewTicketModal,
    openNewTicketModal,
    closeNewTicketModal,
    createTicket,
    selectedTicket,
    showTicketDetailModal,
    openTicketDetail,
    closeTicketDetail,
    ticketEditMode,
    setTicketEditMode,
    updateTicket,
    selectedArticle,
    showArticleDetailModal,
    openArticleDetail,
    closeArticleDetail,
    articleHelpfulCount,
    markArticleHelpful,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredArticles,
    showSuccess
  } = useHelpSupportState();

  const openLiveChatOrShowComingSoon = useCallback(() => {
    if (RESOURCE_URLS.liveChatUrl) {
      window.open(RESOURCE_URLS.liveChatUrl, '_blank', 'noopener,noreferrer');
      showSuccess('Opening live chat.');
    } else {
      openChat();
    }
  }, [showSuccess, openChat]);

  const openContactTab = useCallback(() => setActiveTab('contact'), []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ErrorBoundary moduleName="HelpSupportOverviewTab">
            <OverviewTab
              helpArticlesCount={helpArticles.length}
              openTicketsCount={supportTickets.filter((t) => t.status !== 'closed').length}
              supportAgentsCount={contactInfo.length}
              recentTickets={supportTickets}
              setActiveTab={setActiveTab}
              openNewTicketModal={openNewTicketModal}
              openTicketDetail={openTicketDetail}
              openContactTab={openContactTab}
              openLiveChatOrShowComingSoon={openLiveChatOrShowComingSoon}
            />
          </ErrorBoundary>
        );
      case 'help':
        return (
          <ErrorBoundary moduleName="HelpSupportHelpCenterTab">
            <HelpCenterTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredArticles={filteredArticles}
              openArticleDetail={openArticleDetail}
            />
          </ErrorBoundary>
        );
      case 'tickets':
        return (
          <ErrorBoundary moduleName="HelpSupportSupportTicketsTab">
            <SupportTicketsTab
              tickets={supportTickets}
              openNewTicketModal={openNewTicketModal}
              openTicketDetail={openTicketDetail}
            />
          </ErrorBoundary>
        );
      case 'contact':
        return (
          <ErrorBoundary moduleName="HelpSupportContactTab">
            <ContactSupportTab contactInfo={contactInfo} emergencyPhone={EMERGENCY_PHONE} />
          </ErrorBoundary>
        );
      case 'resources':
        return (
          <ErrorBoundary moduleName="HelpSupportResourcesTab">
            <ResourcesTab />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary moduleName="HelpSupportOverviewTab">
            <OverviewTab
              helpArticlesCount={helpArticles.length}
              openTicketsCount={supportTickets.filter((t) => t.status !== 'closed').length}
              supportAgentsCount={contactInfo.length}
              recentTickets={supportTickets}
              setActiveTab={setActiveTab}
              openNewTicketModal={openNewTicketModal}
              openTicketDetail={openTicketDetail}
              openContactTab={openContactTab}
              openLiveChatOrShowComingSoon={openLiveChatOrShowComingSoon}
            />
          </ErrorBoundary>
        );
    }
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-question-circle text-2xl text-white" aria-hidden />}
      title="Help & Support"
      subtitle="Get help, submit tickets, and access resources"
      tabs={TABS.map((tab) => ({
        id: tab.id,
        label: (
          <span className="flex items-center gap-2">
            <i className={tab.icon} aria-hidden />
            <span>{tab.label}</span>
          </span>
        )
      }))}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-exclamation-triangle mr-2" aria-hidden />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <i className="fas fa-check-circle mr-2" aria-hidden />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-slate-500" aria-hidden />
          </div>
        ) : (
          renderTabContent()
        )}

        <NewTicketModal
          isOpen={showNewTicketModal}
          onClose={closeNewTicketModal}
          form={newTicketForm}
          setForm={setNewTicketForm}
          onSubmit={createTicket}
        />

        <TicketDetailModal
          isOpen={showTicketDetailModal}
          onClose={closeTicketDetail}
          ticket={selectedTicket}
          isEditMode={ticketEditMode}
          setEditMode={setTicketEditMode}
          onUpdate={updateTicket}
        />

        <ArticleDetailModal
          isOpen={showArticleDetailModal}
          onClose={closeArticleDetail}
          article={selectedArticle}
          helpfulCountDelta={selectedArticle ? (articleHelpfulCount[selectedArticle.id] ?? 0) : 0}
          onMarkHelpful={markArticleHelpful}
        />
      </div>
    </ModuleShell>
  );
};

export default HelpSupportOrchestrator;
