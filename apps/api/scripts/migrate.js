const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Check your .env file.');
    process.exit(1);
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
  const client = new Client({ connectionString: databaseUrl, ssl: isLocal ? false : { rejectUnauthorized: false } });
  await client.connect();

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query(sql);
      console.log(`  ok: ${file}`);
    } catch (err) {
      console.error(`  FAILED: ${file}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }
  console.log('All migrations applied successfully.');
  await client.end();
}

main();
