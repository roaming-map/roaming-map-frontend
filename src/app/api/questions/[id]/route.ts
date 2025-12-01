import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { questions, users } from '@/db/schema';
import { validatePathParams, validateRequest, handleDatabaseError, handleAuthError, handleForbiddenError } from '@/utils/validation-helpers';
import { questionIdSchema, updateQuestionSchema } from '@/validations';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/questions/[id] - Get a specific question by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: idParam } = await params;
    // Parse and validate the question ID from the URL path
    const id = parseInt(idParam, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Query the question with relations
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, id),
      with: {
        user: true,
        questionsToCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    return handleDatabaseError(error, 'fetch question');
  }
}

// PUT /api/questions/[id] - Update a specific question
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: idParam } = await params;
    // Parse and validate the question ID from the URL path
    const id = parseInt(idParam, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Validate request body
    const bodyValidation = await validateRequest(req, updateQuestionSchema);
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }

    const validatedData = bodyValidation.data;

    // Get authenticated user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return handleAuthError('Authentication required');
    }

    // Find user in database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return handleAuthError('User not found');
    }

    // Check if question exists
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    // Check ownership - only the creator can update
    if (existingQuestion.createdBy !== user.id) {
      return handleForbiddenError('You can only edit your own questions');
    }

    // Update the question
    const updatedQuestion = await db
      .update(questions)
      .set({
        ...(validatedData.question && { question: validatedData.question }),
        ...(validatedData.isUrgent !== undefined && { isUrgent: validatedData.isUrgent }),
        ...(validatedData.createdBy && { createdBy: validatedData.createdBy }),
      })
      .where(eq(questions.id, id))
      .returning();

    // Return updated question with relations
    const updatedQuestionWithRelations = await db.query.questions.findFirst({
      where: eq(questions.id, id),
      with: {
        user: true,
        questionsToCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Question updated successfully!',
      question: updatedQuestionWithRelations,
    });
  } catch (error) {
    return handleDatabaseError(error, 'update question');
  }
}

// PATCH /api/questions/[id] - Mark question as useful (reaction)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: idParam } = await params;
    // Parse and validate the question ID from the URL path
    const id = parseInt(idParam, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.json();
    const { isUseful } = body;

    if (typeof isUseful !== 'boolean') {
      return NextResponse.json(
        {
          error: 'isUseful must be a boolean',
        },
        { status: 400 }
      );
    }

    // Find the question
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    // Update the useful count
    const newUsefulCount = isUseful 
      ? (existingQuestion.usefulCount || 0) + 1 
      : Math.max(0, (existingQuestion.usefulCount || 0) - 1);

    // Update the question
    const updatedQuestion = await db
      .update(questions)
      .set({
        usefulCount: newUsefulCount,
      })
      .where(eq(questions.id, id))
      .returning();

    return NextResponse.json({
      message: `Question marked as ${isUseful ? 'useful' : 'not useful'}!`,
      question: updatedQuestion[0],
    });

  } catch (error) {
    return handleDatabaseError(error, 'mark question useful');
  }
}

// DELETE /api/questions/[id] - Delete a specific question
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: idParam } = await params;
    // Parse and validate the question ID from the URL path
    const id = parseInt(idParam, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid question ID',
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return handleAuthError('Authentication required');
    }

    // Find user in database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return handleAuthError('User not found');
    }

    // Check if question exists
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    // Check ownership - only the creator can delete
    if (existingQuestion.createdBy !== user.id) {
      return handleForbiddenError('You can only delete your own questions');
    }

    // Delete the question
    await db.delete(questions).where(eq(questions.id, id));

    return NextResponse.json({
      message: 'Question deleted successfully!',
    });
  } catch (error) {
    return handleDatabaseError(error, 'delete question');
  }
}
