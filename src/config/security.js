const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (mismo dominio, Swagger UI, Postman, herramientas de desarrollo)
    if (!origin) {
      return callback(null, true);
    }
    
    // En producción, permitir el mismo dominio de Vercel
    if (process.env.NODE_ENV === 'production') {
      const currentDomain = process.env.VERCEL_URL || 'classaccess-backend.vercel.app';
      if (origin.includes(currentDomain) || origin.includes('vercel.app')) {
        return callback(null, true);
      }
    }
    
    // Permitir dominios de desarrollo en localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Permitir dominios específicos de la lista
    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    
    // Bloquear otros orígenes
    console.log('🚫 CORS bloqueado para origen:', origin);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

module.exports = { corsOptions };