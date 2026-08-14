const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

if (!global.pool) {
  pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    // El pooler de Supabase en modo "session" (puerto 5432) solo permite ~15
    // clientes simultáneos en total. En serverless (Vercel) cada instancia fría
    // puede abrir su propio pool, así que hay que dejar mucho margen aquí.
    max: 4,
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
