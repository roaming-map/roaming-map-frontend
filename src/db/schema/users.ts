import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questions } from './questions';
import { answers } from './answers';

// Defines the 'users' table in the database
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(), // Clerk user ID
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  name: text('name'), // Keep for backward compatibility, will be firstName + lastName
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Defines the relationship for Drizzle ORM
// This tells Drizzle that one user can have many questions and answers
export const usersRelations = relations(users, ({ many }) => ({
  questions: many(questions),
  
  // One user can have many answers
  answers: many(answers),
}));
