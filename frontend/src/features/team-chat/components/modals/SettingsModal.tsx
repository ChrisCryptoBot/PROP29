import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { showSuccess } from '../../../../utils/toast';

export const SettingsModal: React.FC = () => {
    const {
        showSettings,
        setShowSettings,
        handleToggleSettings,
    } = useTeamChatContext();

    if (!showSettings) return null;

    return (
        <Modal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            title="Quick Settings"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button
                        variant="subtle"
                        onClick={() => setShowSettings(false)}
                        className="text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            showSuccess('Settings saved to system');
                            setShowSettings(false);
                            handleToggleSettings();
                        }}
                        className="font-black uppercase tracking-widest text-[10px] px-6 shadow-none"
                    >
                        Save Changes
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.2em] italic ml-1">
                    Quick Configuration v2.0
                </p>

                {/* Notifications Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center border border-blue-500/20">
                            <i className="fas fa-bell text-blue-400 text-xs" />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Alert Protocols
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Desktop Notifications"
                                description="Show browser notifications for new messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Audio Feedback"
                                description="Play sounds for incoming messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Priority Override Sound"
                                description="Distinct alert for priority messages"
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center border border-blue-500/20">
                            <i className="fas fa-shield-alt text-blue-400 text-xs" />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Security & Privacy
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 opacity-70">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="End-to-End Encryption"
                                description="Enterprise Managed - AES-256"
                                disabled
                            />
                            <p className="text-[9px] text-blue-400 mt-2 font-bold uppercase tracking-widest">
                                <i className="fas fa-lock mr-1" />
                                Enforced by organization policy
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Broadcast Online Status"
                                description="Show your availability to team members"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={false}
                                onChange={() => {}}
                                label="Location Sharing"
                                description="Share location data with messages"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center border border-blue-500/20">
                            <i className="fas fa-database text-blue-400 text-xs" />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Data Management
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-md">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Data Retention Period
                            </label>
                            <select className="w-full bg-black/40 border border-white/5 rounded-md py-2 px-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none">
                                <option value="never">Permanent (No Auto-Delete)</option>
                                <option value="24h">24 Hour Cycle</option>
                                <option value="7d">7 Day Retention</option>
                                <option value="30d">30 Day Archive</option>
                            </select>
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Typing Indicators"
                                description="Show when others are typing"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={true}
                                onChange={() => {}}
                                label="Read Receipts"
                                description="Let others know when you've read messages"
                            />
                        </div>
                    </div>
                </div>

                {/* Channel Management */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center border border-blue-500/20">
                            <i className="fas fa-hashtag text-blue-400 text-xs" />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Channel Actions
                        </h3>
                    </div>
                    <button
                        onClick={() => showSuccess('Channel creation coming soon...')}
                        className="w-full p-4 border border-dashed border-white/10 rounded-md text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors text-[10px] font-black uppercase tracking-widest bg-white/[0.02]"
                    >
                        <i className="fas fa-plus mr-2" />
                        Create New Channel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
