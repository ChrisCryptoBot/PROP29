/**
 * Guest Safety - Messages Tab
 * Displays and manages guest messages
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import type { GuestMessage, GuestMessageType } from '../../types/guest-safety.types';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const MessagesTab: React.FC = () => {
  const {
    messages,
    unreadMessageCount,
    loading,
    markMessageRead,
    refreshMessages,
    incidents,
  } = useGuestSafetyContext();
  const { lastRefreshedAt } = useGlobalRefresh();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'emergency'>('all');
  const [selectedMessage, setSelectedMessage] = useState<GuestMessage | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshMessages();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Refresh failed. Showing last known state.');
    }
  }, [refreshMessages]);

  useEffect(() => {
    const refresh = () => {
      refreshMessages()
        .then(() => {
          setLastRefreshAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          setRefreshError('Auto-refresh failed. Showing last known state.');
        });
    };
    refresh();
    const intervalId = window.setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshMessages]);

  const filteredMessages = useMemo(() => {
    let filtered = messages;
    
    if (activeFilter === 'unread') {
      filtered = filtered.filter(msg => !msg.is_read);
    } else if (activeFilter === 'emergency') {
      filtered = filtered.filter(msg => msg.message_type === 'emergency');
    }
    
    return filtered.sort((a, b) => {
      // Sort by unread first, then by date
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [messages, activeFilter]);

  const handleMarkAsRead = async (message: GuestMessage) => {
    if (message.is_read) return;
    try {
      await markMessageRead(message.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getMessageTypeBadge = (type: GuestMessageType) => {
    switch (type) {
      case 'emergency':
        return {
          label: 'Emergency',
          className: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
      case 'request':
        return {
          label: 'Request',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'question':
        return {
          label: 'Question',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          label: 'Update',
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const getRelatedIncident = (message: GuestMessage) => {
    if (!message.incident_id) return null;
    return incidents.find(inc => inc.id === message.incident_id);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (loading.messages && messages.length === 0 && !selectedMessage) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Messages</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Guest communications and requests
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefreshedAt && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-10 px-3 rounded-full border flex items-center text-[9px] font-black uppercase tracking-widest",
                isStale
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
              aria-label={isStale ? 'Live data stale' : 'Live data synced'}
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
              aria-label="Refresh messages"
              disabled={loading.messages}
            >
              <i className={cn("fas fa-rotate-right mr-2", loading.messages && "animate-spin")} aria-hidden="true" />
              Refresh
            </Button>
          </div>
          {unreadMessageCount > 0 && (
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded">
              <span className="text-[9px] text-red-300 font-black uppercase tracking-widest">
                {unreadMessageCount} Unread
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('all')}
          size="sm"
          className={cn(
            "font-black uppercase tracking-widest text-[10px] px-6",
            activeFilter === 'all' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
          )}
        >
          All Messages
        </Button>
        <Button
          variant={activeFilter === 'unread' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('unread')}
          size="sm"
          className={cn(
            "font-black uppercase tracking-widest text-[10px] px-6",
            activeFilter === 'unread' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
          )}
        >
          Unread ({unreadMessageCount})
        </Button>
        <Button
          variant={activeFilter === 'emergency' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('emergency')}
          size="sm"
          className={cn(
            "font-black uppercase tracking-widest text-[10px] px-6",
            activeFilter === 'emergency' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
          )}
        >
          Emergency
        </Button>
      </div>

      {/* Messages List */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-2xl" aria-hidden="true">
              <i className="fas fa-envelope text-white text-lg" />
            </div>
            Guest Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="space-y-4">
            {filteredMessages.map((message) => {
              const typeBadge = getMessageTypeBadge(message.message_type);
              const relatedIncident = getRelatedIncident(message);
              const isUnread = !message.is_read;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "bg-slate-900/50 backdrop-blur-xl border rounded-xl p-6 transition-all cursor-pointer group",
                    isUnread ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 hover:bg-slate-900/70",
                    selectedMessage?.id === message.id && "ring-2 ring-blue-500/50"
                  )}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (isUnread) {
                      handleMarkAsRead(message);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">
                          {message.guest_name || 'Guest'}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        <span className={cn("px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest border", typeBadge.className)}>
                          {typeBadge.label}
                        </span>
                        {message.direction === 'staff_to_guest' && (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest text-slate-400 bg-white/5 border border-white/5">
                            Outgoing
                          </span>
                        )}
                      </div>
                      {message.room_number && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                          Room {message.room_number}
                        </p>
                      )}
                      {relatedIncident && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Could navigate to incident or show in modal
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <i className="fas fa-link mr-1" />
                          Related Incident: {relatedIncident.title}
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        {formatTime(message.created_at)}
                      </p>
                      {message.is_read && message.read_at && (
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                          Read {formatTime(message.read_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/5 mb-4">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {message.message_text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {message.source === 'GUEST_APP' && (
                        <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20">
                          <i className="fas fa-mobile-alt mr-1" />
                          Guest App
                        </span>
                      )}
                      {message.source === 'MOBILE_AGENT' && (
                        <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20">
                          <i className="fas fa-user-shield mr-1" />
                          Mobile Agent
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(message);
                        }}
                        className="font-black uppercase tracking-widest text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/5"
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMessages.length === 0 && (
              <EmptyState
                icon="fas fa-envelope-open"
                title={activeFilter === 'unread' ? "No unread messages" : activeFilter === 'emergency' ? "No emergency messages" : "No messages"}
                description={
                  activeFilter === 'unread'
                    ? "All messages have been read"
                    : activeFilter === 'emergency'
                    ? "No emergency messages at this time"
                    : "Guest messages will appear here when guests send communications"
                }
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
