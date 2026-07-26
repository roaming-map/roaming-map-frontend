import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export interface NotificationActor {
  id: number;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface NotificationItem {
  id: number;
  type: string;
  questionId: number;
  answerId: number | null;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  question: {
    id: number;
    title: string | null;
    question: string;
  } | null;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
};

async function fetchNotifications(): Promise<NotificationsResponse> {
  const response = await fetch('/api/notifications?limit=30');
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

export function useNotifications() {
  const { isSignedIn, isLoaded } = useAuth();

  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: fetchNotifications,
    enabled: isLoaded && !!isSignedIn,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData<NotificationsResponse>(notificationKeys.list());

      if (previous) {
        const wasUnread = previous.items.some((item) => item.id === id && item.readAt == null);
        queryClient.setQueryData<NotificationsResponse>(notificationKeys.list(), {
          ...previous,
          unreadCount: wasUnread ? Math.max(0, previous.unreadCount - 1) : previous.unreadCount,
          items: previous.items.map((item) =>
            item.id === id && item.readAt == null
              ? { ...item, readAt: new Date().toISOString() }
              : item
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData<NotificationsResponse>(notificationKeys.list());

      if (previous) {
        const now = new Date().toISOString();
        queryClient.setQueryData<NotificationsResponse>(notificationKeys.list(), {
          unreadCount: 0,
          items: previous.items.map((item) =>
            item.readAt == null ? { ...item, readAt: now } : item
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
