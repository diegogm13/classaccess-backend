const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const AuthService = require('../services/auth.service');
const AuthModel = require('../models/Auth.model');

class AuthController {

  /**
   * POST /auth/login
   */
  static async login(req, res, next) {
    try {
      const { correo, password } = req.body;

      const user = await AuthModel.findByCorreo(correo);

      if (!user) {
        logger.warn('Intento de login - Usuario no encontrado', { correo });
        return ApiResponse.error(res, 'Credenciales incorrectas', 401);
      }

      const isValid = await AuthService.comparePassword(password, user.password);
      if (!isValid) {
        logger.warn('Intento de login - Contraseña incorrecta', { correo });
        return ApiResponse.error(res, 'Credenciales incorrectas', 401);
      }

      if (user.estatus_usu !== true) {
        logger.warn('Intento de login - Usuario inactivo', { correo });
        return ApiResponse.error(res, 'Usuario inactivo. Contacta al administrador.', 403);
      }

      // Tokens
      const accessToken = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // ⚠️ IMPORTANTE
      res.setHeader("Access-Control-Allow-Credentials", "true");

      // Config general
      const cookieHttpOnly = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: "classaccess-backend.vercel.app",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      const cookieReadable = {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: "classaccess-backend.vercel.app",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      // 🍪 Guardar cookies
      res.cookie("accessToken", accessToken, cookieHttpOnly);

      res.cookie("refreshToken", refreshToken, {
        ...cookieHttpOnly,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie("userData", JSON.stringify({
        id_usu: user.id_usu,
        nombre_usu: user.nombre_usu,
        ap_usu: user.ap_usu,
        am_usu: user.am_usu,
        correo_usu: user.correo_usu,
        priv_usu: user.priv_usu,
        estatus_usu: user.estatus_usu
      }), cookieReadable);

      // Guardar refresh token en BD
      await AuthModel.saveRefreshToken(user.id_usu, refreshToken);

      logger.info("Login exitoso", {
        userId: user.id_usu,
        correo: user.correo_usu
      });

      const { password: _, ...userSanitized } = user;

      return ApiResponse.success(res, { user: userSanitized }, "Login exitoso");

    } catch (error) {
      logger.error("Error en login", { error: error.message });
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken)
        return ApiResponse.error(res, "No hay sesión activa", 400);

      // Eliminamos refresh token de BD
      await AuthModel.deleteRefreshToken(refreshToken);

      const cfg = {
        secure: true,
        sameSite: "none",
        domain: "classaccess-backend.vercel.app",
        path: "/"
      };

      res.clearCookie("accessToken", { ...cfg, httpOnly: true });
      res.clearCookie("refreshToken", { ...cfg, httpOnly: true });
      res.clearCookie("userData", { ...cfg, httpOnly: false });

      logger.info("Logout exitoso");

      return ApiResponse.success(res, null, "Logout exitoso");

    } catch (error) {
      logger.error("Error en logout", { error: error.message });
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   */
  static async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken)
        return ApiResponse.error(res, "Refresh token no proporcionado", 401);

      const decoded = AuthService.verifyRefreshToken(refreshToken);

      const isValid = await AuthModel.verifyRefreshToken(refreshToken);
      if (!isValid)
        return ApiResponse.error(res, "Refresh token inválido o expirado", 401);

      const user = await AuthModel.findById(decoded.id);

      if (!user || user.estatus_usu !== true)
        return ApiResponse.error(res, "Usuario no válido", 401);

      const newAccessToken = AuthService.generateToken(user);

      res.setHeader("Access-Control-Allow-Credentials", "true");

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: "classaccess-backend.vercel.app",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      });

      logger.info("Token renovado", { userId: user.id_usu });

      return ApiResponse.success(res, null, "Token renovado exitosamente");

    } catch (error) {
      logger.error("Error al renovar token", { error: error.message });

      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return ApiResponse.error(res, "Refresh token inválido o expirado", 401);
      }

      next(error);
    }
  }
}

module.exports = AuthController;
