const knex = require('knex');
const path = require('path');

// Load compiled seed
const seedModule = require(path.join(__dirname, 'dist/database/seeds/01_demo_data.js'));

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
    console.log('Running demo seed...');
    await seedModule.seed(db);
    console.log('✅ Demo seed completed successfully');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    console.error(e.stack);
  } finally {
    await db.destroy();
  }
})();
