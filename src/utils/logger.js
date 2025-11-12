const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: []
});

// 🚀 En producción (Vercel): solo consola
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // 💻 En local: también guarda en archivos
  const logDir = path.join(__dirname, '../../logs');
  
  logger.add(new winston.transports.File({ 
    filename: path.join(logDir, 'error.log'), 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(logDir, 'access.log') 
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(logDir, 'audit.log'),
    level: 'info'
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(logDir, 'security.log'),
    level: 'warn'
  }));

  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Middleware para morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;
