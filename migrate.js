// Simple migration script to add the missing columns to the campaigns table
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure the database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  webSocketConstructor: ws 
});

async function runMigration() {
  try {
    console.log('Starting migration to add missing columns to campaigns table...');
    
    // Add the missing columns
    await pool.query(`
      ALTER TABLE IF EXISTS campaigns 
      ADD COLUMN IF NOT EXISTS emails INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS social_media_actions INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS letters INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS other_actions INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_actions INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();