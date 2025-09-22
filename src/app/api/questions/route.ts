import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { questions } from '@/db/schema'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Drizzle will perform type validation here based on your schema
    const newQuestion = await db.insert(questions).values({
      question: body.question,
      isUrgent: body.isUrgent,
      createdBy: body.createdBy,
    }).returning();

    // Return the newly created question data in the response
    return NextResponse.json({
      message: 'Question posted successfully!',
      question: newQuestion[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Error posting question:', error);
    return NextResponse.json({
      error: 'Failed to post question',
    }, { status: 500 });
  }
}