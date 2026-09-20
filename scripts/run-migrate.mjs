// Run migration script using @neondatabase/serverless
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);
const migrationPath = join(__dirname, '..', 'scripts', 'migrate.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Split on semicolons and run each statement separately
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`🚀 Running ${statements.length} migration statements...`);

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    const firstLine = stmt.split('\n')[0].trim();
    console.log(`  ✅ ${firstLine}`);
  } catch (err) {
    console.error(`  ❌ Failed: ${stmt.split('\n')[0]}`);
    console.error('     ', err.message);
    process.exit(1);
  }
}

console.log('\n✅ Migration complete!');
