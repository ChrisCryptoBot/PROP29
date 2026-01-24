import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { useNotifications } from '../../contexts/NotificationsContext';
import { cn } from '../../utils/cn';

export const NotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = useMemo(() => {
    return [...notifications].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 5);
  }, [notifications]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 px-3 text-[10px] font-black uppercase tracking-widest border-white/5"
        aria-label="Open notifications"
      >
        <i className="fas fa-bell mr-2" aria-hidden="true" />
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 h-5 min-w-[20px] px-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
            {unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-3 w-[360px] bg-[color:var(--console-dark)]/90 border border-white/5 rounded-2xl shadow-2xl backdrop-blur-xl z-[60]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Notifications</p>
              <p className="text-xs text-[color:var(--text-sub)] mt-1 opacity-70">Recent activity and alerts</p>
            </div>
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border-white/5"
            >
              Mark all
            </Button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {recent.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors",
                  item.read ? 'opacity-70' : 'opacity-100'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">
                      {item.title}
                    </p>
                    <p className="text-[9px] text-[color:var(--text-sub)] mt-1">
                      {item.message}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-60">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                    >
                      Read
                    </button>
                  )}
                </div>
                {item.actionable && item.actionUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (item.actionUrl) {
                        navigate(item.actionUrl);
                      }
                    }}
                    className="mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                  >
                    {item.actionText || 'View'}
                  </button>
                )}
              </div>
            ))}
            {recent.length === 0 && (
              <div className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)] opacity-60">
                No notifications
              </div>
            )}
          </div>
          <div className="p-3 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-white/5"
            >
              View All
            </Button>
            <Button
              variant="glass"
              onClick={() => setOpen(false)}
              className="h-8 px-4 text-[9px] font-black uppercase tracking-widest"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
