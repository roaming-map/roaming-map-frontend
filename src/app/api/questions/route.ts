import { NextResponse } from 'next/server';
import { db } from '@/db/db'; 
import { questions, users } from '@/db/schema';
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
        
        // Include answers for count
        answers: true,
      },
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
      return validation.error;
    }
    
    const validatedData = validation.data;

    // Find or create user in our database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      // Create new user from Clerk data
      const clerkUser = await fetch('https://api.clerk.com/v1/users/' + userId, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then(res => res.json());

      const [newUser] = await db.insert(users).values({
        clerkId: userId,
        email: clerkUser.email_addresses[0]?.email_address || '',
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
        name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim(),
      }).returning();

      user = newUser;
    }

    // Create the question with validated data
    const newQuestion = await db.insert(questions).values({
      question: validatedData.question,
      isUrgent: validatedData.isUrgent,
      createdBy: user.id,
    }).returning();

    // Return the newly created question data in the response
    return NextResponse.json({
      message: 'Question posted successfully!',
      question: newQuestion[0],
    }, { status: 201 });

  } catch (error) {
    return handleDatabaseError(error, 'post question');
  }
}