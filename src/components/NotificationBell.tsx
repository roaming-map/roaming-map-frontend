'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationItem,
} from '@/hooks/api/notifications';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function actorInitial(notification: NotificationItem): string {
  const actor = notification.actor;
  const name = actor?.name || actor?.firstName || 'U';
  return name.charAt(0).toUpperCase();
}

function NotificationList({
  items,
  isLoading,
  onSelect,
}: {
  items: NotificationItem[];
  isLoading: boolean;
  onSelect: (notification: NotificationItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-2.5 animate-pulse">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-700">No notifications yet</p>
        <p className="mt-1 text-xs text-gray-500">
          You&apos;ll see replies to your questions here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-50">
      {items.map((notification) => {
        const unread = notification.readAt == null;
        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => onSelect(notification)}
              className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 ${
                unread ? 'bg-[#046cb8]/[0.04]' : 'bg-white'
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  unread ? 'bg-[#046cb8]' : 'bg-gray-400'
                }`}
              >
                {actorInitial(notification)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm leading-snug ${
                      unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'
                    }`}
                  >
                    {notification.title}
                  </span>
                  {unread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#046cb8]" aria-hidden />
                  )}
                </span>
                {notification.body && (
                  <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">
                    {notification.body}
                  </span>
                )}
                <span className="mt-1 block text-[11px] text-gray-400">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      // Desktop dropdown only — mobile is a full-screen portal
      if (window.matchMedia('(max-width: 639px)').matches) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    if (window.matchMedia('(max-width: 639px)').matches) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleOpenNotification = (notification: NotificationItem) => {
    if (notification.readAt == null) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    router.push(`/questions/${notification.questionId}`);
  };

  const mobilePanel =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-white sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <h2 className="pl-1 text-lg font-semibold text-gray-900">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="px-2 py-1.5 text-xs font-medium text-[#046cb8]"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <NotificationList
                items={items}
                isLoading={isLoading}
                onSelect={handleOpenNotification}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-200/70 hover:text-gray-900"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mobilePanel}

      {/* Desktop: anchored dropdown */}
      {open && (
        <div className="absolute right-0 z-[60] mt-2 hidden w-[22rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:block">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-[#046cb8] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            <NotificationList
              items={items}
              isLoading={isLoading}
              onSelect={handleOpenNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
}
