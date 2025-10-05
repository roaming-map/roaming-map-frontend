import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { answers, users } from '@/db/schema';
import { validateRequest, handleDatabaseError, validatePathParams } from '@/utils/validation-helpers';
import { updateAnswerSchema, answerIdSchema, markHelpfulSchema } from '@/validations';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

// PUT /api/answers/[id] - Update an answer
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Validate the answer ID from the URL path
    const pathValidation = validatePathParams({ params }, answerIdSchema);
    
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id: answerId } = pathValidation.data;

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

    // Find the user in our database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Find the answer and check if user owns it
    const existingAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
      with: {
        user: true,
      },
    });

    if (!existingAnswer) {
      return NextResponse.json(
        {
          error: 'Answer not found',
        },
        { status: 404 }
      );
    }

    // Check if user owns the answer
    if (existingAnswer.createdBy !== user.id) {
      return NextResponse.json(
        {
          error: 'You can only edit your own answers',
        },
        { status: 403 }
      );
    }

    // Validate the request body using Zod
    const bodyValidation = await validateRequest(req, updateAnswerSchema);
    
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }
    
    const validatedData = bodyValidation.data;

    // Update the answer
    const updatedAnswer = await db.update(answers)
      .set({
        content: validatedData.content || existingAnswer.content,
        isHelpful: validatedData.isHelpful !== undefined ? validatedData.isHelpful : existingAnswer.isHelpful,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, answerId))
      .returning();

    // Fetch the complete updated answer with user information
    const completeAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
      with: {
        user: true,
      },
    });

    return NextResponse.json({
      message: 'Answer updated successfully!',
      answer: completeAnswer,
    });

  } catch (error) {
    return handleDatabaseError(error, 'update answer');
  }
}

// DELETE /api/answers/[id] - Delete an answer
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Validate the answer ID from the URL path
    const pathValidation = validatePathParams({ params }, answerIdSchema);
    
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id: answerId } = pathValidation.data;

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

    // Find the user in our database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Find the answer and check if user owns it
    const existingAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!existingAnswer) {
      return NextResponse.json(
        {
          error: 'Answer not found',
        },
        { status: 404 }
      );
    }

    // Check if user owns the answer
    if (existingAnswer.createdBy !== user.id) {
      return NextResponse.json(
        {
          error: 'You can only delete your own answers',
        },
        { status: 403 }
      );
    }

    // Delete the answer
    await db.delete(answers).where(eq(answers.id, answerId));

    return NextResponse.json({
      message: 'Answer deleted successfully!',
    });

  } catch (error) {
    return handleDatabaseError(error, 'delete answer');
  }
}

// PATCH /api/answers/[id] - Mark answer as helpful (or unhelpful)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Validate the answer ID from the URL path
    const pathValidation = validatePathParams({ params }, answerIdSchema);
    
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id: answerId } = pathValidation.data;

    // Validate the request body using Zod
    const bodyValidation = await validateRequest(req, markHelpfulSchema);
    
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }
    
    const { isHelpful } = bodyValidation.data;

    // Find the answer
    const existingAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!existingAnswer) {
      return NextResponse.json(
        {
          error: 'Answer not found',
        },
        { status: 404 }
      );
    }

    // Update the helpful count
    const newHelpfulCount = isHelpful 
      ? existingAnswer.helpfulCount + 1 
      : Math.max(0, existingAnswer.helpfulCount - 1);

    // Update the answer
    const updatedAnswer = await db.update(answers)
      .set({
        isHelpful: isHelpful,
        helpfulCount: newHelpfulCount,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, answerId))
      .returning();

    return NextResponse.json({
      message: `Answer marked as ${isHelpful ? 'helpful' : 'not helpful'}!`,
      answer: updatedAnswer[0],
    });

  } catch (error) {
    return handleDatabaseError(error, 'mark answer helpful');
  }
}
