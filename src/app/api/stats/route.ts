import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { questions, answers, users } from '@/db/schema';
import { count, countDistinct } from 'drizzle-orm';

export async function GET() {
    try {
        const [questionsCount] = await db.select({ value: count() }).from(questions);
        const [answersCount] = await db.select({ value: count() }).from(answers);

        // For active locals, we count distinct users who have posted answers
        // Note: We might want to filter by recent activity later, but for now all-time is fine
        const [activeLocalsCount] = await db.select({ value: countDistinct(answers.createdBy) }).from(answers);

        return NextResponse.json({
            questions: questionsCount.value,
            answers: answersCount.value,
            activeLocals: activeLocalsCount.value,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
