const { Client } = require('pg');
const { writeFileSync } = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const tablesResult = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename != 'alembic_version'
    ORDER BY tablename
  `);
  const tables = tablesResult.rows.map(r => r.tablename);

  const lines = [];
  const summary = {};

  for (const table of tables) {
    const result = await client.query('SELECT * FROM "' + table + '"');
    const rows = result.rows;
    const cols = result.fields.map(f => f.name);
    summary[table] = rows.length;
    
    if (rows.length > 0) {
      lines.push('-- Table: ' + table + ' (' + rows.length + ' rows)');
      for (const row of rows) {
        const values = cols.map(col => {
          const v = row[col];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
          if (typeof v === 'number') return String(v);
          if (v instanceof Date) return "'" + v.toISOString() + "'";
          return "'" + String(v).replace(/'/g, "''") + "'";
        });
        const colList = cols.map(c => '"' + c + '"').join(', ');
        const valList = values.join(', ');
        lines.push('INSERT INTO "' + table + '" (' + colList + ') VALUES (' + valList + ');');
      }
      lines.push('');
    }
  }

  await client.end();

  const content = lines.join('\n');
  writeFileSync('/tmp/export.sql', content);

  console.log('Export summary:');
  const sorted = Object.entries(summary).sort((a,b) => a[0].localeCompare(b[0]));
  for (const [table, count] of sorted) {
    console.log('  ' + table + ': ' + count + ' rows');
  }
  console.log('\nTotal tables: ' + tables.length);
  console.log('Total lines in export: ' + lines.length);
}

main().catch(console.error);
