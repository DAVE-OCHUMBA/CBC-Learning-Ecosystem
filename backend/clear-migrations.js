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
    await db('knex_migrations').del();
    await db('knex_migrations_lock').del();
    console.log('✅ Cleared migration history');
  } catch (e) {
    console.error('❌ Error clearing migrations:', e.message);
  } finally {
    await db.destroy();
  }
})();
