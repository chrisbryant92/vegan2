import { Pool } from 'pg';
import * as fs from 'fs';

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add organization_impact column...');
    
    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE donations 
      ADD COLUMN IF NOT EXISTS organization_impact TEXT NOT NULL DEFAULT 'average'
    `);
    
    console.log('Migration complete! Added organization_impact column to donations table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

run();