import { pgTable, serial, text, timestamp, integer, index, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { questions } from './questions';
import { answers } from './answers';

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // 'answer' | 'reply'
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  answerId: integer('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  body: text('body'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('notifications_user_id_created_at_idx').on(t.userId, t.createdAt),
  index('notifications_user_id_read_at_idx').on(t.userId, t.readAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'userNotifications',
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'actorNotifications',
  }),
  question: one(questions, {
    fields: [notifications.questionId],
    references: [questions.id],
  }),
  answer: one(answers, {
    fields: [notifications.answerId],
    references: [answers.id],
  }),
}));
