const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const AuthModel = require('../models/Auth.model');

class AuthController {
  static async login(req, res, next) {
    const { correo, password } = req.body;

    try {
      const user = await AuthModel.findUserByEmail(correo);

      if (!user) {
        logger.warn('Intento de login fallido', { correo });
        return ApiResponse.unauthorized(res, 'Credenciales inválidas');
      }

      const isPasswordValid = await AuthService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        logger.warn('Intento de login con password incorrecta', { correo });
        return ApiResponse.unauthorized(res, 'Credenciales inválidas');
      }

      const token = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      await AuthModel.saveRefreshToken(user.id_usu, refreshToken);

      delete user.password;

      logger.info('Login exitoso', { userId: user.id_usu, correo: user.correo_usu });

      return ApiResponse.success(
        res,
        { user, token, refreshToken },
        'Login exitoso'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    const { token } = req.body;

    try {
      if (!token) return ApiResponse.unauthorized(res, 'Token requerido');

      const decoded = AuthService.verifyRefreshToken(token);

      const user = await AuthModel.findUserByRefreshToken(token);

      if (!user || user.id_usu !== decoded.id) {
        return ApiResponse.unauthorized(res, 'Refresh token inválido');
      }

      const newAccessToken = AuthService.generateToken(user);

      return ApiResponse.success(
        res,
        { accessToken: newAccessToken },
        'Token renovado correctamente'
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    const { refreshToken } = req.body;

    try {
      if (!refreshToken) return ApiResponse.badRequest(res, 'Refresh token requerido');

      const user = await AuthModel.findUserByRefreshToken(refreshToken);

      if (!user) return ApiResponse.unauthorized(res, 'Refresh token inválido');

      await AuthModel.deleteRefreshToken(user.id_usu);

      logger.info('Logout exitoso', { userId: user.id_usu });

      return ApiResponse.success(res, null, 'Logout exitoso');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
