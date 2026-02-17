import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { users } from './users';

/**
 * Tracks which users marked which questions as "useful" (one per user per question).
 * Used for like counts and for future XP/leveling.
 */
export const questionUseful = pgTable(
  'question_useful',
  {
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.userId] })]
);
