import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { handleDatabaseError } from '@/utils/validation-helpers';

// GET /api/users - Get all users
export async function GET() {
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        questions: true,
      },
    });

    return NextResponse.json(allUsers);
  } catch (error) {
    return handleDatabaseError(error, 'fetch users');
  }
}

// Note: POST /api/users removed because:
// - Clerk handles user creation
// - Users are auto-created when they first interact with the app
// - No need for manual user creation API
