// server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { rateLimiter } = require('./middlewares/rateLimit');
const logger = require('./utils/logger');
const setupSwagger = require('./config/swagger');
const { corsOptions } = require('./config/security'); // <-- Importa corsOptions

const app = express();

// 🌐 CORS - ANTES de Helmet y las rutas
app.use(cors(corsOptions));

// Opcional: manejar preflight OPTIONS explícitamente
app.options('*', cors(corsOptions));

// 🍪 Cookie parser
app.use(cookieParser());

// 📦 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🧾 Logging
app.use(morgan('combined', { stream: logger.stream }));

// 🩺 Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 📘 Swagger
setupSwagger(app);

// 🛡️ Helmet
app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs')) return next();

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })(req, res, next);
});

// 🚦 Rate limiting
app.use(rateLimiter);

// 🚀 Rutas principales
app.use('/api', routes);

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// 🧱 Error handler global
app.use(errorHandler);

module.exports = app;
