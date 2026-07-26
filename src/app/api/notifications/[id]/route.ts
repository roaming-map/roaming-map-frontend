import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/db';
import { notifications } from '@/db/schema';
import {
  CurrentUserAuthError,
  CurrentUserSyncError,
  getOrCreateCurrentUser,
  handleCurrentUserError,
} from '@/lib/server/current-user';
import { handleDatabaseError } from '@/utils/validation-helpers';

// PATCH /api/notifications/[id] - Mark a single notification as read
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { id: rawId } = await params;
    const id = Number.parseInt(rawId, 10);

    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const existing = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, id), eq(notifications.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (existing.readAt == null) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, user.id),
            isNull(notifications.readAt)
          )
        );
    }

    return NextResponse.json({ message: 'Notification marked as read', id });
  } catch (error) {
    if (error instanceof CurrentUserAuthError || error instanceof CurrentUserSyncError) {
      return handleCurrentUserError(error);
    }
    return handleDatabaseError(error, 'mark notification read');
  }
}
