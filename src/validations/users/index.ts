import { z } from 'zod';

// Schema for path parameters (e.g., /users/[id])
export const userIdSchema = z.object({
  id: z.string().min(1).transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive('Invalid user ID')
  ),
});

// Schema for user preferences (if you add a settings page later)
export const userPreferencesSchema = z.object({
  notifications: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

// Type exports for TypeScript
export type UserIdParams = z.infer<typeof userIdSchema>;
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;

// Note: createUserSchema and updateUserSchema removed because:
// - Clerk handles user creation/updates
// - Users are auto-created when they first interact with the app
// - Focus validation on business logic (questions) instead
