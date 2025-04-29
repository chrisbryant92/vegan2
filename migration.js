// Run this script to update the campaigns table
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Starting database migration...');
    
    // Begin transaction
    await pool.query('BEGIN');

    // Check if the campaigns table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('The campaigns table does not exist. Creating it...');
      
      await pool.query(`
        CREATE TABLE campaigns (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          emails INTEGER DEFAULT 0,
          social_media_actions INTEGER DEFAULT 0,
          letters INTEGER DEFAULT 0,
          other_actions INTEGER DEFAULT 0,
          total_actions INTEGER DEFAULT 0,
          notes TEXT,
          animals_saved INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('Campaigns table created successfully.');
    } else {
      console.log('Campaigns table exists. Checking for required columns...');
      
      // Get existing columns
      const columnResult = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'campaigns'
      `);
      
      const existingColumns = columnResult.rows.map(row => row.column_name);
      console.log('Existing columns:', existingColumns);
      
      const columnsToAdd = {
        'emails': 'INTEGER DEFAULT 0',
        'social_media_actions': 'INTEGER DEFAULT 0',
        'letters': 'INTEGER DEFAULT 0',
        'other_actions': 'INTEGER DEFAULT 0',
        'total_actions': 'INTEGER DEFAULT 0',
        'notes': 'TEXT'
      };
      
      for (const [columnName, columnType] of Object.entries(columnsToAdd)) {
        if (!existingColumns.includes(columnName)) {
          console.log(`Adding column ${columnName}...`);
          await pool.query(`ALTER TABLE campaigns ADD COLUMN ${columnName} ${columnType}`);
          console.log(`Column ${columnName} added successfully.`);
        } else {
          console.log(`Column ${columnName} already exists.`);
        }
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

main().catch(console.error);