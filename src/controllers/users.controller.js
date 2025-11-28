const ApiResponse = require('../utils/responses');
const logger = require('../utils/logger');
const UsersService = require('../services/users.service');

class UsersController {
  /**
   * GET /users - Obtener todos los usuarios agrupados
   */
  static async getUsers(req, res, next) {
    try {
      const groupedUsers = await UsersService.getAllUsers();
      
      logger.info('Lista de usuarios solicitada', { 
        adminId: req.user.id_usu,
        totalAlumnos: groupedUsers.alumnos.length,
        totalMaestros: groupedUsers.maestros.length,
        totalAdmins: groupedUsers.administradores.length
      });

      return ApiResponse.success(res, groupedUsers);
    } catch (error) {
      logger.error('Error al obtener usuarios', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /users/register - Crear nuevo usuario
   */
  static async createUser(req, res, next) {
    try {
      const result = await UsersService.createUser(req.body);
      
      logger.info('Usuario creado exitosamente', { 
        userId: result.id_usu, 
        correo: result.correo, 
        priv: result.priv,
        tipo: result.priv === 1 ? 'Alumno' : result.priv === 2 ? 'Maestro' : 'Admin'
      });

      return ApiResponse.success(
        res, 
        result, 
        'Usuario registrado exitosamente', 
        201
      );
    } catch (error) {
      logger.error('Error al crear usuario', { 
        error: error.message,
        correo: req.body.correo
      });
      next(error);
    }
  }

  /**
   * PUT /users/:id/status - Actualizar estatus de usuario
   */
  static async updateUserStatus(req, res, next) {
    const { id } = req.params;
    const { estatus } = req.body;

    try {
      const result = await UsersService.updateUserStatus(id, estatus);
      
      logger.info('Estatus de usuario actualizado', { 
        userId: id, 
        estatus,
        updatedBy: req.user.id_usu
      });

      return ApiResponse.success(
        res, 
        result, 
        'Estatus actualizado correctamente'
      );
    } catch (error) {
      logger.error('Error al actualizar estatus', { 
        error: error.message,
        userId: id 
      });
      next(error);
    }
  }
}

module.exports = UsersController;