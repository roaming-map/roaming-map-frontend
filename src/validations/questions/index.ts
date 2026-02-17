import { z } from 'zod';

// Schema for creating a new question (createdBy is now handled by Clerk auth)
export const createQuestionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  question: z.string()
    .min(1, 'Details are required')
    .min(10, 'Details must be at least 10 characters long')
    .max(1000, 'Details must not exceed 1000 characters'),
  destination: z.string().optional(),
  isUrgent: z.boolean().optional().default(false),
  categoryIds: z.array(z.number().int().positive('Invalid category ID')).optional().default([]),
});

// Schema for updating a question (createdBy cannot be changed)
export const updateQuestionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  question: z.string()
    .min(1, 'Details are required')
    .min(10, 'Details must be at least 10 characters long')
    .max(1000, 'Details must not exceed 1000 characters')
    .optional(),
  isUrgent: z.boolean().optional(),
});

// Schema for path parameters (e.g., /questions/[id])
export const questionIdSchema = z.object({
  id: z.string().min(1).transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive('Invalid question ID')
  ),
});

// Schema for query parameters (e.g., ?urgent=true&limit=10)
export const questionQuerySchema = z.object({
  urgent: z.string().optional().transform((val) => val === 'true'),
  limit: z.string().optional().transform((val) => parseInt(val || '10', 10)).pipe(
    z.number().int().min(1).max(100)
  ),
  offset: z.string().optional().transform((val) => parseInt(val || '0', 10)).pipe(
    z.number().int().min(0)
  ),
});

// Type exports for TypeScript
export type CreateQuestionData = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionData = z.infer<typeof updateQuestionSchema>;
export type QuestionIdParams = z.infer<typeof questionIdSchema>;
export type QuestionQueryParams = z.infer<typeof questionQuerySchema>;
