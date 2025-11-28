const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const AuthService = require('../services/auth.service');
const AuthModel = require('../models/Auth.model');

class AuthController {
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

      // permitir cookies cross-site
      res.setHeader("Access-Control-Allow-Credentials", "true");

      // config cookies
      const cfgHttpOnly = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      const cfgReadable = {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      };

      // guardar cookies
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

      return ApiResponse.success(res, { user: userClean }, "Login exitoso");

    } catch (error) {
      logger.error("Error login", error);
      next(error);
    }
  }
}

module.exports = AuthController;
