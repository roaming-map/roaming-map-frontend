import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questionsToCategories } from './questionsToCategories';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), 
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  questionsToCategories: many(questionsToCategories),
}));
