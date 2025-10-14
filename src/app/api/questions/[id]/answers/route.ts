import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { answers, users } from '@/db/schema';
import { validateRequest, handleDatabaseError, validatePathParams } from '@/utils/validation-helpers';
import { createAnswerSchema, answerIdSchema } from '@/validations';
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';

// GET /api/questions/[id]/answers - Get all answers for a specific question
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Parse and validate the question ID from the URL path
    const questionId = parseInt(params.id, 10);
    
    if (isNaN(questionId) || questionId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Fetch all answers for the specific question with user information
    const questionAnswers = await db.query.answers.findMany({
      where: eq(answers.questionId, questionId),
      with: {
        user: true, // Include user information for each answer
      },
      orderBy: (answers, { desc }) => [desc(answers.createdAt)], // Newest answers first
    });

    return NextResponse.json(questionAnswers);
  } catch (error) {
    return handleDatabaseError(error, 'fetch answers');
  }
}

// POST /api/questions/[id]/answers - Create a new answer for a specific question
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Parse and validate the question ID from the URL path
    const questionId = parseInt(params.id, 10);
    
    if (isNaN(questionId) || questionId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Validate the request body using Zod
    const bodyValidation = await validateRequest(req, createAnswerSchema);
    
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }
    
    const validatedData = bodyValidation.data;

    // Find or create user in our database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      // Create new user - for now, use basic info since we're in keyless mode
      const [newUser] = await db.insert(users).values({
        clerkId: userId,
        email: 'demo@example.com', // Placeholder for keyless mode
        firstName: 'Demo',
        lastName: 'User',
        name: 'Demo User',
      }).returning();

      user = newUser;
    }

    // Create the answer with validated data
    const newAnswer = await db.insert(answers).values({
      content: validatedData.content,
      questionId: questionId,
      createdBy: user.id,
    }).returning();

    // Fetch the complete answer with user information
    const completeAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, newAnswer[0].id),
      with: {
        user: true,
      },
    });

    // Return the newly created answer data in the response
    return NextResponse.json({
      message: 'Answer posted successfully!',
      answer: completeAnswer,
    }, { status: 201 });

  } catch (error) {
    return handleDatabaseError(error, 'post answer');
  }
}
