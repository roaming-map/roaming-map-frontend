import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { validatePathParams, handleDatabaseError, handleNotFoundError } from '@/lib/utils';
import { userIdSchema } from '@/validations';
import { eq } from 'drizzle-orm';

// GET /api/users/[id] - Get a specific user by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate path parameters
    const pathValidation = validatePathParams({ params }, userIdSchema);
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id } = pathValidation.data;

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