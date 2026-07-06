import { NextResponse } from 'next/server';
import { db } from '@/db/db';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.category)],
    });

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
