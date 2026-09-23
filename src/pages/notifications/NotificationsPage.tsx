import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Megaphone,
  Calendar,
  MessageSquare,
  Check,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/types/database.types';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from '@/services/notificationsService';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';

type NotificationFilter = 'all' | 'mentions' | 'likes' | 'campus';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Realtime notification subscription
    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      toast.info(`New alert: ${newNotif.title}`);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    const list = await fetchUserNotifications(user.id);
    setNotifications(list);
    setIsLoading(false);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-indigo-600" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-emerald-600" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-amber-600" />;
      case 'event_reminder':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-indigo-600" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'mentions') return n.type === 'comment' || n.type === 'mention';
    if (activeFilter === 'likes') return n.type === 'like';
    if (activeFilter === 'campus')
      return (
        n.type === 'announcement' ||
        n.type === 'event_reminder' ||
        n.type === 'club_activity' ||
        n.type === 'system'
      );
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates on campus posts, mentions, peer follows, and college announcements.
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold h-9 self-start sm:self-auto"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none border-b border-slate-200/80 pb-2">
        {(
          [
            { id: 'all', label: 'All Alerts' },
            { id: 'mentions', label: 'Comments & Mentions' },
            { id: 'likes', label: 'Likes' },
            { id: 'campus', label: 'Campus Activity' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You have no notifications in this category. As students interact with your posts or follow you, updates will arrive in real time."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`flex items-start space-x-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                !item.read
                  ? 'bg-indigo-50/40 border-indigo-100/80 hover:bg-indigo-50/60'
                  : 'bg-white border-slate-200/70 hover:bg-slate-50'
              }`}
            >
              {/* Actor avatar or icon */}
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.actor?.profile_photo || ''} />
                  <AvatarFallback className="text-xs font-bold">
                    {item.actor?.full_name
                      ? item.actor.full_name.substring(0, 2).toUpperCase()
                      : 'CG'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs">
                  {getIconForType(item.type)}
                </div>
              </div>

              {/* Notification text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.read && (
                <div className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
