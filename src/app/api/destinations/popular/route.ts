import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { questions } from '@/db/schema';
import { count, desc, isNotNull } from 'drizzle-orm';

export async function GET() {
    try {
        const popularDestinations = await db.select({
            destination: questions.destination,
            count: count(),
        })
            .from(questions)
            .where(isNotNull(questions.destination))
            .groupBy(questions.destination)
            .orderBy(desc(count()))
            .limit(5);

        // Filter out empty strings if any
        const filteredDestinations = popularDestinations.filter(d => d.destination !== '');

        return NextResponse.json(filteredDestinations);
    } catch (error) {
        console.error('Error fetching popular destinations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch popular destinations' },
            { status: 500 }
        );
    }
}
