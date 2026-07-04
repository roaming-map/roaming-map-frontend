import { pgTable, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { answers } from './answers';
import { users } from './users';

/**
 * Tracks which users marked which answers as helpful (one vote per user per answer).
 */
export const answerVotes = pgTable(
  'answer_votes',
  {
    answerId: integer('answer_id')
      .notNull()
      .references(() => answers.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.answerId, t.userId] }),
    index('answer_votes_answer_id_idx').on(t.answerId),
    index('answer_votes_user_id_idx').on(t.userId),
  ]
);
