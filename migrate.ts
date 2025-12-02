import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables from .env.local (matching drizzle.config.ts)
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

// Create a client for migrations, disabling 'prepare' and setting max connections to 1
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(migrationClient);

async function main() {
  try {
    console.log('⏳ Running migrations...');

    await migrate(db, { migrationsFolder: 'drizzle' });

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    // Ensure the connection is closed
    await migrationClient.end();
    process.exit(0);
  }
}

main();

