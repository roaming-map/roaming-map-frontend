import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { questions, users, questionsToCategories } from '@/db/schema';
import { validateRequest, handleDatabaseError } from '@/utils/validation-helpers';
import { createQuestionSchema } from '@/validations';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm'; 


export async function GET() {
  try {
    // Use db.query instead of db.select to leverage your relations
    const allQuestions = await db.query.questions.findMany({
      // The 'with' clause tells Drizzle which related tables to include
      with: {
        // 'user' comes from the 'questionsRelations' object. 'true' means fetch it.
        user: true,
        
        // 'questionsToCategories' also comes from 'questionsRelations'
        questionsToCategories: {
          // Once we have the join table data, we need to go one step further...
          with: {
            // ...and include the actual 'category' data.
            category: true,
          },
        },
        
        // Include answers with user information
        answers: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
    });

    return NextResponse.json(allQuestions);
  } catch (error) {
    return handleDatabaseError(error, 'fetch questions');
  }
}

export async function POST(req: Request) {
  try {
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
    const validation = await validateRequest(req, createQuestionSchema);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return validation.error;
    }
    
    const validatedData = validation.data;

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

    // Create the question with validated data
    try {
      const newQuestion = await db.insert(questions).values({
        question: validatedData.question,
        isUrgent: validatedData.isUrgent,
        createdBy: user.id,
      }).returning();

      // Handle category relationships if categoryIds are provided
      if (validatedData.categoryIds && validatedData.categoryIds.length > 0) {
        try {
          console.log('Inserting categories:', validatedData.categoryIds);
          const categoryRelations = validatedData.categoryIds.map(categoryId => ({
            questionId: newQuestion[0].id,
            categoryId: categoryId,
          }));

          console.log('Category relations:', categoryRelations);
          await db.insert(questionsToCategories).values(categoryRelations);
          console.log('Categories inserted successfully');
        } catch (categoryError) {
          console.error('Error inserting categories:', categoryError);
          // Don't fail the entire request if categories fail
        }
      }

      // Return the newly created question data in the response
      return NextResponse.json({
        message: 'Question posted successfully!',
        question: newQuestion[0],
        categoryIds: validatedData.categoryIds || [],
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { error: 'Failed to create question in database' },
        { status: 500 }
      );
    }

  } catch (error) {
    return handleDatabaseError(error, 'post question');
  }
}