import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { answerVotes, answers, users } from '@/db/schema';
import { getOrCreateCurrentUser, handleCurrentUserError, type CurrentDbUser } from '@/lib/server/current-user';
import { notifyOnNewAnswer } from '@/lib/server/notifications';
import { validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { createAnswerSchema } from '@/validations';
import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

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

    const { userId: clerkId } = await auth();
    let currentUserId: number | null = null;

    if (clerkId) {
      const currentUser = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });
      currentUserId = currentUser?.id ?? null;
    }

    // Fetch all answers for the specific question with user information
    const questionAnswers = await db.query.answers.findMany({
      where: eq(answers.questionId, questionId),
      with: {
        user: true,
      },
      orderBy: (answers, { desc }) => [desc(answers.createdAt)],
    });

    const answerIds = questionAnswers.map((answer) => answer.id);
    const helpfulAnswerIds = new Set<number>();

    if (currentUserId != null && answerIds.length > 0) {
      const votes = await db
        .select({ answerId: answerVotes.answerId })
        .from(answerVotes)
        .where(and(eq(answerVotes.userId, currentUserId), inArray(answerVotes.answerId, answerIds)));

      votes.forEach((vote) => helpfulAnswerIds.add(vote.answerId));
    }

    return NextResponse.json(
      questionAnswers.map((answer) => ({
        ...answer,
        helpfulCount: answer.helpfulCount ?? 0,
        isHelpful: helpfulAnswerIds.has(answer.id),
      }))
    );
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

    let user: CurrentDbUser;
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      return handleCurrentUserError(error);
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

    // Create the answer with validated data
    const [newAnswer] = await db.insert(answers).values({
      content: validatedData.content,
      questionId: questionId,
      parentId: validatedData.parentId ?? null,
      createdBy: user.id,
    }).returning();

    try {
      await notifyOnNewAnswer({
        questionId,
        answerId: newAnswer.id,
        actorId: user.id,
        content: validatedData.content,
        parentId: validatedData.parentId ?? null,
      });
    } catch (notifyError) {
      // Don't fail the answer post if notification creation fails
      console.error('Failed to create notification for answer:', notifyError);
    }

    // Fetch the complete answer with user information
    const completeAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, newAnswer.id),
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
