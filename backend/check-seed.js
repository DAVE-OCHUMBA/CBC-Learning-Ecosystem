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
    const schools = await db('schools').count('* as count').first();
    const users = await db('users').count('* as count').first();
    const students = await db('students').count('* as count').first();
    console.log(`✅ Database verified:`);
    console.log(`   Schools: ${schools.count}`);
    console.log(`   Users: ${users.count}`);
    console.log(`   Students: ${students.count}`);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.destroy();
  }
})();
