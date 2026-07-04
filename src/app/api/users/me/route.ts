import { NextResponse } from 'next/server';
import { getOrCreateCurrentUser, handleCurrentUserError } from '@/lib/server/current-user';

// GET /api/users/me - Get or create the current authenticated user's database record
export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    return handleCurrentUserError(error);
  }
}
