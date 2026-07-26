import { NextResponse } from 'next/server';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/db';
import { notifications } from '@/db/schema';
import {
  CurrentUserAuthError,
  CurrentUserSyncError,
  getOrCreateCurrentUser,
  handleCurrentUserError,
} from '@/lib/server/current-user';
import { handleDatabaseError } from '@/utils/validation-helpers';

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '30', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 30;
  return Math.min(parsed, 50);
}

// GET /api/notifications - List current user's notifications + unread count
export async function GET(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const whereClause = unreadOnly
      ? and(eq(notifications.userId, user.id), isNull(notifications.readAt))
      : eq(notifications.userId, user.id);

    const [items, unreadRow] = await Promise.all([
      db.query.notifications.findMany({
        where: whereClause,
        with: {
          actor: {
            columns: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
          question: {
            columns: {
              id: true,
              title: true,
              question: true,
            },
          },
        },
        orderBy: [desc(notifications.createdAt), desc(notifications.id)],
        limit,
      }),
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        questionId: item.questionId,
        answerId: item.answerId,
        title: item.title,
        body: item.body,
        readAt: item.readAt,
        createdAt: item.createdAt,
        actor: item.actor ?? null,
        question: item.question
          ? {
              id: item.question.id,
              title: item.question.title,
              question: item.question.question,
            }
          : null,
      })),
      unreadCount: Number(unreadRow[0]?.value ?? 0),
    });
  } catch (error) {
    if (error instanceof CurrentUserAuthError || error instanceof CurrentUserSyncError) {
      return handleCurrentUserError(error);
    }
    return handleDatabaseError(error, 'fetch notifications');
  }
}

// POST /api/notifications - Mark all as read (body: { action: 'read_all' })
export async function POST(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await req.json().catch(() => ({}));

    if (body?.action !== 'read_all') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

    return NextResponse.json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error) {
    if (error instanceof CurrentUserAuthError || error instanceof CurrentUserSyncError) {
      return handleCurrentUserError(error);
    }
    return handleDatabaseError(error, 'mark all notifications read');
  }
}
