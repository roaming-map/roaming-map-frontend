import { z } from 'zod';

// Schema for creating a new answer
export const createAnswerSchema = z.object({
  content: z.string()
    .min(1, 'Answer content is required')
    .min(10, 'Answer must be at least 10 characters long')
    .max(2000, 'Answer must not exceed 2000 characters'),
  questionId: z.number().int().positive('Invalid question ID'),
  parentId: z.number().int().positive('Parent answer ID must be valid').optional(),
});

// Schema for updating an answer
export const updateAnswerSchema = z.object({
  content: z.string()
    .min(1, 'Answer content is required')
    .min(10, 'Answer must be at least 10 characters long')
    .max(2000, 'Answer must not exceed 2000 characters')
    .optional(),
  isHelpful: z.boolean().optional(),
});

// Schema for path parameters (e.g., /answers/[id])
export const answerIdSchema = z.object({
  id: z.string().min(1).transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive('Invalid answer ID')
  ),
});

// Schema for marking answer as helpful
export const markHelpfulSchema = z.object({
  isHelpful: z.boolean(),
});

// Type exports for TypeScript
export type CreateAnswerData = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerData = z.infer<typeof updateAnswerSchema>;
export type AnswerIdParams = z.infer<typeof answerIdSchema>;
export type MarkHelpfulData = z.infer<typeof markHelpfulSchema>;
