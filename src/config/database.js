const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

if (!global.pool) {
  pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    logger.error('Error inesperado en el pool de conexiones', err);
  });

  global.pool = pool;
} else {
  pool = global.pool;
}

module.exports = { pool };
