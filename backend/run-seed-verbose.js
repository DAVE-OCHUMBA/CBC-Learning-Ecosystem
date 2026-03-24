const knex = require('knex');
const path = require('path');

console.log('Starting seed runner...');

// Load compiled seed
console.log('Loading seed module...');
const seedModule = require(path.join(__dirname, 'dist/database/seeds/01_demo_data.js'));
console.log('Seed module loaded. Exports:', Object.keys(seedModule));

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
    console.log('Connecting to database...');
    await db.raw('SELECT 1');
    console.log('✅ Connected');
    
    console.log('Running demo seed...');
    const result = await seedModule.seed(db);
    console.log('Seed result:', result);
    console.log('✅ Demo seed completed');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    console.log('Destroying connection...');
    await db.destroy();
    console.log('Done');
  }
})();
