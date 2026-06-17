const { Pool } = require('pg');

function createPool() {
  const config = {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
  };

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Pool(config);
}

const pool = createPool();

module.exports = {
  query: (text, params) => pool.query(text, params).then(r => r.rows),
  queryOne: (text, params) => pool.query(text, params).then(r => r.rows[0] || null),
  execute: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
