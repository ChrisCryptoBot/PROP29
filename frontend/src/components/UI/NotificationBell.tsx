/**
 * Always-visible notification bell with unread count and dropdown.
 * Shows in Layout header so the user doesn't need to open the profile menu.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { cn } from '../../utils/cn';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const recent = useMemo(
    () => [...notifications].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 5),
    [notifications]
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-10 h-10 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <i className="fas fa-bell text-lg" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-red-500 text-white border-2 border-[color:var(--console-dark)]"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-[340px] rounded-md border border-white/10 bg-[color:var(--console-dark)] shadow-lg z-[80]"
          role="menu"
          aria-label="Recent notifications"
        >
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</span>
            <span className="text-[10px] font-black text-white">{unreadCount} unread</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                No notifications
              </div>
            ) : (
              recent.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
                    item.read ? 'opacity-70' : 'opacity-100'
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">{item.title}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="w-full py-2 rounded text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
