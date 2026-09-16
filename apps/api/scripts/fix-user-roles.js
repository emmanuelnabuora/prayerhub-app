const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Applying fix...');
  await client.query(`
    alter table user_roles drop constraint user_roles_pkey;
    alter table user_roles alter column scope_id set default '00000000-0000-0000-0000-000000000000';
    update user_roles set scope_id = '00000000-0000-0000-0000-000000000000' where scope_id is null;
    alter table user_roles alter column scope_id set not null;
    alter table user_roles add primary key (user_id, role_id, scope_type, scope_id);
  `);
  console.log('Fixed.');
  await client.end();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
