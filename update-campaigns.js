// Simple migration script using exec instead of a node module
import { exec } from 'child_process';

// SQL command to add the necessary columns to the campaigns table
const sql = `
ALTER TABLE IF EXISTS campaigns 
ADD COLUMN IF NOT EXISTS emails INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_media_actions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS letters INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_actions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_actions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;
`;

// Escape the SQL command for the shell
const escapedSql = sql.replace(/'/g, "'\\''").replace(/\n/g, ' ');

// Construct the psql command using the DATABASE_URL environment variable
const command = `psql "$DATABASE_URL" -c '${escapedSql}'`;

console.log('Executing database migration...');

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration failed: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
    return;
  }
  
  console.log(`Migration successful!`);
  console.log(stdout);
});