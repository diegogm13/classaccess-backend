const ApiResponse = require('../utils/responses');
const TeachersService = require('../services/teachers.service');
const logger = require('../utils/logger');

class TeachersController {
  /**
   * GET /teachers/:id - Obtener información de un profesor
   */
  static async getTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Profesor solo puede ver su propio perfil (priv_usu = 2)
      if (requesterPriv === 2 && requesterId !== parseInt(id)) {
        logger.warn('Profesor intentó acceder a perfil de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver este perfil', 403);
      }

      // 📋 Obtener datos del profesor
      const teacher = await TeachersService.getTeacherById(id);
      
      if (!teacher) {
        logger.warn('Profesor no encontrado', { id });
        return ApiResponse.notFound(res, 'Profesor no encontrado');
      }

      logger.info('Perfil de profesor obtenido', { 
        teacherId: id, 
        requesterId 
      });

      return ApiResponse.success(res, teacher);

    } catch (error) {
      logger.error('Error al obtener profesor', { 
        error: error.message,
        id: req.params.id 
      });
      next(error);
    }
  }

  /**
   * GET /teachers/:id/profile - Obtener perfil completo de un profesor
   */
  static async getTeacherProfile(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Profesor solo puede ver su propio perfil
      if (requesterPriv === 2 && requesterId !== parseInt(id)) {
        logger.warn('Profesor intentó acceder a perfil completo de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver este perfil', 403);
      }

      // 📋 Obtener perfil completo
      const profile = await TeachersService.getTeacherProfile(id);
      
      if (!profile) {
        logger.warn('Perfil de profesor no encontrado', { id });
        return ApiResponse.notFound(res, 'Profesor no encontrado');
      }

      logger.info('Perfil completo de profesor obtenido', { 
        teacherId: id, 
        requesterId 
      });

      return ApiResponse.success(res, profile);

    } catch (error) {
      logger.error('Error al obtener perfil de profesor', { 
        error: error.message,
        id: req.params.id 
      });
      next(error);
    }
  }

  /**
   * GET /teachers/:id/lists - Obtener listas de clases de un profesor
   */
  static async getTeacherLists(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha } = req.query;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      logger.info('Solicitud de listas recibida', { 
        teacherId: id, 
        fecha, 
        requesterId,
        requesterPriv 
      });

      // 🔒 Profesor solo puede ver sus propias listas
      if (requesterPriv === 2 && requesterId !== parseInt(id)) {
        logger.warn('Profesor intentó acceder a listas de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver estas listas', 403);
      }

      // ✅ Validar que se proporcione fecha
      if (!fecha) {
        logger.warn('Solicitud de listas sin fecha', { teacherId: id });
        return ApiResponse.error(res, 'El parámetro "fecha" es requerido', 400);
      }

      // ✅ Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        logger.warn('Formato de fecha inválido', { teacherId: id, fecha });
        return ApiResponse.error(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
      }

      // 📋 Obtener listas de clases
      const resultados = await TeachersService.getTeacherLists(id, fecha);

      logger.info('Listas de profesor obtenidas exitosamente', { 
        teacherId: id, 
        requesterId,
        fecha,
        clasesCount: resultados.length 
      });

      return ApiResponse.success(res, resultados);

    } catch (error) {
      logger.error('Error al obtener listas de profesor', { 
        error: error.message,
        stack: error.stack,
        id: req.params.id,
        fecha: req.query.fecha 
      });
      
      // Manejar errores específicos del servicio
      if (error.message === 'Fecha requerida') {
        return ApiResponse.error(res, error.message, 400);
      }
      
      next(error);
    }
  }
}

module.exports = TeachersController;