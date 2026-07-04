import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/db';
import { users } from '@/db/schema';

export type CurrentDbUser = typeof users.$inferSelect;

export class CurrentUserAuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'CurrentUserAuthError';
  }
}

export class CurrentUserSyncError extends Error {
  constructor(message = 'Failed to sync current user') {
    super(message);
    this.name = 'CurrentUserSyncError';
  }
}

async function findUserByClerkId(clerkId: string): Promise<CurrentDbUser | undefined> {
  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
}

function buildDisplayName({
  firstName,
  lastName,
  username,
  email,
}: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
}): string | null {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (username) return username;
  if (email) return email.split('@')[0] || email;
  return null;
}

function shouldRefreshExistingUser(user: CurrentDbUser): boolean {
  return user.name === 'Demo User';
}

export async function getOrCreateCurrentUser(): Promise<CurrentDbUser> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new CurrentUserAuthError();
  }

  const existingUser = await findUserByClerkId(clerkId);

  if (existingUser && !shouldRefreshExistingUser(existingUser)) {
    return existingUser;
  }

  const clerkUser = await currentUser();

  if (!clerkUser || clerkUser.id !== clerkId) {
    throw new CurrentUserSyncError('Unable to fetch authenticated Clerk user');
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
  );
  const email = primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const firstName = clerkUser.firstName ?? null;
  const lastName = clerkUser.lastName ?? null;
  const name = buildDisplayName({
    firstName,
    lastName,
    username: clerkUser.username ?? null,
    email,
  });

  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        firstName,
        lastName,
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkId))
      .returning();

    if (updatedUser) {
      return updatedUser;
    }

    const reloadedUser = await findUserByClerkId(clerkId);
    if (reloadedUser) {
      return reloadedUser;
    }

    throw new CurrentUserSyncError('Failed to refresh existing user');
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      firstName,
      lastName,
      name,
    })
    .onConflictDoNothing({ target: users.clerkId })
    .returning();

  if (createdUser) {
    return createdUser;
  }

  // Another request created the user after our initial lookup. Re-read the row instead of failing.
  const concurrentlyCreatedUser = await findUserByClerkId(clerkId);
  if (concurrentlyCreatedUser) {
    return concurrentlyCreatedUser;
  }

  throw new CurrentUserSyncError();
}

export function handleCurrentUserError(error: unknown): NextResponse {
  if (error instanceof CurrentUserAuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  console.error('Error syncing current user:', error);

  return NextResponse.json(
    { error: error instanceof CurrentUserSyncError ? error.message : 'Failed to sync current user' },
    { status: 500 }
  );
}
