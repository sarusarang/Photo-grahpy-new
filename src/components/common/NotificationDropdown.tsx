import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '@/service/notifications';
import type { StudioNotification, NotificationType } from '@/service/notifications/type';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  HardDrive,
  Crown,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

type FilterCategory = 'all' | 'unread' | 'inquiry' | 'gallery_event' | 'billing';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Backend API query — strictly from database with zero local dummy generation
  const {
    data: notifData,
    isLoading,
    isError,
    refetch,
  } = useNotifications({
    is_read: activeFilter === 'unread' ? false : undefined,
  });

  const { mutate: markAsRead, isPending: isMarkingRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllNotificationsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: clearAllNotifications, isPending: isClearingAll } = useClearAllNotifications();

  const allNotifications = notifData?.results || [];
  const unreadCount = notifData?.unread_count ?? 0;

  // Inform parent Header of live unread count
  useEffect(() => {
    if (onUnreadCountChange && typeof unreadCount === 'number') {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Click outside & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items according to active tab
  const filteredItems = allNotifications.filter((n) => {
    const isItemRead = Boolean(n.is_read || n.isRead);
    if (activeFilter === 'unread') return !isItemRead;
    if (activeFilter === 'inquiry') return n.type === 'inquiry';
    if (activeFilter === 'gallery_event') return n.type === 'gallery' || n.type === 'event';
    if (activeFilter === 'billing') return n.type === 'plan' || n.type === 'storage';
    return true;
  });

  const handleActionClick = (item: StudioNotification) => {
    const isItemRead = Boolean(item.is_read || item.isRead);
    if (!isItemRead) {
      markAsRead(item.id);
    }
    const targetUrl = item.action_url || item.actionUrl;
    if (targetUrl) {
      onClose();
      navigate(targetUrl);
    }
  };

  const getCategoryIcon = (type: NotificationType) => {
    switch (type) {
      case 'inquiry':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'gallery':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <ImageIcon className="w-4 h-4" />
          </div>
        );
      case 'event':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'storage':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <HardDrive className="w-4 h-4" />
          </div>
        );
      case 'plan':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
            <Crown className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="region"
      aria-label="Studio Notifications"
      className="absolute right-0 top-full mt-2 w-[360px] sm:w-[420px] rounded-3xl bg-white/95 dark:bg-[#111218]/95 border border-neutral-200 dark:border-neutral-800/90 shadow-2xl shadow-neutral-900/15 backdrop-blur-xl z-50 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* ─── Header ─── */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  Studio Notifications
                </h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-bold font-mono text-[10px] shadow-xs">
                    {unreadCount} NEW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono text-[10px]">
                    0 UNREAD
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Real-time inquiries, gallery activities & billing
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllRead}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {allNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllNotifications()}
                disabled={isClearingAll}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Category Tabs ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
            { id: 'inquiry', label: 'Inquiries' },
            { id: 'gallery_event', label: 'Galleries' },
            { id: 'billing', label: 'Plan & Quotas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterCategory)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Body List / Fallback Skeletons / Empty State ─── */}
      <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1.5 divide-y divide-neutral-100 dark:divide-neutral-800/40">
        {/* Loading Fallback */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/60 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="w-1/3 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error Fallback */
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Unable to load notifications
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Could not connect to the backend notifications API.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Sync</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State Fallback */
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-neutral-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
              <BellOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                All Caught Up
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                {activeFilter === 'unread'
                  ? 'You have zero unread notifications.'
                  : 'No notifications in this category. Client inquiries and gallery milestones will appear here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          /* Notification Cards List */
          filteredItems.map((item) => {
            const isRead = Boolean(item.is_read || item.isRead);
            const actionUrl = item.action_url || item.actionUrl;
            const actionLabel = item.action_label || item.actionLabel || 'View Details';
            const message = item.message || item.description || '';
            const timeAgo = item.time_ago || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent');

            return (
              <div
                key={item.id}
                className={`group relative p-3.5 rounded-2xl transition-all duration-200 flex items-start gap-3 ${
                  !isRead
                    ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.06]'
                    : 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/50 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Type Icon */}
                {getCategoryIcon(item.type)}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs font-bold truncate ${
                        !isRead
                          ? 'text-neutral-900 dark:text-white font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {item.title}
                    </h4>

                    {/* Time Ago */}
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {message}
                  </p>

                  {/* Action Link & Footer Controls */}
                  <div className="flex items-center justify-between pt-1">
                    {actionUrl ? (
                      <button
                        type="button"
                        onClick={() => handleActionClick(item)}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors group/btn"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                      </button>
                    ) : (
                      <div />
                    )}

                    {/* Card Actions (Mark as Read / Delete) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          disabled={isMarkingRead}
                          className="p-1 rounded-md text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(item.id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unread Accent Dot */}
                {!isRead && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shadow-xs shrink-0 self-center"
                    title="Unread notification"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="font-mono">
          {allNotifications.length} Total • {unreadCount} Unread
        </span>
        <Link
          to="/dashboard/settings"
          onClick={onClose}
          className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
        >
          Notification Settings →
        </Link>
      </div>
    </div>
  );
};
