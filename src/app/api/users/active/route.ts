import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, answers } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Find users who have answered questions recently
        // We'll join users with answers and order by the most recent answer
        const activeUsers = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            name: users.name,
            email: users.email,
            lastActive: sql<string>`MAX(${answers.createdAt})`,
        })
            .from(users)
            .innerJoin(answers, eq(users.id, answers.createdBy))
            .groupBy(users.id)
            .orderBy(desc(sql`MAX(${answers.createdAt})`))
            .limit(5);

        return NextResponse.json(activeUsers);
    } catch (error) {
        console.error('Error fetching active users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active users' },
            { status: 500 }
        );
    }
}
