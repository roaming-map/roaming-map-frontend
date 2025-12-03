import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { handleDatabaseError, handleNotFoundError } from '@/utils/validation-helpers';
import { eq } from 'drizzle-orm';

// GET /api/users/[id] - Get a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Query the user with relations
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        questions: true,
      },
    });

    if (!user) {
      return handleNotFoundError('User');
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleDatabaseError(error, 'fetch user');
  }
}

// Note: PUT and DELETE methods removed because:
// - Clerk handles user profile updates
// - User deletion should be handled through Clerk
// - Focus API on business logic (questions) instead