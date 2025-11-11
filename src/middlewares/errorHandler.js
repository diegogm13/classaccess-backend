const logger = require('../utils/logger');
const ApiResponse = require('../utils/responses');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return ApiResponse.error(res, 'Error de validación', 400, err.details);
  }

  if (err.name === 'UnauthorizedError') {
    return ApiResponse.unauthorized(res, 'Token inválido o expirado');
  }

  if (err.code === '23505') { // Duplicate key PostgreSQL
    return ApiResponse.error(res, 'El registro ya existe', 409);
  }

  return ApiResponse.error(
    res, 
    process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    err.statusCode || 500
  );
};

module.exports = { errorHandler };