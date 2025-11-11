require('dotenv').config();
const app = require('./src/App');
const { pool } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Verifica la conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    logger.error('❌ Error en la conexión a la base de datos:', err);
  } else {
    logger.info('✅ Conectado a la base de datos PostgreSQL');
    release();
  }
});

// Exporta la app sin iniciar servidor
module.exports = app;
