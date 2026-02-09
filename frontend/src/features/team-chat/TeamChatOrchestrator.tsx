import React, { useState } from 'react';
import { TeamChatProvider, useTeamChatContext } from './context/TeamChatContext';
import { ChatTab } from './components/tabs/ChatTab';
import { ChannelsTab } from './components/tabs/ChannelsTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { NewMessageModal } from './components/modals/NewMessageModal';
import { SettingsModal } from './components/modals/SettingsModal';
import ModuleShell from '../../components/Layout/ModuleShell';
import { Button } from '../../components/UI/Button';

type TabId = 'chat' | 'channels' | 'analytics' | 'settings';

interface Tab {
    id: TabId;
    label: string;
}

const TeamChatContent: React.FC = () => {
    const { setShowNewMessage } = useTeamChatContext();
    const [activeTab, setActiveTab] = useState<TabId>('chat');

    const tabs: Tab[] = [
        { id: 'chat', label: 'Messages' },
        { id: 'channels', label: 'Channels' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'settings', label: 'Settings' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'chat':
                return <ChatTab />;
            case 'channels':
                return <ChannelsTab />;
            case 'analytics':
                return <AnalyticsTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return <ChatTab />;
        }
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-comments" />}
            title="Team Chat"
            subtitle="Secure real-time communication platform for security personnel"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as TabId)}
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        onClick={() => setShowNewMessage(true)}
                        className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-none"
                        aria-label="New Message"
                    >
                        <i className="fas fa-plus mr-2" aria-hidden />
                        New Message
                    </Button>
                </div>
            }
        >
            {renderTabContent()}

            {/* Global Modals */}
            <NewMessageModal />
            <SettingsModal />
        </ModuleShell>
    );
};

export const TeamChatOrchestrator: React.FC = () => {
    return (
        <TeamChatProvider>
            <TeamChatContent />
        </TeamChatProvider>
    );
};

export default TeamChatOrchestrator;
