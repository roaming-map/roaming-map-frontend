import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questionsToCategories } from './questionsToCategories';
import { users } from './users';
import { answers } from './answers';

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  destination: text('destination'), // City or place name
  isUrgent: boolean('is_urgent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),

  questionsToCategories: many(questionsToCategories),

  // One question can have many answers
  answers: many(answers),
}));
