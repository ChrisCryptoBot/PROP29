/**
 * Notifications page — Gold Standard.
 * Single page, accessible only from profile dropdown. Uses NotificationsContext.
 * Layout: page title, metrics bar, filters, one Card with list of notifications.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { EmptyState } from '../../components/UI/EmptyState';
import { useNotifications } from '../../contexts/NotificationsContext';
import type { NotificationCategory, NotificationItem } from '../../contexts/NotificationsContext';
import { cn } from '../../utils/cn';

const CATEGORIES: { id: NotificationCategory | 'all' | 'unread'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'incident', label: 'Incident' },
  { id: 'system', label: 'System' },
  { id: 'security', label: 'Security' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'team', label: 'Team' },
  { id: 'guest', label: 'Guest' },
];

function getPriorityBadge(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-white/10 text-slate-400 border-white/10',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[priority] || 'bg-white/10 text-slate-400 border-white/10';
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [filter, setFilter] = useState<NotificationCategory | 'all' | 'unread'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  return (
    <div className="max-w-[1800px] w-full px-6 py-8 text-left" role="main" aria-label="Notifications">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Alerts and updates — only accessible from profile menu
          </p>
        </div>
      </div>

      {/* Metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 border-b border-white/5 text-sm mb-6">
        <span className="text-slate-400 font-medium">
          Unread <strong className="text-white ml-1">{unreadCount}</strong>
        </span>
        <span className="text-slate-400 font-medium">
          Total <strong className="text-white ml-1">{notifications.length}</strong>
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors',
              filter === id
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-bell text-white" aria-hidden />
              </div>
              <span className="card-title-text">Alerts & Updates</span>
            </span>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="text-[10px] font-black uppercase tracking-widest border-white/10"
              >
                <i className="fas fa-check-double mr-2" aria-hidden />
                Mark all read
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon="fas fa-bell-slash"
              title="No notifications"
              description={
                filter === 'unread'
                  ? "You're all caught up. No unread alerts."
                  : filter !== 'all'
                    ? `No ${filter} notifications.`
                    : "You don't have any notifications yet."
              }
              action={
                filter !== 'all'
                  ? { label: 'Show all', onClick: () => setFilter('all') }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((item: NotificationItem) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    item.read ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/[0.04]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={cn(
                            'font-black text-sm uppercase tracking-widest',
                            item.read ? 'text-[color:var(--text-sub)]' : 'text-white'
                          )}
                        >
                          {item.title}
                          {!item.read && (
                            <span className="ml-2 w-1.5 h-1.5 bg-blue-400 rounded-full inline-block align-middle" />
                          )}
                        </h4>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border',
                            getPriorityBadge(item.priority)
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-[color:var(--text-sub)] mb-2">{item.message}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <span>{item.sender.name}</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <span className="text-slate-600">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {item.actionable && item.actionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[9px] font-black uppercase tracking-widest border-white/10"
                            onClick={() => {
                              markAsRead(item.id);
                              navigate(item.actionUrl!);
                            }}
                          >
                            <i className="fas fa-external-link-alt mr-1" aria-hidden />
                            {item.actionText || 'View'}
                          </Button>
                        )}
                        {!item.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                            onClick={() => markAsRead(item.id)}
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[9px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400"
                          onClick={() => removeNotification(item.id)}
                          aria-label={`Remove ${item.title}`}
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </Button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
