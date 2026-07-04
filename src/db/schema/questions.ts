import { pgTable, serial, text, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questionsToCategories } from './questionsToCategories';
import { users } from './users';
import { answers } from './answers';

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  title: text('title'), // Short summary for list view; null for legacy questions
  question: text('question').notNull(), // Full details/body
  destination: text('destination'), // City or place name
  isUrgent: boolean('is_urgent').default(false),
  usefulCount: integer('useful_count').default(0), // Reaction count (like Facebook)
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (t) => [
  index('questions_created_at_idx').on(t.createdAt),
  index('questions_created_by_idx').on(t.createdBy),
  index('questions_destination_idx').on(t.destination),
]);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),

  questionsToCategories: many(questionsToCategories),

  // One question can have many answers
  answers: many(answers),
}));
