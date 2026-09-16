const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  console.log('--- Existing tables ---');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  const hasGroupDiscussions = tables.rows.some(r => r.table_name === 'group_discussions');
  console.log('\ngroup_discussions table exists (migration 0009 applied):', hasGroupDiscussions);

  const rls = await client.query(`
    select relname, relrowsecurity from pg_class
    where relname in ('users', 'prayer_requests', 'groups') and relkind = 'r'
  `);
  console.log('\n--- RLS status (migration 0010) ---');
  rls.rows.forEach(r => console.log(`${r.relname}: RLS ${r.relrowsecurity ? 'ENABLED' : 'disabled'}`));

  await client.end();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
