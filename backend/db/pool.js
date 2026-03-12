require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5433/openagrinet';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = { pool };
