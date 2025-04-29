// This script sets up the database schema
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../shared/schema";
import ws from "ws";

// Configure WebSocket support
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Try a simple query to check connection
    const result = await pool.query("SELECT NOW()");
    console.log(`Database connection successful: ${result.rows[0].now}`);

    // Create tables based on the schema
    console.log("Creating tables...");

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Users table created");

    // Donations table
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
    console.log("✅ Donations table created");

    // Vegan conversions table
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
    console.log("✅ Vegan conversions table created");

    // Media shared table
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
    console.log("✅ Media shared table created");

    // Campaigns table
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
    console.log("✅ Campaigns table created");

    // Session table for connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    console.log("✅ Session table created");

    console.log("✅ All tables created successfully!");
  } catch (error) {
    console.error("Database setup failed:", error);
  } finally {
    await pool.end();
  }
}

main();