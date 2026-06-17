const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

module.exports = {
  query: (text, params) => pool.query(text, params).then(r => r.rows),
  queryOne: (text, params) => pool.query(text, params).then(r => r.rows[0] || null),
  execute: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
