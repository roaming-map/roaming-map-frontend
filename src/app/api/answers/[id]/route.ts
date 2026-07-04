import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { answerVotes, answers } from '@/db/schema';
import { getOrCreateCurrentUser, handleCurrentUserError, type CurrentDbUser } from '@/lib/server/current-user';
import { validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { updateAnswerSchema, markHelpfulSchema } from '@/validations';
import { and, count, eq } from 'drizzle-orm';

// PUT /api/answers/[id] - Update an answer
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    // Parse and validate the answer ID from the URL path
    const answerId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(answerId) || answerId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid answer ID',
        },
        { status: 400 }
      );
    }

    let user: CurrentDbUser;
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      return handleCurrentUserError(error);
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
    await db.update(answers)
      .set({
        content: validatedData.content || existingAnswer.content,
        isHelpful: validatedData.isHelpful !== undefined ? validatedData.isHelpful : existingAnswer.isHelpful,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, answerId));

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
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    // Parse and validate the answer ID from the URL path
    const answerId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(answerId) || answerId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid answer ID',
        },
        { status: 400 }
      );
    }

    let user: CurrentDbUser;
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      return handleCurrentUserError(error);
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
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    // Parse and validate the answer ID from the URL path
    const answerId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(answerId) || answerId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid answer ID',
        },
        { status: 400 }
      );
    }

    // Validate the request body using Zod
    const bodyValidation = await validateRequest(req, markHelpfulSchema);
    
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }
    
    const { isHelpful } = bodyValidation.data;

    let user: CurrentDbUser;
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      return handleCurrentUserError(error);
    }

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

    if (isHelpful) {
      await db
        .insert(answerVotes)
        .values({ answerId, userId: user.id })
        .onConflictDoNothing({ target: [answerVotes.answerId, answerVotes.userId] });
    } else {
      await db
        .delete(answerVotes)
        .where(and(eq(answerVotes.answerId, answerId), eq(answerVotes.userId, user.id)));
    }

    const [voteCount] = await db
      .select({ value: count() })
      .from(answerVotes)
      .where(eq(answerVotes.answerId, answerId));
    const helpfulCount = voteCount ? Number(voteCount.value) : 0;

    // Keep answers.helpful_count for fast display, but do not use answers.is_helpful for vote state.
    const [updatedAnswer] = await db
      .update(answers)
      .set({
        helpfulCount,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, answerId))
      .returning();

    return NextResponse.json({
      message: `Answer marked as ${isHelpful ? 'helpful' : 'not helpful'}!`,
      helpfulCount,
      isHelpful,
      answer: {
        ...updatedAnswer,
        helpfulCount,
        isHelpful,
      },
    });

  } catch (error) {
    return handleDatabaseError(error, 'mark answer helpful');
  }
}
