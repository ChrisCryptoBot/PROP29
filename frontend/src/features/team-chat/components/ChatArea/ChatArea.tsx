import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';

export const ChatArea: React.FC = () => {
    const {
        activeChannel,
        currentChannel,
        filteredMessages,
        searchTerm,
        currentChannelMessages,
        teamMembers,
        formatTimestamp,
        getPriorityColor,
        handleFileDownload,
        messagesEndRef,
        sendQuickAction,
        fileInputRef,
        handleFileSelect,
        handleFileUpload,
        handleCameraCapture,
        message,
        setMessage,
        isRecording,
        setIsRecording,
        sendMessage,
        selectedFile,
        handlePhoneCall,
        handleVideoCall,
        handleToggleSettings,
        handleMoreOptions
    } = useTeamChatContext();

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <i className="fas fa-exclamation-triangle text-red-500 text-sm" />;
            case 'response': return <i className="fas fa-broadcast-tower text-blue-500 text-sm" />;
            case 'resolution': return <i className="fas fa-check-circle text-green-500 text-sm" />;
            case 'checkpoint': return <i className="fas fa-map-marker-alt text-purple-500 text-sm" />;
            case 'system': return <i className="fas fa-cog text-white/20 text-sm" />;
            case 'file': return <i className="fas fa-file-alt text-blue-500 text-sm" />;
            case 'quick-action': return <i className="fas fa-bolt text-orange-500 text-sm" />;
            default: return null;
        }
    };

    const quickActions = [
        { id: 'emergency', label: 'Emergency Alert', iconClass: 'fas fa-exclamation-triangle' },
        { id: 'backup', label: 'Request Backup', iconClass: 'fas fa-broadcast-tower' },
        { id: 'medical', label: 'Medical Assist', iconClass: 'fas fa-phone' },
        { id: 'patrol', label: 'Patrol Check-in', iconClass: 'fas fa-map-marker-alt' }
    ];

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'priority': return <i className="fas fa-exclamation-triangle text-red-500" />;
            case 'location': return <i className="fas fa-map-marker-alt text-blue-500" />;
            case 'archive': return <i className="fas fa-broadcast-tower text-purple-500" />;
            case 'notifications': return <i className="fas fa-circle text-yellow-500" />;
            default: return <i className="fas fa-comments text-blue-500" />;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-black/20">
            {/* Chat Header */}
            <div className="bg-white/5 border-b border-white/5 p-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 group">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:scale-110 transition-transform duration-300">
                            {getChannelIcon(currentChannel?.type || 'default')}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">{currentChannel?.name}</h2>
                            <div className="flex items-center space-x-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                <span>{currentChannel?.members} PERSONNEL</span>
                                {currentChannel?.encrypted && (
                                    <span className="flex items-center space-x-1 text-blue-500">
                                        <i className="fas fa-shield-alt text-[10px]" />
                                        <span>ENCRYPTED</span>
                                    </span>
                                )}
                                <span className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span>LIVE</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {[
                            { icon: 'fa-phone', onClick: handlePhoneCall, title: 'Voice Link' },
                            { icon: 'fa-video', onClick: handleVideoCall, title: 'Video Link' },
                            { icon: 'fa-cog', onClick: handleToggleSettings, title: 'Config' },
                            { icon: 'fa-ellipsis-v', onClick: handleMoreOptions, title: 'More' }
                        ].map((btn, idx) => (
                            <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                onClick={btn.onClick}
                                title={btn.title}
                                className="text-white/40 hover:text-white hover:bg-white/5"
                            >
                                <i className={cn("fas", btn.icon)} />
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredMessages.length === 0 && searchTerm.trim() !== '' ? (
                    <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/5 mx-4">
                        <i className="fas fa-search text-white/10 text-5xl mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Matching Data</h3>
                        <p className="text-sm text-white/40 max-w-xs mx-auto">Database query for "{searchTerm}" returned zero results in the current sector.</p>
                    </div>
                ) : currentChannelMessages.length === 0 ? (
                    <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/5 mx-4">
                        <i className="fas fa-comments text-white/10 text-5xl mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Active Records</h3>
                        <p className="text-sm text-white/40 max-w-xs mx-auto">Communication channel started. Awaiting first message from field personnel.</p>
                    </div>
                ) : (
                    filteredMessages.map(msg => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start space-x-3",
                                msg.sender === 'current-user' ? 'flex-row-reverse space-x-reverse' : ''
                            )}
                        >
                            {/* Avatar */}
                            <div className="shrink-0 w-8 h-8 rounded border border-white/5 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/60 overflow-hidden uppercase">
                                {msg.sender === 'current-user' ? 'CU' :
                                    msg.sender === 'system' ? 'SYS' :
                                        teamMembers.find(m => m.id === msg.sender)?.name.split(' ').map(n => n[0]).join('') || '?'}
                            </div>

                            <div className={cn(
                                "flex flex-col max-w-[75%]",
                                msg.sender === 'current-user' ? 'items-end' : 'items-start'
                            )}>
                                {/* Message Bubble */}
                                <div className={cn(
                                    "p-3 rounded-xl text-sm shadow-lg backdrop-blur-md transition-all border-l-4",
                                    msg.sender === 'current-user'
                                        ? "bg-blue-600/20 text-white border-l-blue-600 border-t border-r border-b border-blue-500/30 rounded-tr-none"
                                        : "bg-white/5 text-white/90 border-l-white/20 border-t border-r border-b border-white/5 rounded-tl-none",
                                    msg.type === 'system' && "bg-transparent border-none text-white/40 italic text-xs py-1 px-0"
                                )}>
                                    {msg.sender !== 'current-user' && msg.type !== 'system' && (
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-90">
                                                {msg.sender === 'system' ? 'SYSTEM' :
                                                    teamMembers.find(m => m.id === msg.sender)?.name || 'UNKNOWN OPERATIVE'}
                                            </span>
                                            {getMessageTypeIcon(msg.type)}
                                            {msg.encrypted && <i className="fas fa-shield-alt text-[8px] text-blue-500/60" />}
                                        </div>
                                    )}

                                    <p className={cn("leading-relaxed", msg.type === 'system' && "text-white/30")}>{msg.content}</p>

                                    {msg.location && (
                                        <div className={cn(
                                            "mt-2 p-2 rounded border flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider",
                                            msg.sender === 'current-user' ? "bg-blue-600/30 border-blue-500/50" : "bg-black/20 border-white/5"
                                        )}>
                                            <i className="fas fa-map-marker-alt text-red-500" />
                                            <span>VECTOR: {msg.location.area}</span>
                                        </div>
                                    )}

                                    {msg.file && (
                                        <div className={cn(
                                            "mt-2 p-2 rounded border flex items-center justify-between space-x-3 text-[10px] font-bold uppercase tracking-wider",
                                            msg.sender === 'current-user' ? "bg-blue-600/30 border-blue-500/50" : "bg-black/20 border-white/5"
                                        )}>
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <i className="fas fa-file-alt text-blue-500" />
                                                <span className="truncate">{msg.file.name}</span>
                                            </div>
                                            <button onClick={() => handleFileDownload(msg.file)} className="text-white/40 hover:text-white transition-colors">
                                                <i className="fas fa-download" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center space-x-2 mt-1.5 px-1">
                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatTimestamp(msg.timestamp)}</span>
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            {msg.reactions.map((r, i) => (
                                                <span key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/60">
                                                    {r.emoji} {r.count}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5 shrink-0">
                {/* Quick Actions */}
                <div className="flex items-center space-x-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => sendQuickAction(action as any)}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded transition-all shadow-lg font-black uppercase tracking-widest text-[9px] border",
                                action.id === 'emergency'
                                    ? "bg-red-600/20 hover:bg-red-600 text-red-100 border-red-500/50 shadow-red-500/10"
                                    : "bg-white/5 hover:bg-white/10 text-white/60 border-white/5"
                            )}
                        >
                            <i className={cn(action.iconClass, "text-xs")} />
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Input */}
                <div className="flex items-center space-x-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex-1 flex items-center bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all">
                        <Button variant="ghost" size="sm" onClick={handleFileUpload} className="text-white/40 hover:text-blue-500">
                            <i className="fas fa-paperclip" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCameraCapture} className="text-white/40 hover:text-blue-500">
                            <i className="fas fa-camera" />
                        </Button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder={selectedFile ? `SECURE ATTACHMENT: ${selectedFile.name}` : "ENTER MESSAGE..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 text-sm py-2 font-medium tracking-tight"
                        />
                        <button
                            onClick={() => setIsRecording(!isRecording)}
                            className={cn(
                                "w-8 h-8 rounded flex items-center justify-center transition-all",
                                isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-white/40 hover:text-red-500'
                            )}
                        >
                            {isRecording ? <i className="fas fa-microphone-slash" /> : <i className="fas fa-microphone" />}
                        </button>
                    </div>
                    <Button
                        variant="primary"
                        onClick={sendMessage}
                        disabled={!message.trim() && !selectedFile}
                        className="rounded-xl px-5 h-[48px] shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-xs"
                    >
                        <i className="fas fa-paper-plane" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

