import { integer, pgTable, primaryKey, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questions } from './questions';
import { categories } from './categories';

// This is the join table that connects questions and categories
export const questionsToCategories = pgTable(
  'questions_to_categories',
  {
    // Define columns without inline references
    questionId: integer('question_id').notNull(),
    categoryId: integer('category_id').notNull(),
  },
  // Define all constraints (primary key and foreign keys) in this block
  (t) => ({
    pk: primaryKey({ columns: [t.questionId, t.categoryId] }),

    // Explicitly define the foreign key relationship to the 'questions' table
    questionReference: foreignKey({
      columns: [t.questionId],
      foreignColumns: [questions.id],
    }).onDelete('cascade'), // Good practice: if a question is deleted, its relations are also deleted

    // Explicitly define the foreign key relationship to the 'categories' table
    categoryReference: foreignKey({
      columns: [t.categoryId],
      foreignColumns: [categories.id],
    }).onDelete('cascade'), // Good practice: if a category is deleted, its relations are also deleted
  })
);

// Defines the relationships for querying
export const questionsToCategoriesRelations = relations(questionsToCategories, ({ one }) => ({
  question: one(questions, {
    fields: [questionsToCategories.questionId],
    references: [questions.id],
  }),
  category: one(categories, {
    fields: [questionsToCategories.categoryId],
    references: [categories.id],
  }),
}));

