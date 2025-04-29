// Check the not-null constraints in the campaigns table
import { exec } from 'child_process';

// SQL command to check for not-null constraints
const sql = `
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'campaigns'
ORDER BY ordinal_position;
`;

// Escape the SQL command for the shell
const escapedSql = sql.replace(/'/g, "'\\''").replace(/\n/g, ' ');

// Construct the psql command using the DATABASE_URL environment variable
const command = `psql "$DATABASE_URL" -c '${escapedSql}'`;

console.log('Checking campaigns table constraints...');

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
  
  console.log('Campaigns table constraints:');
  console.log(stdout);
});