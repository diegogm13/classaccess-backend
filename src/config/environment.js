require('dotenv').config();

const environment = {
  // Entorno de ejecución: development | production
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Puerto del servidor
  PORT: process.env.PORT || 4000,

  // Base de datos
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
  DB_SSL: process.env.DB_SSL === 'true',

  // Seguridad / CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],

  // JWT o autenticación
  JWT_SECRET: process.env.JWT_SECRET || 'secret-key',

  // Otros parámetros opcionales
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validar variables esenciales
if (!environment.DB_CONNECTION_STRING) {
  console.error('❌ ERROR: Falta la variable DB_CONNECTION_STRING en el archivo .env');
  process.exit(1);
}

module.exports = environment;
