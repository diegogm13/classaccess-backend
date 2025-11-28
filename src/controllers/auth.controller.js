const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const AuthService = require('../services/auth.service');
const AuthModel = require('../models/Auth.model');

class AuthController {
  /**
   * POST /auth/login - Login de usuario
   */
  static async login(req, res, next) {
    try {
      const { correo, password } = req.body;

      // Buscar usuario por correo
      const user = await AuthModel.findByCorreo(correo);
      
      if (!user) {
        logger.warn('Intento de login fallido - Usuario no encontrado', { correo });
        return ApiResponse.error(res, 'Credenciales incorrectas', 401);
      }

      // Verificar contraseña
      const isValidPassword = await AuthService.comparePassword(password, user.password);
      
      if (!isValidPassword) {
        logger.warn('Intento de login fallido - Contraseña incorrecta', { correo });
        return ApiResponse.error(res, 'Credenciales incorrectas', 401);
      }

      // Verificar estatus del usuario
      if (user.estatus_usu !== true) {
        logger.warn('Intento de login - Usuario inactivo', { correo });
        return ApiResponse.error(res, 'Usuario inactivo. Contacta al administrador.', 403);
      }

      // Generar tokens
      const token = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // 🍪 OPCIONES DE COOKIES CORREGIDAS
      const isProduction = process.env.NODE_ENV === 'production';
      
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // true en producción (HTTPS)
        sameSite: isProduction ? 'none' : 'lax', // 🔥 CAMBIO CRÍTICO
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      };

      // 🍪 Guardar AMBOS tokens en cookies httpOnly
      res.cookie('accessToken', token, cookieOptions);

      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      // 🍪 Guardar datos del usuario en cookie (NO httpOnly para que JS pueda leerlo)
      const userData = {
        id_usu: user.id_usu,
        nombre_usu: user.nombre_usu,
        ap_usu: user.ap_usu,
        am_usu: user.am_usu,
        correo_usu: user.correo_usu,
        priv_usu: user.priv_usu,
        estatus_usu: user.estatus_usu
      };

      res.cookie('userData', JSON.stringify(userData), {
        httpOnly: false, // JS puede leerlo
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 🔥 CAMBIO CRÍTICO
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      // Guardar refresh token en la base de datos
      await AuthModel.saveRefreshToken(user.id_usu, refreshToken);

      logger.info('Login exitoso', { 
        userId: user.id_usu, 
        correo: user.correo_usu,
        priv: user.priv_usu
      });

      // Remover password de la respuesta
      const { password: _, ...userWithoutPassword } = user;

      // 💡 También enviar datos en el body como respaldo
      return ApiResponse.success(res, {
        user: userWithoutPassword,
        // Opcional: enviar tokens también en body para respaldo
        accessToken: token,
        refreshToken: refreshToken
      }, 'Login exitoso');

    } catch (error) {
      logger.error('Error en login', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /auth/logout - Logout de usuario
   */
  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return ApiResponse.error(res, 'No hay sesión activa', 400);
      }

      // Eliminar refresh token de la base de datos
      await AuthModel.deleteRefreshToken(refreshToken);

      const isProduction = process.env.NODE_ENV === 'production';

      // 🍪 Limpiar TODAS las cookies
      const clearOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 🔥 CONSISTENTE
        path: '/'
      };

      res.clearCookie('accessToken', clearOptions);
      res.clearCookie('refreshToken', clearOptions);
      res.clearCookie('userData', {
        ...clearOptions,
        httpOnly: false
      });

      logger.info('Logout exitoso');

      return ApiResponse.success(res, null, 'Logout exitoso');

    } catch (error) {
      logger.error('Error en logout', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /auth/refresh - Renovar access token usando refresh token
   */
  static async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return ApiResponse.error(res, 'Refresh token no proporcionado', 401);
      }

      // Verificar refresh token
      const decoded = AuthService.verifyRefreshToken(refreshToken);

      // Verificar que el token exista en la BD
      const isValid = await AuthModel.verifyRefreshToken(refreshToken);
      
      if (!isValid) {
        return ApiResponse.error(res, 'Refresh token inválido o expirado', 401);
      }

      // Obtener usuario actualizado
      const user = await AuthModel.findById(decoded.id);

      if (!user || user.estatus_usu !== true) {
        return ApiResponse.error(res, 'Usuario no válido', 401);
      }

      // Generar nuevo access token
      const newToken = AuthService.generateToken(user);

      const isProduction = process.env.NODE_ENV === 'production';

      // 🍪 Actualizar cookie de accessToken
      res.cookie('accessToken', newToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 🔥 CONSISTENTE
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      logger.info('Token renovado', { userId: user.id_usu });

      return ApiResponse.success(res, null, 'Token renovado exitosamente');

    } catch (error) {
      logger.error('Error al renovar token', { error: error.message });
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'Refresh token inválido o expirado', 401);
      }
      
      next(error);
    }
  }
}

module.exports = AuthController;