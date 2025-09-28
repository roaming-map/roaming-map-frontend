import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questionsToCategories } from './questionsToCategories';


export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  isUrgent: boolean('is_urgent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by'),
});

export const questionsRelations = relations(questions, ({ many }) => ({
  questionsToCategories: many(questionsToCategories),
}));
