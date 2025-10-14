import 'dotenv/config';
import { db } from './src/db/db';
import { categories, questions, questionsToCategories, users } from './src/db/schema';

async function main() {
  console.log('🌱 Clearing existing data...');
  // Clear tables in the correct order to avoid foreign key violations
  await db.delete(questionsToCategories);
  await db.delete(questions);
  await db.delete(users);
  await db.delete(categories);
  console.log('🗑️ Database cleared.');

  console.log('🌱 Seeding database...');

  // 1. Create Users
  const insertedUsers = await db
    .insert(users)
    .values([{ name: 'Ayona' }, { name: 'Amjad' }, { name: 'Tharaka' }])
    .returning();
  console.log('✅ Created users:', insertedUsers);

  // 2. Create Categories
  const insertedCategories = await db
    .insert(categories)
    .values([
      { category: 'Transport' },
      { category: 'Accommodation' },
      { category: 'Attraction' },
    ])
    .returning();
  console.log('✅ Created categories:', insertedCategories);

  // Get user and category objects for easy access
  const userAyona = insertedUsers.find((u) => u.name === 'Ayona');
  const userAmjad = insertedUsers.find((u) => u.name === 'Amjad');
  const userTharaka = insertedUsers.find((u) => u.name === 'Tharaka');

  const transportCat = insertedCategories.find((c) => c.category === 'Transport');
  const accommodationCat = insertedCategories.find((c) => c.category === 'Accommodation');
  const attractionCat = insertedCategories.find((c) => c.category === 'Attraction');

  // Ensure all required data exists before proceeding
  if (!userAyona || !userAmjad || !userTharaka || !transportCat || !accommodationCat || !attractionCat) {
    throw new Error('A user or category was not found after insertion.');
  }

  // 3. Create Questions and assign them to users
  const [questionOne] = await db
    .insert(questions)
    .values({
      question: 'What is the best way to get from the airport to the city center?',
      createdBy: userAyona.id, // Assign question to Ayona
    })
    .returning();

  const [questionTwo] = await db
    .insert(questions)
    .values({
      question: 'Looking for a good hotel near the main museum.',
      createdBy: userAmjad.id, // Assign question to Amjad
    })
    .returning();
    
  const [questionThree] = await db
    .insert(questions)
    .values({
      question: 'Are there any good bus tours that cover all the main sights?',
      createdBy: userTharaka.id, // Assign question to Tharaka
    })
    .returning();

  console.log('✅ Created questions and assigned them to users.');

  // 4. Link questions to categories
  await db.insert(questionsToCategories).values([
    // Link Ayona's question to 'Transport'
    { questionId: questionOne.id, categoryId: transportCat.id },
    // Link Amjad's question to 'Accommodation' and 'Attraction'
    { questionId: questionTwo.id, categoryId: accommodationCat.id },
    { questionId: questionTwo.id, categoryId: attractionCat.id },
    // Link Tharaka's question to 'Transport' and 'Attraction'
    { questionId: questionThree.id, categoryId: transportCat.id },
    { questionId: questionThree.id, categoryId: attractionCat.id },
  ]);
  console.log('✅ Linked questions to their categories.');

  console.log('🌱 Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});

