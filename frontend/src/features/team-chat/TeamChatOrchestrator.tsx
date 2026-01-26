import React from 'react';
import { TeamChatProvider, useTeamChatContext } from './context/TeamChatContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/ChatArea/ChatArea';
import { NewMessageModal } from './components/modals/NewMessageModal';
import { SettingsModal } from './components/modals/SettingsModal';
import ModuleShell from '../../components/Layout/ModuleShell';
import { Button } from '../../components/UI/Button';

const TeamChatContent: React.FC = () => {
    const { setShowNewMessage, setShowSettings } = useTeamChatContext();

    return (
        <ModuleShell
            icon={<i className="fas fa-comments" />}
            title="Team Chat"
            subtitle="Secure real-time communication platform for emergency responders"
            actions={
                <div className="flex space-x-3">
                    <Button
                        onClick={() => setShowSettings(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/5 font-black uppercase tracking-widest text-[10px]"
                        aria-label="Chat Settings"
                    >
                        <i className="fas fa-cog mr-2" />
                        Settings
                    </Button>
                    <Button
                        onClick={() => setShowNewMessage(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-black uppercase tracking-widest text-[10px]"
                        aria-label="New Message"
                    >
                        <i className="fas fa-plus mr-2" />
                        New Message
                    </Button>
                </div>
            }
        >
            <div className="h-[75vh] flex overflow-hidden glass-card rounded-2xl border border-white/5 relative">
                <Sidebar />
                <ChatArea />
            </div>

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
