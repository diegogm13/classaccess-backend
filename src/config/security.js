// config/security.js

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://pagina-class-access.vercel.app'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }
    }

    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }

    console.log('🚫 CORS bloqueado para origen:', origin);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'], // 🔥 AGREGAR ESTO
  optionsSuccessStatus: 200,
  preflightContinue: false
};

module.exports = { corsOptions };