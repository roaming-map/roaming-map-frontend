import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { questions } from '@/db/schema';
import { validatePathParams, validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { questionIdSchema, updateQuestionSchema } from '@/validations';
import { eq } from 'drizzle-orm';

// GET /api/questions/[id] - Get a specific question by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate path parameters
    const pathValidation = validatePathParams({ params }, questionIdSchema);
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id } = pathValidation.data;

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
  { params }: { params: { id: string } }
) {
  try {
    // Validate path parameters
    const pathValidation = validatePathParams({ params }, questionIdSchema);
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id } = pathValidation.data;

    // Validate request body
    const bodyValidation = await validateRequest(req, updateQuestionSchema);
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }

    const validatedData = bodyValidation.data;

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

// DELETE /api/questions/[id] - Delete a specific question
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate path parameters
    const pathValidation = validatePathParams({ params }, questionIdSchema);
    if (!pathValidation.success) {
      return pathValidation.error;
    }
    
    const { id } = pathValidation.data;

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

    // Delete the question
    await db.delete(questions).where(eq(questions.id, id));

    return NextResponse.json({
      message: 'Question deleted successfully!',
    });
  } catch (error) {
    return handleDatabaseError(error, 'delete question');
  }
}
