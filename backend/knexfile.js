// knexfile.js — CBC Learning Ecosystem
// Supports: local Postgres, Railway Postgres, Neon (serverless Postgres)
require('dotenv').config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'cbc_learning_ecosystem',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl,
    };

module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : { ...connection, database: process.env.DB_NAME || 'cbc_learning_dev' },
    pool: { min: 1, max: 5 },
    migrations: { directory: './src/database/migrations', extension: 'ts' },
    seeds:      { directory: './src/database/seeds',      extension: 'ts' },
  },

  production: {
    client: 'postgresql',
    connection,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: { directory: './dist/database/migrations' },
    seeds:      { directory: './dist/database/seeds' },
    acquireConnectionTimeout: 10000,
  },
};
