// config/security.js

// Lista de orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',

      // 👉 AGREGADO TU FRONTEND REAL
      'https://pagina-class-access.vercel.app'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (postman, mismo dominio, herramientas de desarrollo)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir dominios de producción en Vercel
    if (process.env.NODE_ENV === 'production') {
      const currentDomain = process.env.VERCEL_URL || 'servidor-class-access.vercel.app';

      if (
        origin.includes(currentDomain) ||
        origin.includes('vercel.app') ||
        origin.includes('pagina-class-access.vercel.app') // 👈 IMPORTANTE
      ) {
        return callback(null, true);
      }
    }

    // Permitir localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Permitir dominios específicos de allowedOrigins
    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }

    // Bloquear otros orígenes
    console.log('🚫 CORS bloqueado para origen:', origin);
    callback(new Error('No permitido por CORS'));
  },

  credentials: true, // 👈 NECESARIO PARA COOKIES
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

module.exports = { corsOptions };
