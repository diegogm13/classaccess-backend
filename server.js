require('dotenv').config();
const app = require('./src/App');
const { pool } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// Verificar conexión a base de datos
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error en la conexión a la base de datos:', err);
    process.exit(1);
  }
  logger.info('✅ Conectado a la base de datos PostgreSQL');
  release();
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Cerrando servidor...', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM recibido. Cerrando servidor gracefully...');
  server.close(() => {
    logger.info('💥 Proceso terminado');
  });
});