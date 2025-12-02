import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories } from './schema';

// Create the connection for seeding
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

const seedCategories = async () => {
  console.log('🌱 Seeding categories...');
  
  const categoryData = [
    { category: 'Transport' },
    { category: 'Food' },
    { category: 'Accommodation' },
    { category: 'Attraction' },
    { category: 'Culture/Other' },
  ];

  try {
    // Clear existing categories (optional - for clean reset)
    await db.delete(categories);
    
    // Insert new categories
    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    
    console.log('✅ Categories seeded successfully:');
    insertedCategories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.category}`);
    });
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedCategories().then(() => {
    console.log('🎉 Seeding complete!');
    sql.end();
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Seeding failed:', error);
    sql.end();
    process.exit(1);
  });
}

export { seedCategories };
