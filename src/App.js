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

// Security headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Rate limiting
app.use(rateLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
