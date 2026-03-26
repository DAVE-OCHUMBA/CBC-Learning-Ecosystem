/**
 * Reset database completely - drops all tables and migration history
 * Usage: node -e "require('./dist/database/reset-db').run()"
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
    console.log('[db-reset] Resetting database…');
    
    // Drop migration tables
    await db.schema.dropTableIfExists('knex_migrations_lock');
    await db.schema.dropTableIfExists('knex_migrations');
    console.log('[db-reset] ✅ Dropped migration tables');

    // Get all tables
    const tables = await db.raw(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    if (tables.rows.length > 0) {
      // Drop all tables
      await db.raw(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
          LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      console.log(`[db-reset] ✅ Dropped ${tables.rows.length} tables`);
    }

    console.log('[db-reset] ✅ Database reset complete');
  } catch (err) {
    console.error('[db-reset] ❌ Error:', (err as Error).message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Allow direct execution
if (require.main === module) {
  run();
}
