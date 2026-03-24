#!/usr/bin/env node
const knex = require('knex');
const path = require('path');

async function runSeed() {
  const db = knex({
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'cbc_learning_dev',
      user: 'postgres',
      password: 'dev_password_123',
    },
  });

  try {
    console.log('[seed] Loading demo data module...');
    const seedModule = require('./dist/database/seeds/01_demo_data.js');
    
    console.log('[seed] Running seed...');
    await seedModule.seed(db);
    
    const schools = await db('schools').count('* as cnt').first();
    const users = await db('users').count('* as cnt').first();
    const students = await db('students').count('* as cnt').first();
    
    console.log('[seed] ✅ Seed completed successfully!');
    console.log(`[seed]    Schools: ${schools.cnt}`);
    console.log(`[seed]    Users: ${users.cnt}`);
    console.log(`[seed]    Students: ${students.cnt}`);
    
    process.exit(0);
  } catch (err) {
    console.error('[seed] ❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runSeed();
