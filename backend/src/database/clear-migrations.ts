/**
 * Clear migration history from the database
 * Usage: node -e "require('./dist/database/clear-migrations').run()"
 */

import knex from 'knex';
import type { Knex } from 'knex';

export async function run(): Promise<void> {
  const db: Knex = knex({
    client: 'postgresql',
    connection: process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME     || 'cbc_learning_ecosystem',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
  });

  try {
    console.log('[migration-clear] Clearing migration history…');
    await db('knex_migrations').del();
    await db('knex_migrations_lock').del();
    console.log('[migration-clear] ✅ Migration history cleared');
  } catch (err) {
    console.error('[migration-clear] ❌ Error:', (err as Error).message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Allow direct execution
if (require.main === module) {
  run();
}
