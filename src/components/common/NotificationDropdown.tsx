import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { getInquiries } from '../../services/inquiryService';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  HardDrive,
  Crown,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export type NotificationType = 'plan' | 'inquiry' | 'event' | 'storage';

export interface StudioNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  actionLabel?: string;
  priority?: 'high' | 'normal' | 'info';
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const STORAGE_KEY = 'photo_saas_notifications_v1';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const planQuota = usePlanQuota();
  const { upcomingEvents, activeLiveEvents } = useEvent();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState<'all' | 'unread' | 'inquiry' | 'event' | 'storage'>('all');

  // Generate initial context-aware notifications
  const defaultNotifications = useMemo<StudioNotification[]>(() => {
    const items: StudioNotification[] = [];

    // 1. Inquiries Notifications
    const inquiries = getInquiries();
    const newInquiries = inquiries.filter((i) => i.status === 'new');
    if (newInquiries.length > 0) {
      newInquiries.slice(0, 2).forEach((inq) => {
        items.push({
          id: `inq-${inq.id}`,
          type: 'inquiry',
          title: `New Inquiry: ${inq.clientName}`,
          description: `${inq.eventType || 'Wedding'} inquiry for ${inq.eventDate || 'Upcoming Date'}${
            inq.budget ? ` • Budget: ${inq.budget}` : ''
          }. Awaiting response.`,
          timestamp: '15m ago',
          isRead: false,
          link: '/dashboard/inquiries',
          actionLabel: 'Review Inquiry',
          priority: 'high',
        });
      });
    } else {
      items.push({
        id: 'inq-default',
        type: 'inquiry',
        title: 'Client Inquiries Active',
        description: 'Lead generation forms connected to your editorial portfolio. New couples can contact you instantly.',
        timestamp: '1h ago',
        isRead: false,
        link: '/dashboard/inquiries',
        actionLabel: 'View Inquiries',
        priority: 'normal',
      });
    }

    // 2. Upcoming / Live Events
    if (activeLiveEvents.length > 0) {
      const live = activeLiveEvents[0];
      items.push({
        id: `ev-live-${live.id}`,
        type: 'event',
        title: `Live Tethering: ${live.title}`,
        description: `Shooting active at ${live.venue}. ${live.stats.qrScans} guest QR scans & ${live.media.length} live camera photos synced.`,
        timestamp: 'Active Now',
        isRead: false,
        link: `/dashboard/events/${live.id}`,
        actionLabel: 'Command Center',
        priority: 'high',
      });
    } else if (upcomingEvents.length > 0) {
      const up = upcomingEvents[0];
      items.push({
        id: `ev-up-${up.id}`,
        type: 'event',
        title: `Upcoming Event: ${up.title}`,
        description: `Scheduled for ${up.eventDate} at ${up.venue}. Guest table stand QR cards are generated and ready to print.`,
        timestamp: 'In 2 days',
        isRead: false,
        link: `/dashboard/events/${up.id}`,
        actionLabel: 'Print QR Stand',
        priority: 'normal',
      });
    }

    // 3. Storage Health & Vault Notice
    const storageUsed = planQuota.storageUsedGB;
    const storageTotal = planQuota.storageLimitGB;
    const pctUsed = planQuota.storageUsedPercent;
    const spaceLeft = Math.max(0, storageTotal - storageUsed).toFixed(1);

    if (pctUsed > 80) {
      items.push({
        id: 'storage-warning',
        type: 'storage',
        title: 'Storage Vault Nearing Limit',
        description: `${storageUsed} GB of ${storageTotal} GB used (${pctUsed}%). Upgrade your plan to prevent RAW upload pauses.`,
        timestamp: 'Today',
        isRead: false,
        link: '/dashboard/settings',
        actionLabel: 'Upgrade Storage',
        priority: 'high',
      });
    } else {
      items.push({
        id: 'storage-health',
        type: 'storage',
        title: 'Cloud Vault Healthy',
        description: `${storageUsed} GB of ${storageTotal} GB used (${pctUsed}%). ${spaceLeft} GB high-speed cloud space remaining for RAW uploads.`,
        timestamp: '3h ago',
        isRead: false,
        link: '/dashboard/gallery',
        actionLabel: 'View Galleries',
        priority: 'info',
      });
    }

    // 4. Plan Expiry & Subscription
    const planName = planQuota.planName;
    const daysLeft = planQuota.daysRemaining;
    const expiresDate = planQuota.expiryDate ? planQuota.expiryDate.split('T')[0] : 'Upcoming';

    items.push({
      id: 'plan-status',
      type: 'plan',
      title: `${planName} Plan Active`,
      description: `Subscription active with ${daysLeft} days remaining. Next billing renewal on ${expiresDate}.`,
      timestamp: '1d ago',
      isRead: false,
      link: '/dashboard/settings',
      actionLabel: 'Manage Plan',
      priority: 'info',
    });

    return items;
  }, [planQuota, upcomingEvents, activeLiveEvents]);

  // Persistent read/dismissed state
  const [notifications, setNotifications] = useState<StudioNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return defaultNotifications;
  });

  // Sync when defaultNotifications change if fresh
  useEffect(() => {
    setNotifications((prev) => {
      // Preserve existing isRead status if item exists
      return defaultNotifications.map((d) => {
        const found = prev.find((p) => p.id === d.id);
        return found ? { ...d, isRead: found.isRead } : d;
      });
    });
  }, [defaultNotifications]);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    const unread = notifications.filter((n) => !n.isRead).length;
    if (onUnreadCountChange) onUnreadCountChange(unread);
  }, [notifications, onUnreadCountChange]);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'inquiry') return n.type === 'inquiry';
    if (filter === 'event') return n.type === 'event';
    if (filter === 'storage') return n.type === 'storage' || n.type === 'plan';
    return true;
  });

  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationType, priority?: string) => {
    switch (type) {
      case 'inquiry':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'event':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 shadow-xs">
            {priority === 'high' ? <Zap className="w-4 h-4 text-emerald-500" /> : <Calendar className="w-4 h-4" />}
          </div>
        );
      case 'storage':
        return (
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 shadow-xs">
            <HardDrive className="w-4 h-4" />
          </div>
        );
      case 'plan':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Crown className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2.5 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 shadow-2xl shadow-neutral-950/20 dark:shadow-black/70 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none transition-colors"
    >
      {/* ─── Top Header Banner ─── */}
      <div className="relative p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-br from-neutral-50 to-white dark:from-[#151720] dark:to-[#101117] overflow-hidden">
        {/* Decorative Gold Glow Vector */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-neutral-950 shadow-xs">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                Real-time alerts, leads & storage
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                title="Mark all as read"
                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Read All</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                title="Clear all notifications"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'inquiry', label: 'Inquiries' },
              { id: 'event', label: 'Events' },
              { id: 'storage', label: 'Storage & Plan' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                  : 'bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Notifications List ─── */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
              All Caught Up!
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[240px] mx-auto">
              No notifications matching this filter. New bookings and alerts will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`relative p-4 transition-all duration-200 group flex items-start gap-3 ${
                item.isRead
                  ? 'bg-white dark:bg-[#121319] hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50'
                  : 'bg-amber-500/[0.04] dark:bg-amber-400/[0.03] hover:bg-amber-500/[0.07] dark:hover:bg-amber-400/[0.06]'
              }`}
            >
              {/* Unread Accent Dot */}
              {!item.isRead && (
                <span className="absolute left-2 top-5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}

              {/* Type Icon */}
              {getTypeIcon(item.type, item.priority)}

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-semibold truncate ${
                      item.isRead
                        ? 'text-neutral-800 dark:text-neutral-200'
                        : 'text-neutral-900 dark:text-white font-bold'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Bottom Action & Dismiss */}
                <div className="flex items-center justify-between pt-1.5 gap-2">
                  {item.link ? (
                    <Link
                      to={item.link}
                      onClick={() => {
                        markAsRead(item.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <span>{item.actionLabel || 'View Details'}</span>
                      <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                    </Link>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                      className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/90 dark:bg-[#101117]/90 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
        <span>EX SHARE Studio Intel</span>
        <Link
          to="/dashboard/settings"
          onClick={onClose}
          className="hover:text-amber-500 transition-colors flex items-center gap-1"
        >
          <span>Preferences</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
