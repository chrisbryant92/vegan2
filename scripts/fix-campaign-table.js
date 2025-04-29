// Script to fix the campaign table by modifying NOT NULL constraints
import { exec } from 'child_process';

// SQL commands to modify the campaigns table constraints
const sql = `
-- Make campaign_type and start_date nullable
ALTER TABLE campaigns ALTER COLUMN campaign_type DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN start_date DROP NOT NULL;

-- Print the updated schema
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'campaigns' 
AND column_name IN ('campaign_type', 'start_date')
ORDER BY ordinal_position;
`;

// Escape the SQL command for the shell
const escapedSql = sql.replace(/'/g, "'\\''").replace(/\n/g, ' ');

// Construct the psql command using the DATABASE_URL environment variable
const command = `psql "$DATABASE_URL" -c '${escapedSql}'`;

console.log('Executing constraint modifications...');

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Command failed: ${error.message}`);
    return;
  }
  
  if (stderr && !stderr.includes('NOTICE')) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log('Constraint modifications successful:');
  console.log(stdout);
});