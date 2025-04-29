// This script sets up the database schema
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './shared/schema.js';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // Create tables if they don't exist
  console.log('Setting up database schema...');
  
  // Connection check
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    
    // Create tables using raw SQL to avoid interactive prompting
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        organization TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        donation_type TEXT NOT NULL,
        animals_saved INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vegan_conversions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        animals_saved INTEGER NOT NULL,
        person_name TEXT,
        relationship TEXT NOT NULL,
        conversion_type TEXT NOT NULL,
        notes TEXT,
        conversation BOOLEAN,
        documentary BOOLEAN,
        cooked_meal BOOLEAN,
        restaurant BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_shared (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        reach INTEGER,
        engagement INTEGER,
        description TEXT,
        animals_saved INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        campaign_type TEXT NOT NULL,
        organization TEXT,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        budget INTEGER,
        scope TEXT,
        people_reached INTEGER,
        people_recruited INTEGER,
        animals_saved INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('Database schema setup complete.');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await pool.end();
  }
}

main();