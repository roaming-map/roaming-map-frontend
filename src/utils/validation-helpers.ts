import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

// Generic validation function that returns structured error responses
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T; error?: never } | { success: false; data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      ),
    };
  }
}

// Validation function for query parameters
export function validateQueryParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema<T>
): { success: true; data: T; error?: never } | { success: false; data?: never; error: NextResponse } {
  try {
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Invalid query parameters',
        },
        { status: 400 }
      ),
    };
  }
}

// Validation function for path parameters (e.g., /users/[id])
export function validatePathParams<T>(
  params: { params: { [key: string]: string } },
  schema: ZodSchema<T>
): { success: true; data: T; error?: never } | { success: false; data?: never; error: NextResponse } {
  try {
    const validatedData = schema.parse(params.params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid path parameters',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Invalid path parameters',
        },
        { status: 400 }
      ),
    };
  }
}

// Helper function to handle database errors consistently
export function handleDatabaseError(error: unknown, operation: string): NextResponse {
  console.error(`Database error during ${operation}:`, error);
  
  return NextResponse.json(
    {
      error: `Failed to ${operation}`,
    },
    { status: 500 }
  );
}

// Helper function to handle authentication errors
export function handleAuthError(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 401 }
  );
}

// Helper function to handle not found errors
export function handleNotFoundError(resource: string = 'Resource'): NextResponse {
  return NextResponse.json(
    {
      error: `${resource} not found`,
    },
    { status: 404 }
  );
}

// Helper function to handle forbidden errors
export function handleForbiddenError(message: string = 'Access forbidden'): NextResponse {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 403 }
  );
}
