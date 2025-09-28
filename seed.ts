import 'dotenv/config';
import { db } from './src/db/db';
import { categories, questions, questionsToCategories } from './src/db/schema/index';

async function main() {
  console.log('🌱 Clearing existing data...');
  // Clear tables to ensure a clean slate on every run
  await db.delete(questionsToCategories);
  await db.delete(questions);
  await db.delete(categories);
  console.log('🗑️ Database cleared.');

  console.log('🌱 Seeding database...');

  // 1. Create the new travel categories
  const insertedCategories = await db
    .insert(categories)
    .values([
      { category: 'Transport' },
      { category: 'Accommodation' },
      { category: 'Attraction' },
      { category: 'Restaurant' },
      { category: 'Shopping' },
      { category: 'Entertainment' },
      { category: 'Other' },
    ])
    .returning();
  console.log('✅ Created categories:', insertedCategories);

  // 2. Create the first question (with one category)
  const [questionOne] = await db
    .insert(questions)
    .values({
      question: 'What is the best way to get from the airport to the city center?',
    })
    .returning();
  console.log('✅ Created Question 1:', questionOne);

  // 3. Create the second question (with two categories)
  const [questionTwo] = await db
    .insert(questions)
    .values({
      question: 'Looking for a good hotel near the main museum.',
    })
    .returning();
  console.log('✅ Created Question 2:', questionTwo);

  // Find the category IDs we need for linking
  const transportCat = insertedCategories.find((c) => c.category === 'Transport');
  const accommodationCat = insertedCategories.find((c) => c.category === 'Accommodation');
  const attractionCat = insertedCategories.find((c) => c.category === 'Attraction');

  // 4. Link Question 1 to the 'Transport' category
  if (questionOne && transportCat) {
    await db.insert(questionsToCategories).values({
      questionId: questionOne.id,
      categoryId: transportCat.id,
    });
    console.log(`✅ Linked Question 1 to '${transportCat.category}'`);
  }

  // 5. Link Question 2 to 'Accommodation' and 'Attraction'
  if (questionTwo && accommodationCat && attractionCat) {
    await db.insert(questionsToCategories).values([
      {
        questionId: questionTwo.id,
        categoryId: accommodationCat.id,
      },
      {
        questionId: questionTwo.id,
        categoryId: attractionCat.id,
      },
    ]);
    console.log(`✅ Linked Question 2 to '${accommodationCat.category}' and '${attractionCat.category}'`);
  }

  console.log('🌱 Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});

