import { pgTable, serial, text, boolean, timestamp, integer, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questions } from './questions';
import { users } from './users';

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').references((): AnyPgColumn => answers.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Answer quality metrics (helpful counts can feed into user XP/level later)
  isHelpful: boolean('is_helpful').default(false),
  helpfulCount: integer('helpful_count').default(0),
  isVerified: boolean('is_verified').default(false), // For verified locals
}, (t) => [
  index('answers_question_id_idx').on(t.questionId),
  index('answers_parent_id_idx').on(t.parentId),
  index('answers_created_by_idx').on(t.createdBy),
]);

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  parent: one(answers, {
    fields: [answers.parentId],
    references: [answers.id],
    relationName: 'answerReplies',
  }),
  user: one(users, {
    fields: [answers.createdBy],
    references: [users.id],
  }),
}));
