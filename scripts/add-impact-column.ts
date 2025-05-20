import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Create a database client
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log('Starting migration to add organization_impact column...');
  
  try {
    // Execute a raw SQL query to add the column if it doesn't exist
    // We're using a raw query because it's a simple ALTER TABLE command
    await db.execute(`
      ALTER TABLE donations 
      ADD COLUMN IF NOT EXISTS organization_impact TEXT NOT NULL DEFAULT 'Average'
    `);
    
    console.log('Migration complete! Added organization_impact column to donations table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();