// middlewares/auth.js
const ApiResponse = require('../utils/responses');
const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * 🍪 Middleware para autenticar mediante cookies
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener el accessToken de las cookies
    const token = req.cookies.accessToken;

    if (!token) {
      logger.warn('Token no proporcionado en cookies');
      return ApiResponse.error(res, 'No autenticado. Token no proporcionado.', 401);
    }

    // Verificar el token
    const decoded = AuthService.verifyToken(token);

    // Adjuntar información del usuario al request
    req.user = {
      id: decoded.id,
      correo: decoded.correo,
      priv_usu: decoded.priv_usu
    };

    logger.info('Usuario autenticado correctamente', { 
      userId: decoded.id, 
      priv: decoded.priv_usu 
    });

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token inválido', { error: error.message });
      return ApiResponse.error(res, 'Token inválido', 401);
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expirado');
      return ApiResponse.error(res, 'Token expirado. Por favor, inicia sesión nuevamente.', 401);
    }

    logger.error('Error en autenticación', { error: error.message });
    return ApiResponse.error(res, 'Error al autenticar', 500);
  }
};

/**
 * 🛡️ Middleware para autorizar según privilegio
 * @param {Array<number>} allowedPrivileges - Array de privilegios permitidos
 */
const authorize = (...allowedPrivileges) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Intento de autorización sin usuario autenticado');
      return ApiResponse.error(res, 'No autenticado', 401);
    }

    if (!allowedPrivileges.includes(req.user.priv_usu)) {
      logger.warn('Acceso denegado por privilegios insuficientes', {
        userId: req.user.id,
        requiredPriv: allowedPrivileges,
        userPriv: req.user.priv_usu
      });
      return ApiResponse.error(res, 'No tienes permisos para acceder a este recurso', 403);
    }

    next();
  };
};

/**
 * 🔓 Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const decoded = AuthService.verifyToken(token);
      req.user = {
        id: decoded.id,
        correo: decoded.correo,
        priv_usu: decoded.priv_usu
      };
    }

    next();
  } catch (error) {
    // Si falla, simplemente continúa sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};