import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { showSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const SettingsModal: React.FC = () => {
    const {
        showSettings,
        setShowSettings,
        handleToggleSettings,
    } = useTeamChatContext();

    if (!showSettings) return null;

    const renderToggleRow = (label: string, isChecked: boolean = true, isDisabled: boolean = false, description?: string) => (
        <label className={cn(
            "flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer group",
            isDisabled ? "bg-black/20 border-white/5 opacity-50 cursor-not-allowed" : "bg-white/5 border-white/5 hover:bg-white/10"
        )}>
            <div className="flex-1">
                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{label}</span>
                {description && <span className="block text-[10px] text-white/30 uppercase tracking-widest font-bold mt-0.5">{description}</span>}
            </div>
            <div className="relative">
                <input type="checkbox" defaultChecked={isChecked} disabled={isDisabled} className="sr-only" />
                <div className={cn(
                    "w-10 h-5 rounded-full p-1 transition-all duration-300",
                    isChecked ? "bg-blue-600" : "bg-white/10"
                )}>
                    <div className={cn(
                        "w-3 h-3 bg-white rounded-full shadow-lg transition-transform duration-300",
                        isChecked ? "translate-x-5" : "translate-x-0"
                    )} />
                </div>
            </div>
        </label>
    );

    return (
        <Modal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            title="COMMUNICATION CONFIG"
            size="lg"
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-[0.2em] italic ml-1">SYSTEM CONFIGURATION PREFERENCES v2.0</p>

                {/* Notifications Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center space-x-2 ml-1">
                        <i className="fas fa-bell" />
                        <span>ALERT PROTOCOLS</span>
                    </h3>
                    <div className="space-y-1.5">
                        {renderToggleRow('Desktop Notifications')}
                        {renderToggleRow('Audio Feedback')}
                        {renderToggleRow('Priority Override Sound')}
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center space-x-2 ml-1">
                        <i className="fas fa-shield-alt" />
                        <span>SECURITY & PRIVACY</span>
                    </h3>
                    <div className="space-y-1.5">
                        {renderToggleRow('End-to-End Encryption', true, true, 'Enterprise Managed • AES-256')}
                        {renderToggleRow('Broadcast Online Status')}
                        {renderToggleRow('Transmit Geospatial Data')}
                    </div>
                </div>

                {/* Message Settings */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center space-x-2 ml-1">
                        <i className="fas fa-comments" />
                        <span>DATA MANAGEMENT</span>
                    </h3>
                    <div className="space-y-1.5">
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">DATA PURGE INTERVAL</label>
                            <select className="w-full bg-black/40 border-white/5 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
                                <option value="never">DISABLED (PERMANENT LOG)</option>
                                <option value="24h">24 HOUR CYCLE</option>
                                <option value="7d">7 DAY RETENTION</option>
                                <option value="30d">30 DAY ARCHIVE</option>
                            </select>
                        </div>
                        {renderToggleRow('Typing Indicators')}
                        {renderToggleRow('Data Receipt Acknowledgment')}
                    </div>
                </div>

                {/* Channel Management */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center space-x-2 ml-1">
                        <i className="fas fa-hashtag" />
                        <span>SYSTEM CHANNELS</span>
                    </h3>
                    <div className="space-y-1.5">
                        <button
                            onClick={() => showSuccess('Channel creation coming soon...')}
                            className="w-full p-4 border border-dashed border-white/5 rounded-xl text-white/30 hover:border-blue-500/50 hover:text-blue-500 transition-all text-[10px] font-black uppercase tracking-widest bg-white/[0.02]"
                        >
                            <i className="fas fa-plus mr-2" />
                            Create New Channel
                        </button>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
                    <Button
                        variant="outline"
                        onClick={() => setShowSettings(false)}
                        className="font-black uppercase tracking-widest text-[10px] border-white/5 text-white/40 hover:text-white hover:bg-white/5"
                    >
                        CANCEL
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            showSuccess('Settings saved to system');
                            handleToggleSettings();
                        }}
                        className="font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-blue-500/20"
                    >
                        SAVE CHANGES
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

