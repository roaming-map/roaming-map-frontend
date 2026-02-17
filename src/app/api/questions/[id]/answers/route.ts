import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { answers, users } from '@/db/schema';
import { validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { createAnswerSchema, answerIdSchema } from '@/validations';
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';

// GET /api/questions/[id]/answers - Get all answers for a specific question
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;
    // Parse and validate the question ID from the URL path
    const questionId = parseInt(id, 10);
    
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
        user: true,
      },
      orderBy: (answers, { desc }) => [desc(answers.createdAt)],
    });

    return NextResponse.json(questionAnswers);
  } catch (error) {
    return handleDatabaseError(error, 'fetch answers');
  }
}

// POST /api/questions/[id]/answers - Create a new answer for a specific question
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;
    // Parse and validate the question ID from the URL path
    const questionId = parseInt(id, 10);
    
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

    // If replying to another answer, ensure parent exists and belongs to this question
    if (validatedData.parentId != null) {
      const parentAnswer = await db.query.answers.findFirst({
        where: eq(answers.id, validatedData.parentId),
      });
      if (!parentAnswer || parentAnswer.questionId !== questionId) {
        return NextResponse.json(
          { error: 'Parent answer not found or does not belong to this question' },
          { status: 400 }
        );
      }
    }

    // Find or create user in our database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // If user doesn't exist OR has demo data, fetch real data from Clerk
    if (!user || user.name === 'Demo User') {
      // Create new user from Clerk data
      try {
        if (!process.env.CLERK_SECRET_KEY) {
          console.error('CLERK_SECRET_KEY is not set');
          return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
          );
        }

        const clerkResponse = await fetch('https://api.clerk.com/v1/users/' + userId, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });

        if (!clerkResponse.ok) {
          console.error('Clerk API error:', clerkResponse.status, await clerkResponse.text());
          return NextResponse.json(
            { error: 'Failed to fetch user data from Clerk' },
            { status: 500 }
          );
        }

        const clerkUser = await clerkResponse.json();

        if (!user) {
          // Create new user
          const [newUser] = await db.insert(users).values({
            clerkId: userId,
            email: clerkUser.email_addresses?.[0]?.email_address || '',
            firstName: clerkUser.first_name || '',
            lastName: clerkUser.last_name || '',
            name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim(),
          }).returning();
          user = newUser;
        } else {
          // Update existing demo user with real data
          const [updatedUser] = await db.update(users)
            .set({
              email: clerkUser.email_addresses?.[0]?.email_address || '',
              firstName: clerkUser.first_name || '',
              lastName: clerkUser.last_name || '',
              name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim(),
              updatedAt: new Date(),
            })
            .where(eq(users.clerkId, userId))
            .returning();
          user = updatedUser;
        }
      } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Create the answer with validated data
    const newAnswer = await db.insert(answers).values({
      content: validatedData.content,
      questionId: questionId,
      parentId: validatedData.parentId ?? null,
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
