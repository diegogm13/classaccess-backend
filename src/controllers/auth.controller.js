const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const AuthService = require('../services/auth.service');
const AuthModel = require('../models/Auth.model');

class AuthController {

  // ---------------- LOGIN ----------------
  static async login(req, res, next) {
    try {
      const { correo, password } = req.body;

      const user = await AuthModel.findByCorreo(correo);
      if (!user) return ApiResponse.error(res, "Credenciales incorrectas", 401);

      const passOK = await AuthService.comparePassword(password, user.password);
      if (!passOK) return ApiResponse.error(res, "Credenciales incorrectas", 401);

      if (!user.estatus_usu)
        return ApiResponse.error(res, "Usuario inactivo", 403);

      // tokens
      const accessToken = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      res.setHeader("Access-Control-Allow-Credentials", "true");

      const cfgHttpOnly = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: ".vercel.app", // 🔥 AGREGADO - permite compartir cookies entre subdominios
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      const cfgReadable = {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: ".vercel.app", // 🔥 AGREGADO - permite compartir cookies entre subdominios
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      // cookies
      res.cookie("accessToken", accessToken, cfgHttpOnly);
      res.cookie("refreshToken", refreshToken, {
        ...cfgHttpOnly,
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
      }), cfgReadable);

      await AuthModel.saveRefreshToken(user.id_usu, refreshToken);

      const { password: _, ...userClean } = user;

      // 🔥 Log para debug (opcional, puedes quitarlo después)
      console.log('🍪 Cookies configuradas con domain: .vercel.app');

      return ApiResponse.success(res, { user: userClean }, "Login exitoso");

    } catch (error) {
      logger.error("Error login", error);
      next(error);
    }
  }

  // ---------------- LOGOUT ----------------
  static async logout(req, res) {
    try {
      // 🔥 MODIFICADO - agregar las mismas opciones para poder borrar las cookies
      const clearOptions = {
        path: "/",
        secure: true,
        sameSite: "none",
        domain: ".vercel.app" // 🔥 AGREGADO - debe coincidir con el domain usado al crear la cookie
      };

      res.clearCookie("accessToken", clearOptions);
      res.clearCookie("refreshToken", clearOptions);
      res.clearCookie("userData", clearOptions);

      return ApiResponse.success(res, {}, "Logout exitoso");
    } catch (error) {
      logger.error("Error logout", error);
      return ApiResponse.error(res, "Error al cerrar sesión", 500);
    }
  }

  // ---------------- REFRESH TOKEN ----------------
  static async refreshAccessToken(req, res) {
    try {
      const refresh = req.cookies.refreshToken;
      if (!refresh)
        return ApiResponse.error(res, "No hay refresh token", 401);

      const newAccess = AuthService.refreshAccessToken(refresh);
      if (!newAccess)
        return ApiResponse.error(res, "Refresh token inválido", 403);

      // 🔥 MODIFICADO - agregar domain a la cookie renovada
      res.cookie("accessToken", newAccess, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: ".vercel.app", // 🔥 AGREGADO
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      });

      return ApiResponse.success(res, { accessToken: newAccess }, "Token renovado");

    } catch (error) {
      logger.error("Error refresh token", error);
      return ApiResponse.error(res, "Error al renovar token", 500);
    }
  }
}

module.exports = AuthController;