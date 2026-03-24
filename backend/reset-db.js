const knex = require('knex');

const db = knex({
  client: 'postgresql',
  connection: {
    host:     'localhost',
    port:     5432,
    database: 'cbc_learning_dev',
    user:     'postgres',
    password: 'dev_password_123',
  },
});

(async () => {
  try {
    console.log('Dropping all tables...');
    await db.raw(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);
    console.log('✅ Database reset complete');
  } catch (e) {
    console.error('❌ Error resetting database:', e.message);
  } finally {
    await db.destroy();
  }
})();
