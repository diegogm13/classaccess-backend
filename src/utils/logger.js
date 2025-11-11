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
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/access.log') 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/audit.log'),
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/security.log'),
      level: 'warn' // para eventos de seguridad
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;
