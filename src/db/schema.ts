import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  isUrgent: boolean('is_urgent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by'), // User ID who created the post
});
