const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return ApiResponse.unauthorized(res, 'Token no proporcionado');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.info('Usuario autenticado', { 
      userId: decoded.id, 
      email: decoded.correo 
    });
    
    next();
  } catch (error) {
    logger.warn('Token inválido', { token, error: error.message });
    return ApiResponse.unauthorized(res, 'Token inválido o expirado');
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    if (!allowedRoles.includes(req.user.priv_usu)) {
      logger.warn('Acceso denegado', { 
        userId: req.user.id, 
        requiredRole: allowedRoles, 
        userRole: req.user.priv_usu 
      });
      return ApiResponse.forbidden(res, 'No tienes permisos para esta acción');
    }

    next();
  };
};

module.exports = { authenticate, authorize };