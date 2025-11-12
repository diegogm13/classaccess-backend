const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { corsOptions } = require('./config/security');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { rateLimiter } = require('./middlewares/rateLimit');
const logger = require('./utils/logger');
const setupSwagger = require('./config/swagger');

const app = express();

// 🌐 CORS (mover antes de helmet para evitar conflictos)
app.use(cors(corsOptions));

// 📘 Swagger documentation (ANTES de helmet para que tenga sus propios headers)
setupSwagger(app);

// 🛡️ Security headers (configurado para NO aplicar CSP en rutas de Swagger)
app.use((req, res, next) => {
  // Si es una ruta de Swagger, saltamos helmet CSP
  if (req.path.startsWith('/api/docs')) {
    return next();
  }
  
  // Para el resto de rutas, aplicamos helmet con CSP
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:"],
      },
    },
  })(req, res, next);
});

// 🚦 Rate limiting
app.use(rateLimiter);

// 📦 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🧾 Logging con Morgan y Winston
app.use(morgan('combined', { stream: logger.stream }));

// 🩺 Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🚀 Rutas principales
app.use('/api', routes);

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// 🧱 Error handler global
app.use(errorHandler);

module.exports = app;