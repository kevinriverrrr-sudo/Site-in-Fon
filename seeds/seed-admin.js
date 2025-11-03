require('dotenv').config();
const { env } = require('../src/env');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Configure Postgres first.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const hash = await bcrypt.hash(adminPassword, 10);

  const res = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (res.rowCount === 0) {
    await client.query(
      'INSERT INTO users (email, password_hash, is_admin, email_verified) VALUES ($1, $2, true, $3)',
      [adminEmail, hash, env.FEATURE_EMAIL_VERIFICATION_BYPASS]
    );
    console.log(`Seeded admin user: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
