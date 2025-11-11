const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const UsersService = require('../services/users.service');

class UsersController {
  static async getUsers(req, res, next) {
    try {
      const groupedUsers = await UsersService.getAllUsers();
      return ApiResponse.success(res, groupedUsers);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req, res, next) {
    try {
      const result = await UsersService.createUser(req.body);
      logger.info('Usuario creado', { userId: result.id_usu, correo: result.correo, priv: result.priv });
      return ApiResponse.success(res, result, 'Usuario registrado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req, res, next) {
    const { id } = req.params;
    const { estatus } = req.body;

    try {
      await UsersService.updateUserStatus(id, estatus);
      logger.info('Estatus de usuario actualizado', { userId: id, estatus });
      return ApiResponse.success(res, null, 'Estatus actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsersController;
