import React from 'react';
import { useTeamChatContext } from '../../context/TeamChatContext';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';

const getMessageTypeIcon = (type: string) => {
    switch (type) {
        case 'alert': return { icon: 'fa-exclamation-triangle', color: 'text-red-400' };
        case 'response': return { icon: 'fa-broadcast-tower', color: 'text-blue-400' };
        case 'resolution': return { icon: 'fa-check-circle', color: 'text-emerald-400' };
        case 'checkpoint': return { icon: 'fa-map-marker-alt', color: 'text-purple-400' };
        case 'system': return { icon: 'fa-cog', color: 'text-slate-500' };
        case 'file': return { icon: 'fa-file-alt', color: 'text-blue-400' };
        case 'quick-action': return { icon: 'fa-bolt', color: 'text-amber-400' };
        default: return null;
    }
};

export const ChatArea: React.FC = () => {
    const {
        currentChannel,
        filteredMessages,
        searchTerm,
        currentChannelMessages,
        teamMembers,
        formatTimestamp,
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

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'priority': return 'fa-exclamation-triangle';
            case 'location': return 'fa-map-marker-alt';
            case 'archive': return 'fa-broadcast-tower';
            case 'notifications': return 'fa-circle';
            default: return 'fa-comments';
        }
    };

    const getChannelTypeColor = (type: string) => {
        switch (type) {
            case 'priority': return 'text-red-400';
            case 'location': return 'text-blue-400';
            case 'archive': return 'text-purple-400';
            case 'notifications': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    };

    const quickActions = [
        { id: 'emergency', label: 'Emergency Alert', iconClass: 'fas fa-exclamation-triangle', variant: 'emergency' as const },
        { id: 'backup', label: 'Request Backup', iconClass: 'fas fa-broadcast-tower', variant: 'default' as const },
        { id: 'medical', label: 'Medical Assist', iconClass: 'fas fa-phone', variant: 'default' as const },
        { id: 'patrol', label: 'Patrol Check-in', iconClass: 'fas fa-map-marker-alt', variant: 'default' as const }
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[color:var(--surface-card)]">
            {/* Chat Header */}
            <div className="bg-white/5 border-b border-white/5 p-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 group">
                        <div className="card-title-icon-box">
                            <i className={cn(
                                "fas",
                                getChannelIcon(currentChannel?.type || 'default'),
                                getChannelTypeColor(currentChannel?.type || 'default')
                            )} />
                        </div>
                        <div>
                            <h2 className="card-title-text">{currentChannel?.name}</h2>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>{currentChannel?.members} Personnel</span>
                                {currentChannel?.encrypted && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                        <i className="fas fa-shield-alt text-[10px]" />
                                        <span>Encrypted</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-emerald-400">Live</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                                className="text-slate-500 hover:text-white hover:bg-white/5"
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
                    <EmptyState
                        icon="fas fa-search"
                        title="No Matching Data"
                        description={`Database query for "${searchTerm}" returned zero results in the current channel.`}
                    />
                ) : currentChannelMessages.length === 0 ? (
                    <EmptyState
                        icon="fas fa-comments"
                        title="No Active Records"
                        description="Communication channel started. Awaiting first message from field personnel."
                    />
                ) : (
                    filteredMessages.map(msg => {
                        const typeInfo = getMessageTypeIcon(msg.type);
                        const sender = teamMembers.find(m => m.id === msg.sender);

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-start gap-3",
                                    msg.sender === 'current-user' ? 'flex-row-reverse' : ''
                                )}
                            >
                                {/* Avatar */}
                                <div className="shrink-0 w-8 h-8 rounded-md border border-white/5 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/60 overflow-hidden uppercase">
                                    {msg.sender === 'current-user' ? 'CU' :
                                        msg.sender === 'system' ? 'SYS' :
                                            sender?.name.split(' ').map(n => n[0]).join('') || '?'}
                                </div>

                                <div className={cn(
                                    "flex flex-col max-w-[75%]",
                                    msg.sender === 'current-user' ? 'items-end' : 'items-start'
                                )}>
                                    {/* Message Bubble */}
                                    <div className={cn(
                                        "p-3 rounded-md text-sm transition-colors border-l-4",
                                        msg.sender === 'current-user'
                                            ? "bg-blue-600/10 text-white border-l-blue-500 border border-blue-500/20 rounded-tr-none"
                                            : "bg-white/5 text-white/90 border-l-slate-600 border border-white/5 rounded-tl-none",
                                        msg.type === 'system' && "bg-transparent border-none text-slate-500 italic text-xs py-1 px-0 border-l-0"
                                    )}>
                                        {msg.sender !== 'current-user' && msg.type !== 'system' && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-90">
                                                    {msg.sender === 'system' ? 'SYSTEM' :
                                                        sender?.name || 'UNKNOWN OPERATIVE'}
                                                </span>
                                                {typeInfo && (
                                                    <i className={cn("fas", typeInfo.icon, typeInfo.color, "text-sm")} />
                                                )}
                                                {msg.encrypted && (
                                                    <i className="fas fa-shield-alt text-[8px] text-blue-500/60" />
                                                )}
                                            </div>
                                        )}

                                        <p className={cn("leading-relaxed", msg.type === 'system' && "text-slate-500")}>
                                            {msg.content}
                                        </p>

                                        {msg.location && (
                                            <div className={cn(
                                                "mt-2 p-2 rounded-md border flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                                                msg.sender === 'current-user'
                                                    ? "bg-blue-600/20 border-blue-500/30"
                                                    : "bg-black/20 border-white/5"
                                            )}>
                                                <i className="fas fa-map-marker-alt text-red-400" />
                                                <span>Vector: {formatLocationDisplay(msg.location) || '-'}</span>
                                            </div>
                                        )}

                                        {msg.file && (
                                            <div className={cn(
                                                "mt-2 p-2 rounded-md border flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider",
                                                msg.sender === 'current-user'
                                                    ? "bg-blue-600/20 border-blue-500/30"
                                                    : "bg-black/20 border-white/5"
                                            )}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <i className="fas fa-file-alt text-blue-400" />
                                                    <span className="truncate">{msg.file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleFileDownload(msg.file)}
                                                    className="text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <i className="fas fa-download" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-2 mt-1.5 px-1">
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                {msg.reactions.map((r, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/60"
                                                    >
                                                        {r.emoji} {r.count}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5 shrink-0">
                {/* Quick Actions */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => sendQuickAction(action as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-black uppercase tracking-widest text-[9px] border shrink-0",
                                action.variant === 'emergency'
                                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-100 border-red-500/50"
                                    : "bg-white/5 hover:bg-white/10 text-white/60 border-white/5"
                            )}
                        >
                            <i className={cn(action.iconClass, "text-xs")} />
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Input */}
                <div className="flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex-1 flex items-center bg-white/5 border border-white/5 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleFileUpload}
                            className="text-slate-500 hover:text-blue-400"
                        >
                            <i className="fas fa-paperclip" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCameraCapture}
                            className="text-slate-500 hover:text-blue-400"
                        >
                            <i className="fas fa-camera" />
                        </Button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder={selectedFile ? `Secure Attachment: ${selectedFile.name}` : "Enter message..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 text-sm py-2 font-medium tracking-tight"
                        />
                        <button
                            onClick={() => setIsRecording(!isRecording)}
                            className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                                isRecording ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-red-400'
                            )}
                        >
                            {isRecording ? <i className="fas fa-microphone-slash" /> : <i className="fas fa-microphone" />}
                        </button>
                    </div>
                    <Button
                        variant="primary"
                        onClick={sendMessage}
                        disabled={!message.trim() && !selectedFile}
                        className="rounded-md px-5 h-[48px] font-black uppercase tracking-widest text-xs shadow-none"
                    >
                        <i className="fas fa-paper-plane" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
